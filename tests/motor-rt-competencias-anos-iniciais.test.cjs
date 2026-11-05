'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarCompetencias } = require('../motor-rt-credito-360/competencias.cjs');

test('ano 0001 permanece no primeiro seculo', () => {
  assert.equal(validarCompetencias({ dataBP: '0001-01-01', dataBalancete: '0001-01-01' }).comparavel, true);
});
test('ano 0099 nao e convertido para 1999', () => {
  assert.equal(validarCompetencias({ dataBP: '0099-12-31', dataBalancete: '0099-12-31' }).comparavel, true);
});
test('data civil inexistente e rejeitada', () => {
  assert.equal(validarCompetencias({ dataBP: '0099-02-29', dataBalancete: '0099-02-29' }).comparavel, false);
});
test('competencias distintas continuam bloqueadas', () => {
  assert.equal(validarCompetencias({ dataBP: '2025-12-31', dataBalancete: '2026-06-30' }).motivo, 'competencias_distintas');
});
