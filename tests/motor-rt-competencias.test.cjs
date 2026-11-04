'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validarCompetencias } = require('../motor-rt-credito-360/competencias.cjs');
test('datas coincidentes são comparáveis', () => assert.equal(validarCompetencias({dataBP:'2025-12-31',dataBalancete:'2025-12-31'}).comparavel,true));
test('períodos distintos exigem revisão', () => assert.equal(validarCompetencias({dataBP:'2025-12-31',dataBalancete:'2026-05-31'}).motivo,'competencias_distintas'));
test('data ausente não é presumida', () => assert.equal(validarCompetencias({dataBP:'2025-12-31'}).revisaoObrigatoria,true));
test('datas impossíveis são rejeitadas', () => assert.equal(validarCompetencias({dataBP:'2025-02-29',dataBalancete:'2025-02-29'}).comparavel,false));

test('data ISO real válida é aceita sem bloqueio indevido', () => {
  const resultado = validarCompetencias({ dataBP: '2026-06-30', dataBalancete: '2026-06-30' });
  assert.equal(resultado.comparavel, true);
  assert.equal(resultado.revisaoObrigatoria, false);
});
