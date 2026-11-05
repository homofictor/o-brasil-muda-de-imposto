'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {diagnosticarEstadoImportacaoV32:diagnosticar}=require('./diagnostico-lote-v32.cjs');
test('mantem indice de arquivos com leitura omitida',()=>{const r=diagnosticar({files:[{name:'bp.pdf'},{name:'dre.csv'},{name:'bal.xlsx'}],docs:[{file:'dre.csv',type:'DRE'}]});assert.deepEqual(r.itens.map(x=>x.estado),['leitura_pendente','lido_nao_conciliado','leitura_pendente']);assert.equal(r.aptoParaProjecao,false)});
test('falha preservada mesmo quando documento nao foi registrado',()=>{const r=diagnosticar({files:[{name:'bp.pdf',error:'erro ficticio'}],docs:[]});assert.equal(r.itens[0].estado,'falha_leitura')});
test('nomes repetidos consumidos uma vez cada',()=>{const r=diagnosticar({files:[{name:'bp.pdf'},{name:'bp.pdf'}],docs:[{file:'bp.pdf',type:'Balanço'}]});assert.deepEqual(r.itens.map(x=>x.estado),['lido_nao_conciliado','leitura_pendente'])});
test('documento excedente nao e descartado silenciosamente',()=>assert.throws(()=>diagnosticar({files:[],docs:[{file:'extra.pdf',type:'BP'}]}),/documentos_sem_arquivo_correspondente/));
test('estado invalido bloqueado',()=>assert.throws(()=>diagnosticar({files:[],docs:null}),/estado_importacao_invalido/));
