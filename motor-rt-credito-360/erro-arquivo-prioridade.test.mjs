import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { diagnosticarLoteV32, diagnosticarEstadoImportacaoV32 } = require('./diagnostico-lote-v32.cjs');

test('erro no arquivo prevalece sobre documento com leitura aparentemente válida', () => {
  const arquivos = [{ name: 'balanco.pdf', error: 'falha no parser' }];
  const docs = [{ file: 'balanco.pdf', type: 'BP', status: 'success' }];
  const esperado = { indice: 0, estado: 'falha_leitura', requerRevisao: true };
  assert.deepEqual(diagnosticarLoteV32(arquivos, docs).itens[0], esperado);
  assert.deepEqual(diagnosticarEstadoImportacaoV32({ files: arquivos, docs }).itens[0], esperado);
});

test('leitura sem erro permanece não conciliada e nunca libera projeções', () => {
  const resultado = diagnosticarEstadoImportacaoV32({ files: [{ name: 'dre.csv' }], docs: [{ file: 'dre.csv', type: 'DRE', status: 'success' }] });
  assert.equal(resultado.itens[0].estado, 'lido_nao_conciliado');
  assert.equal(resultado.aptoParaProjecao, false);
});
