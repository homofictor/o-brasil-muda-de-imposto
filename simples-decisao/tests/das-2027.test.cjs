'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const app=require('../das-2027.js');
function close(actual,expected,tolerance=.011){assert.ok(Math.abs(actual-expected)<tolerance, 'Esperado '+expected+'; obtido '+actual);}
const fixtures=[
  {name:'Comércio III faixa 2027',in:{anexo:'I',rbt12:600000,receita:50000},out:{dasTotal:3595,cbs:551.11,ibs:6.11,dasResidual:3037.78,faixa:3}},
  {name:'Indústria II faixa 2027',in:{anexo:'II',rbt12:300000,receita:25000},out:{dasTotal:1455,cbs:201.52,ibs:2.18,dasResidual:1251.30,faixa:2}},
  {name:'Serviços III, faixa 4',in:{anexo:'III',rbt12:1200000,receita:100000},out:{dasTotal:13030,cbs:2138.22,ibs:24.76,dasResidual:10867.02,faixa:4}},
  {name:'Serviços IV com ISS limitado',in:{anexo:'IV',rbt12:2400000,receita:200000},out:{dasTotal:28685,cbs:6777.05,ibs:74.74,dasResidual:21833.21,faixa:5}},
  {name:'Serviços V faixa 2',in:{anexo:'V',rbt12:240000,receita:20000},out:{dasTotal:3225,cbs:546.96,ibs:6.13,dasResidual:2671.91,faixa:2}}
];
for(const item of fixtures){
  test(item.name,()=>{
    const found=app.calcular(item.in);
    for(const [k,v] of Object.entries(item.out))close(found[k],v);
    close(Object.values(found.partilha).reduce((a,b)=>a+b,0),found.dasTotal);
    close(found.dasResidual+found.cbs+found.ibs,found.dasTotal);
  });
}
test('Fator R igual a 28% usa Anexo III',()=>{
  const a=app.calcular({anexo:'V',rbt12:600000,receita:50000,sujeitaFatorR:true,folha12:168000});
  assert.equal(a.anexo,'III');close(a.fatorR,.28);close(a.dasTotal,5280);
});
test('Fator R abaixo de 28% usa Anexo V',()=>{
  const a=app.calcular({anexo:'III',rbt12:600000,receita:50000,sujeitaFatorR:true,folha12:167999});
  assert.equal(a.anexo,'V');
});
test('ISS 5% Anexo IV e CPP externa',()=>{
  const a=app.calcular({anexo:'IV',rbt12:2400000,receita:200000});
  assert.equal(a.issLimitado,true);assert.equal(a.cppForaDoDas,true);
  close(a.partilha.ISS,10000);
});
test('CBS credora não compensa IBS devedor',()=>{
  const a=app.apurarRegular({receita:20000,taxaCbs:9,taxaIbs:0.1,creditoCbs:3000,creditoIbs:0});
  close(a.debitoCbs,1800);close(a.debitoIbs,20);
  close(a.cbsPagar,0);close(a.ibsPagar,20);close(a.saldoCbs,1200);close(a.recolhimentoRegular,20);
});
test('IBS credor não compensa CBS devedora',()=>{
  const a=app.apurarRegular({receita:20000,taxaCbs:9,taxaIbs:.1,creditoCbs:0,creditoIbs:50});
  close(a.cbsPagar,1800);close(a.ibsPagar,0);close(a.saldoIbs,30);close(a.recolhimentoRegular,1800);
});
test('Bloqueia faixa acima do sublimite sem PGDAS',()=>{
  assert.throws(()=>app.calcular({anexo:'I',rbt12:3600001,receita:10000}),/PGDAS-D/);
});
test('Bloqueia acima de 4,8 milhões',()=>{
  assert.throws(()=>app.calcular({anexo:'I',rbt12:4800001,receita:10000}),/elegibilidade/);
});
test('Bloqueia atividades mistas e dados incompletos',()=>{
  assert.throws(()=>app.calcular({anexo:'Atividades mistas',rbt12:700000,receita:10000}),/mista/);
  assert.throws(()=>app.calcular({anexo:'I',rbt12:0,receita:10000}),/RBT12/);
  assert.throws(()=>app.apurarRegular({receita:10000,taxaCbs:9,taxaIbs:.1,creditoCbs:-1,creditoIbs:0}),/não negativos/);
});
