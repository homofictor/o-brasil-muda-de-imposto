'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarConciliacaoEtapa2 } = require('../motor-rt-credito-360/etapa2-conciliacao.cjs');
const bp = [{ codigo: '1', centavos: 10000 }];
const politicaMaterialidade = { limiteCentavos: 100, fonte: 'critério de teste sintético, não institucional' };
test('saldos conciliados não dispensam política documentada', () => {
  const r = avaliarConciliacaoEtapa2({ bp, balancete: bp });
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.revisaoPendente, true);
  assert.equal(r.politicaPendente, true);
});
test('divergência sem política não é liberada', () => {
  const r = avaliarConciliacaoEtapa2({ bp, balancete: [{ codigo: '1', centavos: 9999 }] });
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.revisaoPendente, true);
});
test('divergência inferior ao limite documentado preservada sem revisão obrigatória', () => {
  const r = avaliarConciliacaoEtapa2({ bp, balancete: [{ codigo: '1', centavos: 9999 }], politicaMaterialidade });
  assert.equal(r.aptoParaProjetar, true);
  assert.equal(r.excecoes[0].diferencaCentavos, 1);
});
test('conta ausente impede projeção mesmo com política', () => {
  const r = avaliarConciliacaoEtapa2({ bp, balancete: [], politicaMaterialidade });
  assert.equal(r.aptoParaProjetar, false);
});
test('duplicidade é rejeitada antes de qualquer projeção', () => {
  assert.throws(() => avaliarConciliacaoEtapa2({ bp: [...bp, ...bp], balancete: bp, politicaMaterialidade }), /duplicada/);
});
