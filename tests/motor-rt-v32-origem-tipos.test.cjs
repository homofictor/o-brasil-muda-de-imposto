'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { importarMovimentosV32 } = require('../motor-rt-credito-360/importador-v32-adaptador.cjs');
const periodo = { inicio: '2026-01-01', fim: '2026-06-30' };
const base = { codigo: '1.01', movimentosCentavos: 1234, competenciaInicio: periodo.inicio, competenciaFim: periodo.fim, revisado: true };
test('origem não textual é rejeitada sem lançar exceção', () => {
  for (const origem of [42, {}, [], true]) {
    assert.deepEqual(importarMovimentosV32([{ file: 'balancete.csv', movimentosRevisados: [{ ...base, documentoOrigem: origem }] }], periodo),
      { valido: false, motivo: 'origem_inconsistente', movimentos: [] });
  }
});
test('origem divergente é rejeitada', () => {
  assert.equal(importarMovimentosV32([{ file: 'balancete.csv', movimentosRevisados: [{ ...base, documentoOrigem: 'outro.csv' }] }], periodo).motivo, 'origem_inconsistente');
});
test('origem válida é preservada após validação', () => {
  const r = importarMovimentosV32([{ file: ' balancete.csv ', movimentosRevisados: [{ ...base, documentoOrigem: 'balancete.csv' }] }], periodo);
  assert.equal(r.valido, true);
  assert.equal(r.movimentos[0].documentoOrigem, 'balancete.csv');
});
