'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarConciliacaoEtapa2 } = require('../motor-rt-credito-360/etapa2-conciliacao.cjs');
const { politicaMaterialidadeValida } = require('../motor-rt-credito-360/excecoes-materiais.cjs');

const base = {
  bp: [{ codigo: '1', centavos: 10000 }],
  balancete: [{ codigo: '1', centavos: 12000 }],
  dataBP: '2025-12-31',
  dataBalancete: '2026-06-30',
  movimentos: [{ codigo: '1', movimentosCentavos: 2000 }]
};

test('ponte temporal rejeita politicas incompletas ou arbitrarias', () => {
  for (const politica of [null, {}, { fonte: 'teste' }, { limiteCentavos: -1, fonte: 'teste' },
    { limiteCentavos: 1.5, fonte: 'teste' }, { limiteCentavos: 100, fonte: '   ' },
    { limiteCentavos: 100, fonte: 123 }]) {
    assert.equal(politicaMaterialidadeValida(politica), false);
    const resultado = avaliarConciliacaoEtapa2({ ...base, politicaMaterialidade: politica });
    assert.equal(resultado.politicaPendente, true);
    assert.equal(resultado.revisaoPendente, true);
    assert.equal(resultado.aptoParaProjetar, false);
  }
});

test('ponte temporal conciliada com politica documentada habilita conciliacao', () => {
  const politicaMaterialidade = { limiteCentavos: 100, fonte: 'regra ficticia de teste' };
  assert.equal(politicaMaterialidadeValida(politicaMaterialidade), true);
  const resultado = avaliarConciliacaoEtapa2({ ...base, politicaMaterialidade });
  assert.equal(resultado.ponte.comparavel, true);
  assert.equal(resultado.politicaPendente, false);
  assert.equal(resultado.aptoParaProjetar, true);
  assert.equal(resultado.homologado, false);
});

test('competencias iguais mantem a mesma validacao explicita', () => {
  const resultado = avaliarConciliacaoEtapa2({
    ...base, dataBalancete: base.dataBP, balancete: base.bp,
    politicaMaterialidade: { limiteCentavos: 100, fonte: '' }
  });
  assert.equal(resultado.politicaPendente, true);
  assert.equal(resultado.aptoParaProjetar, false);
});
