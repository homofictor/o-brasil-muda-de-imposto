import test from "node:test";
import assert from "node:assert/strict";
import {integrarIBSCBSAoCredito} from "./integracao-ibs-cbs-credito.js";

const tratamentoTributario={referenciaRefletida:false,reformaRefletida:false,
 evidenciaContabil:"Ponte DRE pré-tributos sintética revisada",validadoPorAnalista:true};
const setores=["comercio","industria","servicos","construcao","saude",
 "transporte","agronegocio","multissetorial"];
const entrada={anoBase:2026,anos:1,
 historico:{exercicio:2026,receitaLiquida:800,ebitda:160,revisadoPorAnalista:true},
 atividades:setores.map(id=>({id,receitaBase:100,crescimento:0,
  aliquotasValidadas:{ibs:{2027:0.05},cbs:{2027:0.03}}})),
 aliquotaReferencia:0.1,tratamentoTributario,
 capex:{2027:20},variacaoNCG:{2027:10},impostosResultado:{2027:5},
 juros:{2027:15},amortizacoes:{2027:25}};
const perto=(valor,esperado)=>assert.ok(Math.abs(valor-esperado)<1e-9,
 `Esperado ${esperado}, recebido ${valor}`);

test("concilia oito setores, tributos separados, caixa e ICSD sem dupla dedução",()=>{
 const r=integrarIBSCBSAoCredito(entrada),p=r.projecoes[0];
 assert.equal(p.atividades.length,8);
 perto(p.ibs.debito,40);perto(p.cbs.debito,24);
 perto(p.tributoPagarTotal,64);perto(p.caixaAntesTributos,125);
 perto(p.caixaReferencia,45);perto(p.caixaReforma,61);
 perto(p.variacaoCaixa,16);perto(p.icsdReferencia,1.125);
 perto(p.icsdReforma,1.525);
 assert.equal(r.aptoParaParecer,false);
 assert.equal(p.auditoriaPonte.autorizadoParaProjecao,true);
});

test("crédito excedente IBS não abate CBS e ressarcimento entra uma vez no caixa",()=>{
 const r=integrarIBSCBSAoCredito({...entrada,
  historico:{...entrada.historico,receitaLiquida:1000,ebitda:200},
  atividades:[{id:"comercio",receitaBase:1000,crescimento:0,
   aliquotasValidadas:{ibs:{2027:0.1},cbs:{2027:0.05}}}],
  eventosCredito:[
   {id:"ibs1",atividadeId:"comercio",tributo:"ibs",ano:2027,valor:120,
    fundamento:"Documento sintético",validadoPorAnalista:true},
   {id:"cbs1",atividadeId:"comercio",tributo:"cbs",ano:2027,valor:10,
    fundamento:"Documento sintético",validadoPorAnalista:true}],
  ressarcimentosRecebidos:{ibs:{2027:10},cbs:{}}});
 const p=r.projecoes[0];
 perto(p.ibs.tributoPagar,0);perto(p.cbs.tributoPagar,40);
 perto(p.saldoCreditoIBS,10);perto(p.saldoCreditoCBS,0);
 perto(p.ressarcimentoRecebidoTotal,10);
 perto(p.caixaReferencia,65);perto(p.caixaReforma,135);
 perto(p.variacaoCaixa,70);perto(p.icsdReforma,3.375);
 perto(p.ibs.conciliacao,0);perto(p.cbs.conciliacao,0);
});

test("bloqueia caixa e ICSD quando tributos já integram EBITDA",()=>{
 const p=integrarIBSCBSAoCredito({...entrada,tratamentoTributario:{
  ...tratamentoTributario,referenciaRefletida:true,reformaRefletida:true}}).projecoes[0];
 assert.equal(p.caixaReferencia,null);assert.equal(p.caixaReforma,null);
 assert.equal(p.icsdReferencia,null);assert.equal(p.icsdReforma,null);
});

test("bloqueia caixa e ICSD sem revisão documental ou com bases incomparáveis",()=>{
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,tratamentoTributario:null}),
  /Informar explicitamente/);
 for(const tratamento of [{...tratamentoTributario,validadoPorAnalista:false},
  {...tratamentoTributario,reformaRefletida:true}]){
  const p=integrarIBSCBSAoCredito({...entrada,tratamentoTributario:tratamento}).projecoes[0];
  assert.equal(p.caixaReforma,null);assert.equal(p.icsdReforma,null);
 }
});

test("não calcula ICSD quando não há serviço da dívida",()=>{
 const p=integrarIBSCBSAoCredito({...entrada,juros:{},amortizacoes:{}}).projecoes[0];
 assert.equal(p.icsdReferencia,null);assert.equal(p.icsdReforma,null);
 assert.notEqual(p.caixaReforma,null);
});

test("rejeita receita não conciliada, crédito sem revisão e CAPEX negativo",()=>{
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  atividades:entrada.atividades.slice(1)}),/conciliam/);
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  eventosCredito:[{id:"x",atividadeId:"comercio",tributo:"ibs",ano:2027,
   valor:10,fundamento:"Hipótese",validadoPorAnalista:false}]}),/não validado/);
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  capex:{2027:-1}}),/capex/);
});

test("liberação de NCG aumenta caixa e ICSD sem afetar a ponte IBS/CBS",()=>{
 const p=integrarIBSCBSAoCredito({...entrada,variacaoNCG:{2027:-10}}).projecoes[0];
 perto(p.caixaAntesTributos,145);
 perto(p.caixaReferencia,65);perto(p.caixaReforma,81);
 perto(p.icsdReferencia,1.625);perto(p.icsdReforma,2.025);
 perto(p.variacaoCaixa,16);
 perto(p.ibs.conciliacao,0);perto(p.cbs.conciliacao,0);
});

test("rejeita NCG não numérica e mantém vedação a CAPEX negativo",()=>{
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  variacaoNCG:{2027:NaN}}),/variacaoNCG/);
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  capex:{2027:-10}}),/capex/);
});
