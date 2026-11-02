import test from 'node:test';
import assert from 'node:assert/strict';
import {resumirPendenciasEtapa2} from './mvp-etapa2-pendencias.js';

const rascunho = (extra={}) => ({documentoRef:'doc_1',linhaOrigem:1,formato:'CSV',valor:120,
 unidade:'nao_confirmada',grupo:null,periodo:null,revisado:false,aptoParaConciliacao:false,...extra});

test('etapa 2 identifica pendências sem aprovar automaticamente os dados extraídos',()=>{
 const r=resumirPendenciasEtapa2([rascunho()]);
 assert.deepEqual(r,{total:1,pendentes:1,aptoParaConciliacao:false,aplicadoProjecao:false});
});
test('lote vazio não inventa dados nem confirmação',()=>{
 assert.deepEqual(resumirPendenciasEtapa2([]),{total:0,pendentes:0,aptoParaConciliacao:false,aplicadoProjecao:false});
});
test('lote inválido é rejeitado antes de exibir resumo de pendências',()=>{
 assert.throws(()=>resumirPendenciasEtapa2([rascunho({revisado:true})]));
});
test('referência duplicada é rejeitada sem somar valores',()=>{
 assert.throws(()=>resumirPendenciasEtapa2([rascunho(),rascunho()]));
});
test('não propaga valores nem metadados extras para a interface',()=>{
 const r=resumirPendenciasEtapa2([rascunho({cnpj:'não deve aparecer',nome:'não deve aparecer'})]);
 assert.equal(JSON.stringify(r).includes('não deve aparecer'),false);
 assert.equal(JSON.stringify(r).includes('120'),false);
});
