'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { importarComIdentidadeV32 } = require('../ingestao-v32.cjs');
test('atribui identidades distintas a nomes repetidos sem inventar movimentos', () => {
  let n = 0;
  const r = importarComIdentidadeV32([{file:'balancete.csv'},{file:'balancete.csv'}], {}, () => `doc_${String(++n).padStart(8,'0')}`);
  assert.equal(r.valido,false);
  assert.equal(r.motivo,'movimentos_revisados_ausentes');
  assert.deepEqual(r.documentos,[]);
});
test('rejeita identificadores gerados duplicados', () => {
  const r=importarComIdentidadeV32([{file:'a.csv'},{file:'b.csv'}],{},()=> 'doc_00000001');
  assert.equal(r.valido,false);
  assert.equal(r.motivo,'identificador_documental_duplicado');
});
test('rejeita identificador preexistente para impedir substituicao silenciosa', () => {
  const r=importarComIdentidadeV32([{file:'a.csv',idDocumento:'doc_00000001'}],{},()=> 'doc_00000002');
  assert.equal(r.motivo,'identificador_preexistente');
});
