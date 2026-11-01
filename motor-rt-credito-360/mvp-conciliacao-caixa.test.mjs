import test from 'node:test';
import assert from 'node:assert/strict';
import {validarMemoriaCaixaMVP} from './mvp-conciliacao-caixa.js';
const exemplo = () => ({
  receitaTotal:800,
  atividades:[
    {atividadeId:'comercio',receita:500,aliquotas:{ibs:0.05,cbs:0.03},debitos:{ibs:25,cbs:15}},
    {atividadeId:'servicos',receita:300,aliquotas:{ibs:0.05,cbs:0.03},debitos:{ibs:15,cbs:9}}
  ],
  ebitdaReferencia:160, tributoReferencia:80,
  componentesCaixa:{capex:20,variacaoNCG:10,impostosResultado:5,juros:15,amortizacoes:25},
  ibs:{saldoInicial:0,gerado:0,debito:40,utilizado:0,tributoPagar:40,
    ressarcido:0,ajusteNegativo:0,saldoFinal:0,conciliacao:0},
  cbs:{saldoInicial:0,gerado:0,debito:24,utilizado:0,tributoPagar:24,
    ressarcido:0,ajusteNegativo:0,saldoFinal:0,conciliacao:0},
  tributoPagarTotal:64,ressarcimentoRecebidoTotal:0,
  caixaAntesTributos:125,caixaReferencia:45,caixaReforma:61,
  servicoDivida:40,icsdReferencia:1.125,icsdReforma:1.525,variacaoCaixa:16
});
test('concilia IBS, CBS, caixa e ICSD do exemplo sintetico',()=>{
  const memoria=validarMemoriaCaixaMVP(exemplo());
  assert.equal(memoria.status,'conciliado_apenas_para_simulacao_sintetica');
  assert.equal(memoria.variacaoCaixa,16);
});
test('impede dupla deducao do IBS no caixa',()=>{
  const p=exemplo();p.caixaReforma-=40;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/caixa na reforma/);
});
test('bloqueia consolidacao IBS CBS divergente',()=>{
  const p=exemplo();p.tributoPagarTotal=63;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/tributos segregados/);
});
test('bloqueia ICSD incoerente com o servico da divida',()=>{
  const p=exemplo();p.icsdReforma=1.6;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/ICSD reforma/);
});
test('admite liberacao de NCG e ressarcimento no caixa sem compensar IBS e CBS',()=>{
  const p=exemplo();p.componentesCaixa.variacaoNCG=-10;p.ressarcimentoRecebidoTotal=5;
  p.ibs.gerado=5;p.ibs.ressarcido=5;
  p.caixaAntesTributos=145;p.caixaReferencia=65;p.caixaReforma=86;
  p.variacaoCaixa=21;p.icsdReferencia=1.625;p.icsdReforma=2.15;
  assert.equal(validarMemoriaCaixaMVP(p).ressarcimentos,5);
});
test('sem servico de divida ICSD permanece indisponivel',()=>{
  const p=exemplo();p.componentesCaixa.juros=0;p.componentesCaixa.amortizacoes=0;
  p.servicoDivida=0;p.icsdReferencia=null;p.icsdReforma=null;
  assert.equal(validarMemoriaCaixaMVP(p).status,'conciliado_apenas_para_simulacao_sintetica');
  p.icsdReforma=0;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/ICSD indisponivel/);
});

test('rejeita IBS a pagar incoerente com debito e credito utilizado',()=>{
  const p=exemplo();p.ibs.debito=45;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/IBS tributo a pagar/);
});
test('rejeita saldo de CBS alterado mesmo com conciliacao declarada zero',()=>{
  const p=exemplo();p.cbs.saldoFinal=10;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/CBS saldo final/);
});
test('rejeita ressarcimento consolidado sem origem nas contas IBS e CBS',()=>{
  const p=exemplo();p.ressarcimentoRecebidoTotal=5;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/ressarcimentos segregados/);
});
