'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { registrarDocumentosAnalisadosV32 } = require('../motor-rt-credito-360/ponte-documentos-analisados-v32.cjs');
const arquivos = [{ name: 'bp.pdf' }];
const id = () => 'documento123';

test('erro explícito bloqueia a leitura', () => {
  assert.throws(() => registrarDocumentosAnalisadosV32(arquivos,
    [{ file: 'bp.pdf', type: 'BP', error: 'PDF ilegível' }], id),
  /documento_com_falha_de_leitura/);
});
test('status falha bloqueia mesmo com tipo informado', () => {
  assert.throws(() => registrarDocumentosAnalisadosV32(arquivos,
    [{ file: 'bp.pdf', type: 'BP', status: 'falha' }], id),
  /documento_com_falha_de_leitura/);
});
test('leitura válida continua pendente de conciliação', () => {
  const result = registrarDocumentosAnalisadosV32(arquivos, [{ file: 'bp.pdf', type: 'BP' }], id);
  assert.equal(result.aptoParaProjecao, false);
  assert.equal(result.documentos[0].idDocumento, 'documento123');
});
test('arquivo sem leitura correspondente não é aceito', () => {
  assert.throws(() => registrarDocumentosAnalisadosV32(arquivos, [], id),
    /documentos_analisados_incompativeis/);
});
