'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { atribuirIdentidadesIngestao } = require('../identidade-ingestao.cjs');
test('identifica dois arquivos de mesmo nome com IDs distintos', () => {
  let n=0;
  const r=atribuirIdentidadesIngestao([{file:'balancete.csv'},{file:'balancete.csv'}],()=>`doc_${String(++n).padStart(8,'0')}`);
  assert.notEqual(r[0].idDocumento,r[1].idDocumento);
});
test('rejeita identificador explicitamente nulo',()=>{
  assert.throws(()=>atribuirIdentidadesIngestao([{file:'balancete.csv',idDocumento:null}],()=> 'doc_00000001'),{message:'identificador_preexistente'});
});
test('rejeita identificador explicitamente indefinido',()=>{
  assert.throws(()=>atribuirIdentidadesIngestao([{file:'balancete.csv',idDocumento:undefined}],()=> 'doc_00000001'),{message:'identificador_preexistente'});
});
test('rejeita duplicidade gerada',()=>{
  assert.throws(()=>atribuirIdentidadesIngestao([{file:'a.csv'},{file:'b.csv'}],()=> 'doc_00000001'),{message:'identificador_documental_duplicado'});
});
