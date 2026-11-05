'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarRastreabilidadeMovimentos } = require('../motor-rt-credito-360/movimentos-rastreabilidade.cjs');

function movimento(inicio, fim) {
  return [{ codigo: '1.01', movimentosCentavos: 100, documentoOrigem: 'EXEMPLO FICTICIO',
    competenciaInicio: inicio, competenciaFim: fim }];
}
test('ano 0004 bissexto aceita 29 de fevereiro', () => {
  assert.equal(validarRastreabilidadeMovimentos(movimento('0004-02-29', '0004-02-29')).valido, true);
});
test('ano 0001 rejeita 29 de fevereiro', () => {
  assert.equal(validarRastreabilidadeMovimentos(movimento('0001-02-29', '0001-02-29')).valido, false);
});
test('ano 0099 rejeita dia 31 em abril', () => {
  assert.equal(validarRastreabilidadeMovimentos(movimento('0099-04-31', '0099-04-31')).valido, false);
});
test('ano contemporaneo mantem verificacao de periodo', () => {
  assert.equal(validarRastreabilidadeMovimentos(movimento('2026-01-01', '2026-06-30'),
    { inicio: '2026-01-01', fim: '2026-06-30' }).valido, true);
});
