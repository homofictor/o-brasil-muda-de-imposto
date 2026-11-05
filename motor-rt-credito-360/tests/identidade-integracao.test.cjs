'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { importarMovimentosV32 } = require('../importador-v32-adaptador.cjs');
const periodo = { inicio: '2026-01-01', fim: '2026-06-30' };
function doc(id, codigo, nome='balancete.csv') {
  return { idDocumento:id, file:nome, movimentosRevisados:[{
    codigo, movimentosCentavos:100, competenciaInicio:periodo.inicio,
    competenciaFim:periodo.fim, revisado:true
  }] };
}
test('arquivos homonimos com IDs distintos preservam origem',()=>{
 const r=importarMovimentosV32([doc('doc_00001','1'),doc('doc_00002','2')],periodo);
 assert.equal(r.valido,true);
 assert.deepEqual(r.movimentos.map(x=>x.documentoOrigem),['doc_00001','doc_00002']);
});
test('IDs duplicados bloqueiam antes da conciliacao',()=>{
 assert.equal(importarMovimentosV32([doc('doc_00001','1'),doc('doc_00001','2')],periodo).motivo,'identificador_documental_duplicado');
});
test('ID ausente bloqueia sem inferir nome',()=>{
 assert.equal(importarMovimentosV32([{file:'x.csv',movimentosRevisados:doc('doc_00001','1').movimentosRevisados}],periodo).motivo,'identificador_documental_invalido');
});
test('origem declarada divergente bloqueia',()=>{
 const d=doc('doc_00001','1'); d.movimentosRevisados[0].documentoOrigem='doc_00002';
 assert.equal(importarMovimentosV32([d],periodo).motivo,'origem_inconsistente');
});
