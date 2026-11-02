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
  assert.match(r.limites, /Não há DFC nem conciliação com FCADS/);
  assert.match(r.limites, /Nenhum dado real/);
});
