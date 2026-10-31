import test from "node:test";
import assert from "node:assert/strict";
import {apurarIBSeCBS} from "./ibs-cbs.js";
test("não compensa crédito IBS com débito CBS",()=>{
 const r=apurarIBSeCBS({anoInicial:2027,anos:1,
  ibs:{gerados:{2027:100},debitos:{2027:20}},
  cbs:{gerados:{2027:0},debitos:{2027:50}}});
 assert.equal(r.anos[0].saldoCreditoIBS,80);
 assert.equal(r.anos[0].cbs.tributoPagar,50);
 assert.equal(r.anos[0].tributoPagarTotal,50);
});
test("transporta créditos separadamente",()=>{
 const r=apurarIBSeCBS({anoInicial:2027,anos:2,
  ibs:{gerados:{2027:100},debitos:{2027:20,2028:30}},
  cbs:{gerados:{2027:10},debitos:{2027:0,2028:5}}});
 assert.equal(r.anos[1].saldoCreditoIBS,50);
 assert.equal(r.anos[1].saldoCreditoCBS,5);
});
test("rejeita ressarcimento acima do saldo",()=>{
 assert.throws(()=>apurarIBSeCBS({anoInicial:2027,anos:1,
  ibs:{ressarcidos:{2027:1}},cbs:{}}));
});
