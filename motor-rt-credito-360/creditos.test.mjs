import { apurarCreditosAnuais } from "./creditos.js";
import { projetarCreditoRT } from "./core.js";
import assert from "node:assert/strict";
import test from "node:test";

test("transporta créditos e concilia cinco exercícios",()=>{
 const x=apurarCreditosAnuais({anoInicial:2027,anos:5,saldoInicial:100,
 gerados:{2027:200,2028:50,2029:40,2030:60,2031:70},
 debitos:{2027:80,2028:100,2029:150,2030:90,2031:80},
 ressarcidos:{2028:30}});
 assert.deepEqual(x.map(a=>a.saldoFinal),[220,140,30,0,0]);
 assert.deepEqual(x.map(a=>a.tributoPagar),[0,0,0,0,10]);
 assert.ok(x.every(a=>Math.abs(a.conciliacao)<1e-7));
});
test("impede ressarcimento superior ao saldo",()=>{
 assert.throws(()=>apurarCreditosAnuais({anoInicial:2027,anos:1,ressarcidos:{2027:1}}));
});
test("projeta cenário com parâmetros explícitos",()=>{
 const x=projetarCreditoRT({anoBase:2026,anos:1,receitaInicial:1000,
 margemEbitda:.2,aliquotaAtual:.1,aliquotasRT:{2027:.12},creditosRT:{2027:20},
 juros:{2027:10},amortizacoes:{2027:20}});
 assert.equal(x[0].tributoRTLiquido,100);
 assert.equal(x[0].icsdRT,200/30);
});
