import test from "node:test";
import assert from "node:assert/strict";
import {mapearContas,conciliarExercicio} from "./conciliacao-contabil.js";
const registros=[
 {conta:"Ativo",valor:100,exercicio:2025,demonstracao:"balanco_patrimonial",linhaOrigem:2},
 {conta:"Passivo exigível",valor:60,exercicio:2025,demonstracao:"balanco_patrimonial",linhaOrigem:3},
 {conta:"PL",valor:40,exercicio:2025,demonstracao:"balanco_patrimonial",linhaOrigem:4}];
const mapeamento=["ativo_total","passivo_exigivel","patrimonio_liquido"].map((contaPadrao,indiceOrigem)=>({contaPadrao,indiceOrigem,fator:1}));
test("concilia balanço com rastreabilidade",()=>{
 const r=mapearContas(registros,mapeamento);
 assert.equal(r.erros.length,0);
 assert.equal(r.normalizadas[0].linhaOrigem,2);
 const c=conciliarExercicio(r.normalizadas);
 assert.equal(c.conciliado,true);
 assert.equal(c.aptoParaProjecao,false);
});
test("identifica divergência patrimonial",()=>{
 const r=mapearContas(registros,mapeamento);
 r.normalizadas[2].valor=30;
 assert.equal(conciliarExercicio(r.normalizadas).conciliado,false);
});
test("rejeita duplicidade de linha",()=>{
 const r=mapearContas(registros,[mapeamento[0],{...mapeamento[1],indiceOrigem:0}]);
 assert.ok(r.erros.length>0);
});
