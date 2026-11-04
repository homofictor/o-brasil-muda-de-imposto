'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarRastreabilidadeMovimentos } = require('../motor-rt-credito-360/movimentos-rastreabilidade.cjs');
const base = { codigo: '1.01', movimentosCentavos: 2500, documentoOrigem: 'balancete fictício', competenciaInicio: '2026-01-01', competenciaFim: '2026-06-30' };
test('aceita intervalo civil válido compatível', () => {
  assert.equal(validarRastreabilidadeMovimentos([base], { inicio: '2026-01-01', fim: '2026-06-30' }).valido, true);
});
test('rejeita dia inexistente', () => {
  assert.equal(validarRastreabilidadeMovimentos([{ ...base, competenciaFim: '2026-02-30' }]).motivo, 'origem_ou_periodo_nao_documentado');
});
test('rejeita intervalo diferente do esperado', () => {
  assert.equal(validarRastreabilidadeMovimentos([base], { inicio: '2026-02-01', fim: '2026-06-30' }).motivo, 'periodo_incompativel');
});
test('rejeita período esperado inválido', () => {
  assert.equal(validarRastreabilidadeMovimentos([base], { inicio: '2026-02-30', fim: '2026-06-30' }).motivo, 'periodo_esperado_invalido');
});
test('preserva comportamento sem intervalo esperado', () => {
  assert.equal(validarRastreabilidadeMovimentos([base]).valido, true);
});
