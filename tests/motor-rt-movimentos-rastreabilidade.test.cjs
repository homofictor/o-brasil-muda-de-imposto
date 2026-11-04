'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarRastreabilidadeMovimentos } = require('../motor-rt-credito-360/movimentos-rastreabilidade.cjs');
const base = { codigo: '1.01', movimentosCentavos: 2500, documentoOrigem: 'balancete sintético', competenciaInicio: '2026-01-01', competenciaFim: '2026-06-30' };
test('aceita origem e intervalo explícitos', () => {
  assert.deepEqual(validarRastreabilidadeMovimentos([base]), { valido: true, motivo: null, quantidadeContas: 1 });
});
test('não aceita movimento sem documento', () => {
  assert.equal(validarRastreabilidadeMovimentos([{ ...base, documentoOrigem: '' }]).valido, false);
});
test('não aceita conta duplicada após trim', () => {
  assert.equal(validarRastreabilidadeMovimentos([base, { ...base, codigo: ' 1.01 ' }]).motivo, 'conta_duplicada');
});
test('não aceita período invertido', () => {
  assert.equal(validarRastreabilidadeMovimentos([{ ...base, competenciaFim: '2025-12-31' }]).valido, false);
});
test('não aceita centavos fracionários', () => {
  assert.equal(validarRastreabilidadeMovimentos([{ ...base, movimentosCentavos: 2.5 }]).valido, false);
});
