import test from "node:test";
import assert from "node:assert/strict";
import {apurarIBSeCBS} from "./ibs-cbs.js";

test("consolida IBS e CBS sem compensação cruzada e com totais finitos",()=>{
 const r=apurarIBSeCBS({anoInicial:2027,anos:1,
  ibs:{debitos:{2027:40},gerados:{2027:10}},
  cbs:{debitos:{2027:30},gerados:{2027:5}}}).anos[0];
 assert.equal(r.debitoTotal,70);
 assert.equal(r.creditoGeradoTotal,15);
 assert.equal(r.creditoUtilizadoTotal,15);
 assert.equal(r.tributoPagarTotal,55);
 assert.equal(r.ibs.tributoPagar,30);
 assert.equal(r.cbs.tributoPagar,25);
});

test("rejeita overflow na soma dos débitos de IBS e CBS",()=>{
 assert.throws(()=>apurarIBSeCBS({anoInicial:2027,anos:1,
  ibs:{debitos:{2027:1e308}},cbs:{debitos:{2027:1e308}}}),
  /Consolidação IBS\/CBS não finita: debitoTotal 2027/);
});

test("rejeita overflow na soma dos créditos gerados",()=>{
 assert.throws(()=>apurarIBSeCBS({anoInicial:2027,anos:1,
  ibs:{gerados:{2027:1e308}},cbs:{gerados:{2027:1e308}}}),
  /Consolidação IBS\/CBS não finita: creditoGeradoTotal 2027/);
});

test("rejeita overflow na soma de ressarcimentos recebidos",()=>{
 assert.throws(()=>apurarIBSeCBS({anoInicial:2027,anos:1,
  ibs:{saldoInicial:1e308,ressarcidos:{2027:1e308}},
  cbs:{saldoInicial:1e308,ressarcidos:{2027:1e308}}}),
  /Consolidação IBS\/CBS não finita: ressarcimentoRecebidoTotal 2027/);
});
