'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { diagnosticarLoteV32 } = require('./diagnostico-lote-v32.cjs');

test('status de erro com espaços e maiúsculas não passa como leitura válida', () => {
  for (const status of [' ERROR ', ' Failed\n', ' ERRO ', '\tfalha']) {
    const resultado = diagnosticarLoteV32([{ name: 'sintetico.csv' }], [{ file: 'sintetico.csv', type: 'DRE', status }]);
    assert.deepEqual(resultado.itens[0], { indice: 0, estado: 'falha_leitura', requerRevisao: true });
    assert.equal(resultado.aptoParaProjecao, false);
  }
});
test('leitura sem erro continua não conciliada, nunca apta a projeção', () => {
  const resultado = diagnosticarLoteV32([{ name: 'sintetico.csv' }], [{ file: 'sintetico.csv', type: 'DRE', status: ' OK ' }]);
  assert.equal(resultado.itens[0].estado, 'lido_nao_conciliado');
  assert.equal(resultado.aptoParaProjecao, false);
});
