import test from 'node:test';
import assert from 'node:assert/strict';
import {extrairCandidatosRevisados} from './mvp-import-bridge.js';

const candidato = (value, periodMonths = 12) => ({
  accepted: true, applied: true, field: 'currentAssets', value, periodMonths
});

test('duplicatas idênticas preservam uma rubrica', () => {
  assert.equal(extrairCandidatosRevisados([candidato(100), candidato(100)]).length, 1);
});
test('divergência de um centavo exige revisão', () => {
  assert.equal(extrairCandidatosRevisados([candidato(100), candidato(100.01)]).length, 0);
});
test('divergência subcentavo não é silenciada', () => {
  assert.equal(extrairCandidatosRevisados([candidato(100), candidato(100.001)]).length, 0);
});
test('períodos diferentes não são consolidados', () => {
  assert.equal(extrairCandidatosRevisados([candidato(100, 6), candidato(100, 12)]).length, 0);
});
