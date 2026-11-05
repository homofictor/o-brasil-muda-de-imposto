'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnosticarLoteV32 } = require('./diagnostico-lote-v32.cjs');
test('preserva a posição de cada arquivo inclusive falha', () => {
 const r = diagnosticarLoteV32([{name:'a.pdf'},{name:'b.csv'}],
 [{file:'a.pdf',type:'DRE'},{file:'b.csv',status:'erro',error:'falhou'}]);
 assert.deepEqual(r.itens.map(x=>x.estado), ['lido_nao_conciliado','falha_leitura']);
 assert.equal(r.falhas,1);assert.equal(r.aptoParaProjecao,false);
 assert.equal(JSON.stringify(r).includes('a.pdf'),false);
});
test('origem trocada exige revisão',()=>{
 const r=diagnosticarLoteV32([{name:'a.pdf'}],[{file:'b.pdf',type:'BP'}]);
 assert.equal(r.itens[0].estado,'origem_inconsistente');
});
test('lote desalinhado é rejeitado',()=>{
 assert.throws(()=>diagnosticarLoteV32([{name:'a.pdf'}],[]),/incompativel/);
});
test('não considera documento lido como conciliado',()=>{
 const r=diagnosticarLoteV32([{name:'a.xlsx'}],[{file:'a.xlsx',type:'BP'}]);
 assert.equal(r.aptoParaProjecao,false);
});
