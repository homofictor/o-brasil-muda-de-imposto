'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnosticarLoteV32 } = require('./diagnostico-lote-v32.cjs');

test('formato não suportado exige revisão sem perder posição do lote', () => {
  const r = diagnosticarLoteV32(
    [{ name: 'dados.exe' }, { name: 'dre.CSV' }],
    [{ file: 'dados.exe', type: 'dre' }, { file: 'dre.CSV', type: 'dre' }]
  );
  assert.equal(r.itens[0].estado, 'formato_nao_suportado');
  assert.equal(r.itens[1].estado, 'lido_nao_conciliado');
  assert.equal(r.falhas, 1);
  assert.equal(r.aptoParaProjecao, false);
});

test('formato suportado com erro continua bloqueado', () => {
  const r = diagnosticarLoteV32(
    [{ name: 'bp.pdf' }],
    [{ file: 'bp.pdf', type: 'bp', status: ' FAILED ' }]
  );
  assert.equal(r.itens[0].estado, 'falha_leitura');
});
