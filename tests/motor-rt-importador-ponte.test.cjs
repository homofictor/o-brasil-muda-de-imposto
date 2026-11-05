'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { prepararMovimentosImportados } = require('../motor-rt-credito-360/importador-ponte.cjs');
const periodo = { inicio: '2026-01-01', fim: '2026-06-30' };
const base = { codigo: ' 1.01 ', movimentosCentavos: 1200, documentoOrigem: 'balancete-ficticio.csv', competenciaInicio: periodo.inicio, competenciaFim: periodo.fim, revisado: true };
test('preserva origem, competência e valor em centavos', () => {
 const r = prepararMovimentosImportados([base], periodo);
 assert.equal(r.valido, true);
 assert.deepEqual(r.movimentos, [{ codigo: '1.01', movimentosCentavos: 1200, documentoOrigem: 'balancete-ficticio.csv', competenciaInicio: periodo.inicio, competenciaFim: periodo.fim }]);
});
test('não deduz movimentos ausentes', () => assert.equal(prepararMovimentosImportados([], periodo).valido, false));
test('rejeita valores aproximados e não revisados', () => {
 assert.equal(prepararMovimentosImportados([{ ...base, movimentosCentavos: 12.5 }], periodo).valido, false);
 assert.equal(prepararMovimentosImportados([{ ...base, revisado: false }], periodo).valido, false);
});
test('rejeita competência incompatível', () => assert.equal(prepararMovimentosImportados([{...base, competenciaInicio:'2026-02-01'}], periodo).valido, false));
test('rejeita duplicidade normalizada', () => assert.equal(prepararMovimentosImportados([base, {...base,codigo:'1.01'}], periodo).motivo, 'conta_duplicada'));
