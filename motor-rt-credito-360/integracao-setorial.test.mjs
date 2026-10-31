import test from "node:test";
import assert from "node:assert/strict";
import {integrarAtividadesCredito} from "./integracao-setorial.js";
const entrada={anoBase:2026,anos:2,
 historico:{exercicio:2026,receitaLiquida:1000,ebitda:200,revisadoPorAnalista:true},
 atividades:[
 {id:"locacao",receitaBase:800,crescimento:0,aliquotasValidadas:{2027:.1,2028:.1}},
 {id:"usados",receitaBase:200,crescimento:0,aliquotasValidadas:{2027:.2,2028:.2}}
 ],eventosCredito:[
 {atividadeId:"locacao",ano:2027,valor:100,fundamento:"Hipótese simulada",validadoPorAnalista:true},
 {atividadeId:"locacao",ano:2028,valor:50,fundamento:"Hipótese simulada",validadoPorAnalista:true}],
 aliquotaReferencia:.1,
 tratamentoTributario:{referenciaRefletida:false,reformaRefletida:false,
 evidenciaContabil:"Conciliação documental simulada",validadoPorAnalista:true},
 juros:{2027:20,2028:20},amortizacoes:{2027:30,2028:30}};
test("compara caixa e ICSD com créditos recorrentes",()=>{
 const r=integrarAtividadesCredito(entrada);
 assert.equal(r.projecoes[0].receitaTotal,1000);
 assert.equal(r.projecoes[0].tributoPagar,20);
 assert.equal(r.projecoes[0].caixaReferencia,200);
 assert.equal(r.projecoes[0].caixaReforma,280);
 assert.equal(r.projecoes[0].icsdReforma,5.6);
 assert.equal(r.projecoes[1].creditoGerado ?? r.projecoes[1].gerado,50);
 assert.equal(r.aptoParaParecer,false);
});
test("bloqueia receita segmentada incompatível com DRE",()=>{
 assert.throws(()=>integrarAtividadesCredito({...entrada,
 atividades:[{...entrada.atividades[0],receitaBase:700},entrada.atividades[1]]}));
});
test("bloqueia histórico não aprovado",()=>{
 assert.throws(()=>integrarAtividadesCredito({...entrada,
 historico:{...entrada.historico,revisadoPorAnalista:false}}));
});

test("bloqueia ICSD da reforma sem ponte tributária",()=>{
 const r=integrarAtividadesCredito({...entrada,tratamentoTributario:null});
 assert.equal(r.projecoes[0].caixaReforma,null);
 assert.equal(r.projecoes[0].icsdReforma,null);
 assert.equal(r.projecoes[0].auditoriaPonte.autorizadoParaProjecao,false);
});
test("não duplica ajuste quando tributos já estão no EBITDA",()=>{
 const r=integrarAtividadesCredito({...entrada,tratamentoTributario:{
 referenciaRefletida:true,reformaRefletida:true,
 evidenciaContabil:"Conciliação documental simulada",validadoPorAnalista:true}});
 assert.equal(r.projecoes[0].caixaReforma,null);
 assert.equal(r.projecoes[0].icsdReforma,null);
});
