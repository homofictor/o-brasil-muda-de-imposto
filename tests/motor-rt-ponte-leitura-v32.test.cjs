'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { registrarLeituraV32 } = require('../motor-rt-credito-360/ponte-leitura-v32.cjs');
const ids = (() => { let n = 0; return () => `documento_${++n}`; })();
test('registra PDFs e planilhas sem fabricar movimentacoes', () => {
 const r = registrarLeituraV32([{name:'bp.pdf'},{name:'dre.xlsx'},{name:'bal.csv'}],
  [{file:'bp.pdf',type:'BP'},{file:'dre.xlsx',type:'DRE'},{file:'bal.csv',type:'Balancete'}],ids);
 assert.equal(r.documentos.length,3); assert.equal(new Set(r.documentos.map(d=>d.idDocumento)).size,3);
 assert.deepEqual(r.movimentos,[]); assert.equal(r.aptoParaProjecao,false);
});
test('nomes iguais recebem identidades distintas',()=>{
 const r=registrarLeituraV32([{name:'bp.pdf'},{name:'bp.pdf'}],[{file:'bp.pdf'},{file:'bp.pdf'}],ids);
 assert.notEqual(r.documentos[0].idDocumento,r.documentos[1].idDocumento);
});
test('rejeita leituras desalinhadas e extensoes invalidas',()=>{
 assert.throws(()=>registrarLeituraV32([{name:'bp.pdf'}],[],ids),/leituras_incompativeis/);
 assert.throws(()=>registrarLeituraV32([{name:'bp.exe'}],[{file:'bp.exe'}],ids),/leitura_sem_origem_confiavel/);
 assert.throws(()=>registrarLeituraV32([{name:'bp.pdf'}],[{file:'outro.pdf'}],ids),/leitura_sem_origem_confiavel/);
});
