'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarRastreabilidadeMovimentos: validar } = require('../motor-rt-credito-360/movimentos-rastreabilidade.cjs');
const base = { codigo: '1.01', movimentosCentavos: 0, documentoOrigem: 'balancete fictício', competenciaInicio: '2024-02-29', competenciaFim: '2024-03-31' };
test('aceita ano bissexto e intervalo documentado exato', () => {
  assert.equal(validar([base], { inicio: '2024-02-29', fim: '2024-03-31' }).valido, true);
});
test('rejeita 29 de fevereiro em ano não bissexto', () => {
  assert.equal(validar([{ ...base, competenciaInicio: '2025-02-29' }]).motivo, 'origem_ou_periodo_nao_documentado');
});
test('rejeita período esperado com data civil inexistente', () => {
  assert.equal(validar([base], { inicio: '2024-02-30', fim: '2024-03-31' }).motivo, 'periodo_esperado_invalido');
});
test('rejeita movimento que não cobre integralmente o intervalo esperado', () => {
  assert.equal(validar([{ ...base, competenciaInicio: '2024-03-01' }], { inicio: '2024-02-29', fim: '2024-03-31' }).motivo, 'periodo_incompativel');
});
test('preserva ano 0001 sem deslocamento para 1901', () => {
  const item = { ...base, competenciaInicio: '0001-01-01', competenciaFim: '0001-01-31' };
  assert.equal(validar([item], { inicio: '0001-01-01', fim: '0001-01-31' }).valido, true);
});
