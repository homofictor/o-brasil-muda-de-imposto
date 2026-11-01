import test from 'node:test';
import assert from 'node:assert/strict';
import {analisarFolgaCredito} from './mvp-alertas-credito.js';
const linha = (ano, original, ajustado, divida = 40) => ({ano, caixaOriginal: original, caixaReforma: ajustado, servicoDivida: divida});

test('distingue déficit preexistente de déficit novo no cenário ajustado', () => {
  const r = analisarFolgaCredito([linha(2027, 30, 20), linha(2028, 50, 35)]);
  assert.deepEqual(r.anosDeficitReferencia, [2027]);
  assert.deepEqual(r.anosNovosDeficits, [2028]);
  assert.equal(r.exercicios[1].folgaOriginal, 10);
  assert.equal(r.exercicios[1].folgaReforma, -5);
  assert.match(r.exercicios[0].alerta, /já na referência/);
});

test('reconhece recuperação e redução de folga sem falso déficit', () => {
  const r = analisarFolgaCredito([linha(2027, 30, 45), linha(2028, 60, 50)]);
  assert.deepEqual(r.anosDeficitsRevertidos, [2027]);
  assert.deepEqual(r.anosNovosDeficits, []);
  assert.match(r.exercicios[1].alerta, /Folga reduzida/);
});

test('sem serviço da dívida não inventa cobertura insuficiente', () => {
  const r = analisarFolgaCredito([linha(2027, -10, -20, 0)]);
  assert.deepEqual(r.anosDeficitReferencia, []);
  assert.deepEqual(r.anosNovosDeficits, []);
  assert.match(r.exercicios[0].alerta, /não aplicável/);
});

test('não altera a projeção original e rejeita entradas inconsistentes', () => {
  const p = [linha(2027, 70, 60)];
  const original = JSON.stringify(p);
  analisarFolgaCredito(p);
  assert.equal(JSON.stringify(p), original);
  assert.throws(() => analisarFolgaCredito([linha(2027, 70, NaN)]), /inválido/);
  assert.throws(() => analisarFolgaCredito([linha(2027, 70, 60, -1)]), /negativo/);
  assert.throws(() => analisarFolgaCredito([linha(2027, 70, 60), linha(2027, 70, 60)]), /repetido/);
});
