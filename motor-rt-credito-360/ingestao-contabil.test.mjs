import test from "node:test";
import assert from "node:assert/strict";
import {prepararSolicitacaoUpload,validarRespostaAutorizacaoUpload,prepararRevisaoContabil,aprovarRevisaoContabil} from "./ingestao-contabil.js";
test("valida solicitação mas não executa upload",()=>{
 const r=prepararSolicitacaoUpload({arquivo:{name:"balanco.pdf",size:1024},
 tipo:"balanco_patrimonial",ano:2025,empresaId:"empresa_123"});
 assert.equal(r.aceitoParaSolicitar,true);
 assert.equal(r.armazenamento,"privado");
});
test("rejeita autorização insegura",()=>{
 assert.throws(()=>validarRespostaAutorizacaoUpload({autorizado:true,documentoId:"1",urlTemporaria:"http://exemplo.com"}));
});
test("revisão contábil só é liberada com confirmações",()=>{
 const r=prepararRevisaoContabil({documentoId:"1",exercicio:2025,demonstracao:"dre",
 linhas:[{conta:"Receita líquida",valor:1000,paginaOrigem:2}]});
 assert.equal(r.aptoParaProjecao,false);
 assert.throws(()=>aprovarRevisaoContabil(r,{analistaId:"a"}));
 const aprovado=aprovarRevisaoContabil(r,{analistaId:"a",
 confirmacoes:{conferiuFonte:true,conferiuUnidades:true,conferiuTotais:true}});
 assert.equal(aprovado.aptoParaProjecao,true);
});
