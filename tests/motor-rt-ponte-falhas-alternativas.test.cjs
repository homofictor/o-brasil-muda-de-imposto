'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarDocumentosAnalisadosV32 } = require('../motor-rt-credito-360/ponte-documentos-analisados-v32.cjs');

const arquivo = [{ name: 'bp-ficticio.csv' }];
const base = { file: 'bp-ficticio.csv', type: 'Balanço', period: '2025' };
for (const [nome, alteracao] of [
  ['status error', { status: 'error' }],
  ['status FAILED', { status: 'FAILED' }],
  ['ok false', { ok: false }],
  ['success false', { success: false }],
  ['erro vazio explicitamente presente', { error: '' }],
]) {
  test('rejeita leitura não confiável: ' + nome, () => {
    assert.throws(
      () => registrarDocumentosAnalisadosV32(arquivo, [{ ...base, ...alteracao }], () => 'doc-1'),
      { message: 'documento_com_falha_de_leitura' }
    );
  });
}
test('não confunde sucesso explícito com falha', () => {
  assert.doesNotThrow(() =>
    registrarDocumentosAnalisadosV32(arquivo, [{ ...base, status: 'success', ok: true, success: true }], () => 'doc-1')
  );
});
