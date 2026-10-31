import test from "node:test";
import assert from "node:assert/strict";
import {integrarIBSCBSAoCredito} from "./integracao-ibs-cbs-credito.js";

const entrada={
 anoBase:2026,anos:1,
 historico:{exercicio:2026,receitaLiquida:100,ebitda:30,revisadoPorAnalista:true},
 atividades:[{id:"comercio",receitaBase:100,crescimento:0,
  aliquotasValidadas:{ibs:{2027:0.05},cbs:{2027:0.03}}}],
 aliquotaReferencia:0.1,
 tratamentoTributario:{referenciaRefletida:false,reformaRefletida:false,
  evidenciaContabil:"DRE sintética pré-tributos",validadoPorAnalista:true}
};

test("mantém caixa e ICSD finitos em cenário sintético comum",()=>{
 const p=integrarIBSCBSAoCredito({...entrada,juros:{2027:2},amortizacoes:{2027:3}}).projecoes[0];
 assert.equal(p.caixaAntesTributos,30);
 assert.equal(p.caixaReforma,22);
 assert.equal(p.icsdReforma,4.4);
});

test("bloqueia overflow do caixa causado por NCG negativa e EBITDA finitos",()=>{
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  historico:{...entrada.historico,ebitda:1e308},
  variacaoNCG:{2027:-1e308}}),/não finito: caixaAntesTributos/);
});

test("bloqueia overflow do serviço da dívida com parcelas finitas",()=>{
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  juros:{2027:1e308},amortizacoes:{2027:1e308}}),
  /não finito: servicoDivida/);
});

test("bloqueia ICSD infinito quando serviço da dívida é muito pequeno",()=>{
 assert.throws(()=>integrarIBSCBSAoCredito({...entrada,
  historico:{...entrada.historico,ebitda:1e308},
  juros:{2027:1e-308}}),/não finito: icsdReferencia/);
});
