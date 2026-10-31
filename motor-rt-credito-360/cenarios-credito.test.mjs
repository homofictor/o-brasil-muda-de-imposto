import test from "node:test";
import assert from "node:assert/strict";
import {compararCenariosCredito} from "./cenarios-credito.js";
const base={historico:{exercicio:2026,receitaLiquida:1000,ebitda:200,revisadoPorAnalista:true},
 anoBase:2026,anos:2,aliquotaReferencia:.1,
 aliquotasReforma:{2027:.2,2028:.2},
 creditosGerados:{2027:150,2028:150},
 juros:{2027:20,2028:20},amortizacoes:{2027:30,2028:30}};
test("mantém geração recorrente de créditos e reconcilia saldo",()=>{
 const r=compararCenariosCredito(base);
 assert.equal(r.projecoes[0].tributoReformaPago,50);
 assert.equal(r.projecoes[1].creditoGerado,150);
 assert.equal(r.projecoes[0].icsdReferencia,4);
 assert.equal(r.projecoes[0].icsdReforma,5);
 assert.equal(r.aprovadoParaParecer,false);
});
test("bloqueia histórico sem revisão",()=>{
 assert.throws(()=>compararCenariosCredito({...base,historico:{...base.historico,revisadoPorAnalista:false}}));
});
test("transporta saldo de crédito não utilizado",()=>{
 const r=compararCenariosCredito({...base,creditosGerados:{2027:250,2028:0}});
 assert.equal(r.contaCreditos[0].saldoFinal,50);
 assert.equal(r.contaCreditos[1].tributoPagar,150);
});
