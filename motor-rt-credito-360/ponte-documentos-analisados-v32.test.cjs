'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { registrarDocumentosAnalisadosV32 } = require('./ponte-documentos-analisados-v32.cjs');

test('metadados reais de PDF e CSV preservam origem sem inventar movimentos', () => {
  let n = 0;
  const result = registrarDocumentosAnalisadosV32(
    [{ name: 'bp.pdf' }, { name: 'dre.csv' }],
    [{ file: 'bp.pdf', type: 'Balanço', period: { year: 2025 }, candidates: [{ value: 100 }] },
     { file: 'dre.csv', type: 'DRE', period: { year: 2025 }, revenueNet: 900 }],
    () => `documento_${++n}`
  );
  assert.equal(result.documentos.length, 2);
  assert.deepEqual(result.movimentos, []);
  assert.equal(result.aptoParaProjecao, false);
  assert.equal(result.documentos[1].tipo, 'DRE');
  assert.notEqual(result.documentos[0].idDocumento, result.documentos[1].idDocumento);
});
test('rejeita leitura associada ao arquivo errado', () => {
  assert.throws(() => registrarDocumentosAnalisadosV32(
    [{ name: 'bp.pdf' }], [{ file: 'outro.pdf', type: 'BP' }]
  ), /documento_analisado_sem_origem/);
});
test('rejeita tipo de demonstrativo ausente', () => {
  assert.throws(() => registrarDocumentosAnalisadosV32(
    [{ name: 'bp.pdf' }], [{ file: 'bp.pdf' }]
  ), /documento_analisado_sem_origem/);
});

test('rejeita status de erro com espaços e caixa variável', () => {
  for (const status of [' ERROR ', ' Failed ', ' FALHA ', ' ErRo ']) {
    assert.throws(() => registrarDocumentosAnalisadosV32(
      [{ name: 'bp.pdf' }], [{ file: 'bp.pdf', type: 'BP', status }]
    ), /documento_com_falha_de_leitura/);
  }
});
