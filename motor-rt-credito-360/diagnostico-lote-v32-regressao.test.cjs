'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnosticarEstadoImportacaoV32 } = require('./diagnostico-lote-v32.cjs');
const file = name => ({ name });
const doc = (file, status = 'ok') => ({ file, type: 'DRE', status });

test('preserva a posição dos arquivos e sinaliza leituras pendentes', () => {
  const result = diagnosticarEstadoImportacaoV32({ files: [file('a.pdf'), file('b.csv')], docs: [doc('b.csv')] });
  assert.deepEqual(result.itens.map(x => x.estado), ['leitura_pendente', 'lido_nao_conciliado']);
  assert.equal(result.aptoParaProjecao, false);
});
test('erro do arquivo prevalece sobre documento aparentemente válido', () => {
  const result = diagnosticarEstadoImportacaoV32({ files: [{ name: 'a.pdf', error: 'falhou' }], docs: [doc('a.pdf')] });
  assert.equal(result.itens[0].estado, 'falha_leitura');
});
test('não reutiliza documentos de mesmo nome', () => {
  const result = diagnosticarEstadoImportacaoV32({ files: [file('a.pdf'), file('a.pdf'), file('a.pdf')], docs: [doc('a.pdf'), doc('a.pdf', 'ERROR')] });
  assert.deepEqual(result.itens.map(x => x.estado), ['lido_nao_conciliado', 'falha_leitura', 'leitura_pendente']);
});
test('rejeita documentos órfãos', () => {
  assert.throws(() => diagnosticarEstadoImportacaoV32({ files: [file('a.pdf')], docs: [doc('a.pdf'), doc('outro.pdf')] }), /documentos_sem_arquivo_correspondente/);
});
test('rejeita formato não suportado sem liberar projeção', () => {
  const result = diagnosticarEstadoImportacaoV32({ files: [file('a.exe')], docs: [doc('a.exe')] });
  assert.equal(result.itens[0].estado, 'formato_nao_suportado');
  assert.equal(result.aptoParaProjecao, false);
});
