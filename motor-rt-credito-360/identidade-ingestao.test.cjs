'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { atribuirIdentidadesIngestao } = require('./identidade-ingestao.cjs');
test('distingue arquivos com nomes iguais e preserva originais', () => {
 const docs = [{file:'balancete.csv'}, {file:'balancete.csv'}];
 let n = 0;
 const out = atribuirIdentidadesIngestao(docs, () => `documento_${++n}`);
 assert.deepEqual(out.map(d => d.idDocumento), ['documento_1','documento_2']);
 assert.equal(docs[0].idDocumento, undefined);
});
test('rejeita colisao de identificadores', () => assert.throws(() => atribuirIdentidadesIngestao([{file:'a.pdf'},{file:'b.pdf'}], () => 'documento_1'), /duplicado/));
test('rejeita identidade preexistente sem sobrescrever', () => assert.throws(() => atribuirIdentidadesIngestao([{file:'a.pdf',idDocumento:'documento_1'}]), /preexistente/));
test('rejeita arquivo sem origem', () => assert.throws(() => atribuirIdentidadesIngestao([{file:''}]), /origem/));
test('rejeita identificador invalido', () => assert.throws(() => atribuirIdentidadesIngestao([{file:'a.csv'}], () => 'x'), /invalido/));
