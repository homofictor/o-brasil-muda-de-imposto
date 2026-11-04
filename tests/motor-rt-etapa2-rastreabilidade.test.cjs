'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarConciliacaoEtapa2 } = require('../motor-rt-credito-360/etapa2-conciliacao.cjs');
const base = {
  bp: [{ codigo: '1', centavos: 10000 }],
  balancete: [{ codigo: '1', centavos: 10500 }],
  dataBP: '2025-12-31',
  dataBalancete: '2026-06-30',
  politicaMaterialidade: { limiteCentavos: 0, fonte: 'exemplo sintético de teste' }
};
const movimento = {
  codigo: '1', movimentosCentavos: 500,
  documentoOrigem: 'balancete sintético de teste',
  competenciaInicio: '2026-01-01', competenciaFim: '2026-06-30'
};
test('ponte documentada e conciliada pode avançar', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [movimento] });
  assert.equal(r.aptoParaProjetar, true);
  assert.equal(r.ponte.comparavel, true);
  assert.equal(r.homologado, false);
});
test('sem documento de origem bloqueia projeção', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [{ ...movimento, documentoOrigem: '' }] });
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.revisaoPendente, true);
  assert.equal(r.motivo, 'rastreabilidade_origem_ou_periodo_nao_documentado');
});
test('competência fora do intervalo bloqueia projeção', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [{ ...movimento, competenciaInicio: '2026-02-01' }] });
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.motivo, 'rastreabilidade_periodo_incompativel');
});
test('data civil impossível bloqueia projeção', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [{ ...movimento, competenciaFim: '2026-02-30' }] });
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.motivo, 'rastreabilidade_origem_ou_periodo_nao_documentado');
});
test('sem movimentações continua bloqueado', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [] });
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.motivo, 'rastreabilidade_movimentos_ausentes');
});
