'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { avaliarConciliacaoEtapa2 } = require('../motor-rt-credito-360/etapa2-conciliacao.cjs');
const base = { bp: [{codigo:'1',centavos:100}], balancete:[{codigo:'1',centavos:100}],
  dataBP:'2025-12-31', dataBalancete:'2025-12-31',
  politicaMaterialidade:{limiteCentavos:0,fonte:'critério sintético de teste'} };
test('datas iguais e contas conciliadas liberam apenas projeção técnica',()=>{
 const r=avaliarConciliacaoEtapa2(base); assert.equal(r.aptoParaProjetar,true);assert.equal(r.homologado,false);
});
test('datas distintas bloqueiam sem executar conciliação',()=>{
 const r=avaliarConciliacaoEtapa2({...base,dataBalancete:'2026-06-30'});
 assert.equal(r.aptoParaProjetar,false);assert.equal(r.conciliacao,null);assert.equal(r.competencias.motivo,'competencias_distintas');
});
test('data inválida bloqueia',()=>{
 const r=avaliarConciliacaoEtapa2({...base,dataBP:'2025-02-30'});assert.equal(r.aptoParaProjetar,false);
});
test('sem política documentada bloqueia inclusive saldos iguais',()=>{
 const r=avaliarConciliacaoEtapa2({...base,politicaMaterialidade:undefined});
 assert.equal(r.aptoParaProjetar,false);assert.equal(r.politicaPendente,true);
});
test('divergência material bloqueia',()=>{
 const r=avaliarConciliacaoEtapa2({...base,balancete:[{codigo:'1',centavos:99}]});
 assert.equal(r.aptoParaProjetar,false);assert.equal(r.revisaoPendente,true);
});
