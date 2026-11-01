import test from 'node:test';
import assert from 'node:assert/strict';
import {decomporImpactoCaixa} from './mvp-decomposicao-caixa.js';

const linha = () => ({ano: 2027, caixaOriginal: 70, caixaReforma: 58, deltaCaixa: -12,
  ajusteEBITDA: -5, ajusteNCG: 2, ajusteCAPEX: 1, ajusteIR: -1,
  ajusteIBS: -3, ajusteCBS: -2, ajusteOutros: 0});

test('decompõe efeito de caixa com sinais corretos e IBS/CBS separados', () => {
  const r = decomporImpactoCaixa([linha()]);
  assert.deepEqual(r.exercicios[0].componentes, {
    EBITDA: -5, NCG: -2, CAPEX: -1, IR: 1, IBS: -3, CBS: -2, Outros: 0
  });
  assert.equal(r.deltaCaixaAcumulado, -12);
  assert.deepEqual(r.maiorPressao, {rubrica: 'EBITDA', efeito: -5});
});

test('soma por rubrica e acumula efeitos de dois anos sem alterar entrada', () => {
  const a = linha(); const b = {...linha(), ano: 2028, caixaOriginal: 80, caixaReforma: 68};
  const entrada = JSON.stringify([a,b]);
  const r = decomporImpactoCaixa([a,b]);
  assert.equal(r.exercicios[1].acumulado, -24);
  assert.equal(r.totais.IBS, -6);
  assert.equal(r.totais.CBS, -4);
  assert.equal(JSON.stringify([a,b]), entrada);
});

test('bloqueia delta não conciliado e caixa ajustado incompatível', () => {
  const a = linha(); a.deltaCaixa = -11;
  assert.throws(() => decomporImpactoCaixa([a]), /não concilia/);
  const b = linha(); b.caixaReforma = 60;
  assert.throws(() => decomporImpactoCaixa([b]), /não concilia/);
});

test('bloqueia números inválidos e anos repetidos ou fora do horizonte', () => {
  const a = linha(); a.ajusteCBS = NaN;
  assert.throws(() => decomporImpactoCaixa([a]), /finito/);
  assert.throws(() => decomporImpactoCaixa([linha(),linha()]), /fora de ordem/);
  assert.throws(() => decomporImpactoCaixa([{...linha(),ano:2034}]), /fora de ordem/);
});

test('não inventa pressão tributária quando ajustes são neutros', () => {
  const a = {...linha(), caixaReforma:70, deltaCaixa:0, ajusteEBITDA:0,
    ajusteNCG:0, ajusteCAPEX:0, ajusteIR:0, ajusteIBS:0, ajusteCBS:0};
  const r = decomporImpactoCaixa([a]);
  assert.equal(r.maiorPressao, null);
  assert.equal(r.deltaCaixaAcumulado, 0);
});
