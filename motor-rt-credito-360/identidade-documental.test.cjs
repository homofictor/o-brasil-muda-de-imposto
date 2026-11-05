'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validarIdentidadesDocumentais: validar } = require('./identidade-documental.cjs');
test('aceita nomes iguais com IDs distintos', () => assert.equal(validar([{idDocumento:'doc_00000001',file:'a.pdf'},{idDocumento:'doc_00000002',file:'a.pdf'}]).valido,true));
test('rejeita ID repetido', () => assert.equal(validar([{idDocumento:'doc_00000001'},{idDocumento:'doc_00000001'}]).motivo,'identificador_documental_duplicado'));
test('rejeita ID ausente', () => assert.equal(validar([{file:'a.pdf'}]).motivo,'identificador_documental_invalido'));
test('rejeita ID com caminho ou espacos', () => assert.equal(validar([{idDocumento:'../../doc_01'}]).valido,false));
test('rejeita lote vazio', () => assert.equal(validar([]).motivo,'documentos_ausentes'));
