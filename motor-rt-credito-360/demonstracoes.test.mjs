import test from "node:test";
import assert from "node:assert/strict";
import {validarDocumentoContabil,conciliarBalanco,validarSerieHistorica} from "./demonstracoes.js";
test("aceita metadados válidos sem autorizar upload",()=>{
 const r=validarDocumentoContabil({nome:"dre-2025.pdf",tamanho:1200,tipo:"dre",ano:2025});
 assert.equal(r.valido,true);
 assert.equal(r.uploadAutorizado,false);
});
test("bloqueia extensão e tamanho inadequados",()=>{
 const r=validarDocumentoContabil({nome:"arquivo.exe",tamanho:30*1024*1024,tipo:"dre",ano:2025});
 assert.equal(r.valido,false);
 assert.equal(r.falhas.length,2);
});
test("concilia balanço e identifica diferença",()=>{
 assert.equal(conciliarBalanco({ativoTotal:100,passivoTotal:60,patrimonioLiquido:40}).conciliado,true);
 assert.equal(conciliarBalanco({ativoTotal:100,passivoTotal:60,patrimonioLiquido:30}).conciliado,false);
});
test("identifica histórico insuficiente",()=>{
 const r=validarSerieHistorica([{nome:"bp.pdf",tamanho:100,tipo:"balanco_patrimonial",ano:2025}]);
 assert.equal(r.completo,false);
});

test("rejeita tolerância arbitrária na conciliação patrimonial",()=>{
 assert.throws(()=>conciliarBalanco({ativoTotal:100,passivoTotal:60,patrimonioLiquido:30},1000),/Tolerância/);
 assert.throws(()=>conciliarBalanco({ativoTotal:100,passivoTotal:60,patrimonioLiquido:40},-1),/Tolerância/);
 assert.equal(conciliarBalanco({ativoTotal:100,passivoTotal:60,patrimonioLiquido:40},0.01).conciliado,true);
});
test("rejeita diferença patrimonial não finita produzida por overflow",()=>{
 assert.throws(()=>conciliarBalanco({ativoTotal:1e308,passivoTotal:-1e308,patrimonioLiquido:0}),/não finita/);
});
