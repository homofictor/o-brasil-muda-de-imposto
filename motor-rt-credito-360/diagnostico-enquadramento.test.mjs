import test from "node:test";
import assert from "node:assert/strict";
import {diagnosticarEnquadramento} from "./diagnostico-enquadramento.js";

const operacao=(id,tipo,participacao)=>({id,descricao:id,tipoOperacao:tipo,
 participacaoReceita:participacao,tratamentoValidado:true,
 fonteLegal:"Referência legal a ser conferida por revisor",
 aliquotasPorAno:{2027:.1},creditosPorAno:{2027:0}});

test("identifica locadora com dois segmentos e sugere verificação de frota",()=>{
 const r=diagnosticarEnquadramento({cnaePrincipal:"7711-0/00",regimeTributario:"lucro_real",
 segmentosReceita:[operacao("locacao","locacao",.7),operacao("venda","venda_usados",.3)]});
 assert.equal(r.perfil.setores[0],"locacao_veiculos");
 assert.equal(r.falhas.length,0);
 assert.equal(r.prontoParaSimulacao,true);
 assert.ok(r.alertas.some(v=>v.includes("renovação da frota")));
});
test("bloqueia receitas que não totalizam 100%",()=>{
 const r=diagnosticarEnquadramento({cnaePrincipal:"7711000",regimeTributario:"lucro_real",
 segmentosReceita:[operacao("locacao","locacao",.9)]});
 assert.equal(r.prontoParaSimulacao,false);
 assert.ok(r.falhas.some(v=>v.includes("100%")));
});
test("bloqueia tratamento fiscal sem fonte e validação",()=>{
 const op=operacao("a","locacao",1);delete op.fonteLegal;op.tratamentoValidado=false;
 const r=diagnosticarEnquadramento({cnaePrincipal:"7711000",regimeTributario:"lucro_real",segmentosReceita:[op]});
 assert.equal(r.prontoParaSimulacao,false);
});
