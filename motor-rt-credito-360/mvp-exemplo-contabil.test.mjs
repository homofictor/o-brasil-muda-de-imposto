import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {conciliarExemploContabil} from './mvp-exemplo-contabil.js';

test('balancete fictício fecha débitos e créditos', () => {
  const r = conciliarExemploContabil();
  assert.equal(r.status, 'conciliacao_aritmetica_sintetica');
  assert.equal(r.balancete.debitos, 1700);
  assert.equal(r.balancete.creditos, 1700);
  assert.equal(r.balancete.diferenca, 0);
});
test('BP e DRE fictícios conciliam após encerramento', () => {
  const r = conciliarExemploContabil();
  assert.equal(r.bp.ativo, 1060);
  assert.equal(r.bp.passivo + r.bp.patrimonio, 1060);
  assert.equal(r.dre.receitaLiquida - r.dre.custos - r.dre.despesas, r.dre.ebitdaIlustrativo);
  assert.equal(r.patrimonio.anterior - r.patrimonio.distribuicoes + r.patrimonio.resultado, r.patrimonio.final);
});
test('NCG operacional separa saldos e variação sem inventar FCADS', () => {
  const r = conciliarExemploContabil();
  assert.deepEqual(r.ncg, {anterior: 220, atual: 230, variacao: 10});
  assert.deepEqual(r.memoriaNCG, {clientes:200, estoques:180, fornecedores:150,
    formula:'clientes + estoques - fornecedores operacionais'});
  assert.match(r.limites, /Não há DFC nem conciliação com FCADS/);
  assert.match(r.limites, /Nenhum dado real/);
});
test('NCG deriva do balancete, não de valores paralelos fixos', async () => {
  const fonte = readFileSync(new URL('./mvp-exemplo-contabil.js', import.meta.url), 'utf8');
  const variante = fonte.replace("rubrica: 'Clientes', valor: 200", "rubrica: 'Clientes', valor: 210")
    .replace("rubrica: 'Caixa e equivalentes', valor: 120", "rubrica: 'Caixa e equivalentes', valor: 110");
  assert.notEqual(variante, fonte);
  const {conciliarExemploContabil: conciliarVariante} = await import('data:text/javascript;base64,'+Buffer.from(variante).toString('base64'));
  const r = conciliarVariante();
  assert.equal(r.bp.diferenca, 0);
  assert.equal(r.ncg.atual, 240);
  assert.equal(r.ncg.variacao, 20);
});
test('NCG bloqueia rubrica operacional ausente, em vez de presumir saldo', async () => {
  const fonte = readFileSync(new URL('./mvp-exemplo-contabil.js', import.meta.url), 'utf8');
  const variante = fonte.replace("rubrica: 'Clientes', valor: 200", "rubrica: 'Outros recebíveis', valor: 200");
  const {conciliarExemploContabil: conciliarVariante} = await import('data:text/javascript;base64,'+Buffer.from(variante).toString('base64'));
  assert.throws(()=>conciliarVariante(), /Rubrica sintética de NCG ausente/);
});
