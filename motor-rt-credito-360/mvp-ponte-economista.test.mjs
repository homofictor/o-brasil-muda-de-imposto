import test from 'node:test';
import assert from 'node:assert/strict';
import {exemploSinteticoEconomista, compararProjecaoEconomista} from './mvp-ponte-economista.js';
const revisao = {projecaoOriginal: true, ponteTributaria: true, semDuplaContagem: true};
const uma = () => [{ano: 2027, caixaOriginal: 70, servicoDivida: 40, ajusteEBITDA: -5,
  ajusteNCG: 2, ajusteCAPEX: 1, ajusteIR: -1, ajusteIBS: -3, ajusteCBS: -2, ajusteOutros: 0}];
test('reproduz referência do economista e explicita IBS/CBS separadamente', () => {
  const r = compararProjecaoEconomista(uma(), revisao).projecao[0];
  assert.equal(r.caixaOriginal, 70); assert.equal(r.icsdOriginal, 1.75);
  assert.equal(r.ajusteIBS, -3); assert.equal(r.ajusteCBS, -2);
  assert.equal(r.deltaCaixa, -12); assert.equal(r.caixaReforma, 58);
  assert.equal(r.icsdReforma, 1.45);
});
test('NCG negativa libera caixa sem afetar projeção original', () => {
  const l = uma(); l[0].ajusteNCG = -3;
  const r = compararProjecaoEconomista(l, revisao).projecao[0];
  assert.equal(r.caixaReforma, 63); assert.equal(l[0].caixaOriginal, 70);
});
test('bloqueia ausência de qualquer uma das três revisões', () => {
  for (const campo of Object.keys(revisao))
    assert.throws(() => compararProjecaoEconomista(uma(), {...revisao, [campo]: false}), /revisão/);
});
test('rejeita números inválidos, dívida negativa e anos duplicados', () => {
  const l = uma(); l[0].ajusteCBS = NaN;
  assert.throws(() => compararProjecaoEconomista(l, revisao), /finito/);
  const n = uma(); n[0].servicoDivida = -1;
  assert.throws(() => compararProjecaoEconomista(n, revisao), /negativo/);
  assert.throws(() => compararProjecaoEconomista([uma()[0], uma()[0]], revisao), /repetidos/);
});
test('sem dívida não inventa ICSD e não classifica insuficiência', () => {
  const l = uma(); l[0].servicoDivida = 0;
  const r = compararProjecaoEconomista(l, revisao).projecao[0];
  assert.equal(r.icsdOriginal, null); assert.equal(r.icsdReforma, null);
  assert.equal(r.insuficienciaReforma, false);
});
test('oito exercícios, déficit e soma dos efeitos sem mutar entradas', () => {
  const linhas = exemploSinteticoEconomista();
  const antes = JSON.stringify(linhas);
  linhas[7].ajusteOutros = -100;
  const entrada = JSON.stringify(linhas);
  const r = compararProjecaoEconomista(linhas, revisao);
  assert.equal(JSON.stringify(linhas), entrada);
  assert.equal(r.projecao.length, 8);
  assert.ok(r.anosInsuficiencia.includes(2033));
  assert.equal(r.deltaCaixaAcumulado, r.projecao.reduce((s, a) => s + a.deltaCaixa, 0));
  assert.notEqual(JSON.stringify(linhas), antes);
  assert.equal(linhas[7].caixaOriginal, 91);
});
test('a interface usa a mesma ponte e preserva link ao importador existente', async () => {
  const {readFileSync} = await import('node:fs');
  const html = readFileSync(new URL('./projecao-economista.html', import.meta.url), 'utf8');
  assert.match(html, /from '\.\/mvp-ponte-economista\.js'/);
  assert.match(html, /\.\.\/simulador\/v3\/index\.html/);
  assert.match(html, /r-dupla/);
});
