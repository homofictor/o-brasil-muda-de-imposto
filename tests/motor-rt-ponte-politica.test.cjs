'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarConciliacaoEtapa2 } = require('../motor-rt-credito-360/etapa2-conciliacao.cjs');

const base = {
  bp: [{ codigo: '1', centavos: 10000 }],
  balancete: [{ codigo: '1', centavos: 12000 }],
  dataBP: '2025-12-31',
  dataBalancete: '2026-06-30',
  movimentos: [{ codigo: '1', movimentosCentavos: 2000 }]
};

test('ponte conciliada sem politica nao libera projecao', () => {
  const resultado = avaliarConciliacaoEtapa2(base);
  assert.equal(resultado.ponte.comparavel, true);
  assert.equal(resultado.politicaPendente, true);
  assert.equal(resultado.revisaoPendente, true);
  assert.equal(resultado.aptoParaProjetar, false);
});

test('ponte conciliada com politica informada libera somente a etapa de conciliacao', () => {
  const resultado = avaliarConciliacaoEtapa2({
    ...base, politicaMaterialidade: { limiteCentavos: 100, fonte: 'criterio sintetico de teste' }
  });
  assert.equal(resultado.ponte.comparavel, true);
  assert.equal(resultado.politicaPendente, false);
  assert.equal(resultado.revisaoPendente, false);
  assert.equal(resultado.aptoParaProjetar, true);
  assert.equal(resultado.homologado, false);
});

test('ponte divergente permanece bloqueada mesmo com politica', () => {
  const resultado = avaliarConciliacaoEtapa2({
    ...base,
    movimentos: [{ codigo: '1', movimentosCentavos: 1999 }],
    politicaMaterialidade: { limiteCentavos: 100, fonte: 'criterio sintetico de teste' }
  });
  assert.equal(resultado.ponte.comparavel, false);
  assert.equal(resultado.revisaoPendente, true);
  assert.equal(resultado.aptoParaProjetar, false);
});
