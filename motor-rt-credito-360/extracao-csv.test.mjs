import test from "node:test";
import assert from "node:assert/strict";
import {extrairCSVContabil} from "./extracao-csv.js";
test("importa valores e preserva origem",()=>{
 const csv='demonstracao,exercicio,conta,valor,unidade,pagina_origem\r\ndre,2025,"Receita, líquida",1500000,BRL,2\r\nbalanco_patrimonial,2025,Ativo total,3000000,BRL,3';
 const r=extrairCSVContabil(csv);
 assert.equal(r.registros.length,2);
 assert.equal(r.registros[0].conta,"Receita, líquida");
 assert.equal(r.registros[0].linhaOrigem,2);
 assert.equal(r.aptoParaProjecao,false);
});
test("não interpreta separador de milhar ambíguo",()=>{
 const r=extrairCSVContabil("demonstracao,exercicio,conta,valor\ndre,2025,Receita,\"1.000,00\"");
 assert.equal(r.registros.length,0);
 assert.equal(r.erros.length,1);
});
test("rejeita cabeçalho incompleto",()=>{
 assert.throws(()=>extrairCSVContabil("conta,valor\nReceita,100"));
});
