import test from 'node:test';
import assert from 'node:assert/strict';
import {validarMemoriaCaixaMVP} from './mvp-conciliacao-caixa.js';

// Valores ficticios e alíquotas ilustrativas, sem fundamentacao legal.
const exemplo = () => ({
  receitaTotal:800,
  atividades:[
    {atividadeId:'comercio',receita:500,aliquotas:{ibs:0.05,cbs:0.03},debitos:{ibs:25,cbs:15}},
    {atividadeId:'servicos',receita:300,aliquotas:{ibs:0.05,cbs:0.03},debitos:{ibs:15,cbs:9}}
  ],
  ebitdaReferencia:160,tributoReferencia:80,
  componentesCaixa:{capex:20,variacaoNCG:10,impostosResultado:5,juros:15,amortizacoes:25},
  ibs:{saldoInicial:0,gerado:0,debito:40,utilizado:0,tributoPagar:40,
    ressarcido:0,ajusteNegativo:0,saldoFinal:0,conciliacao:0},
  cbs:{saldoInicial:0,gerado:0,debito:24,utilizado:0,tributoPagar:24,
    ressarcido:0,ajusteNegativo:0,saldoFinal:0,conciliacao:0},
  tributoPagarTotal:64,ressarcimentoRecebidoTotal:0,
  caixaAntesTributos:125,caixaReferencia:45,caixaReforma:61,
  servicoDivida:40,icsdReferencia:1.125,icsdReforma:1.525,variacaoCaixa:16
});
test('concilia detalhamento por atividade com receita, IBS, CBS e caixa',()=>{
  assert.equal(validarMemoriaCaixaMVP(exemplo()).variacaoCaixa,16);
});
test('rejeita debito setorial adulterado sem mudar a conta consolidada',()=>{
  const p=exemplo();p.atividades[0].debitos.ibs=26;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/IBS debito atividade|IBS debitos atividades/);
});
test('rejeita receita setorial diferente da consolidada',()=>{
  const p=exemplo();p.receitaTotal=801;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/receita atividades/);
});
test('rejeita aliquota setorial incompatível com o debito',()=>{
  const p=exemplo();p.atividades[0].aliquotas.cbs=0.04;
  assert.throws(()=>validarMemoriaCaixaMVP(p),/CBS debito atividade/);
});
test('rejeita atividades duplicadas ou memoria ausente',()=>{
  const p=exemplo();p.atividades[1].atividadeId='comercio';
  assert.throws(()=>validarMemoriaCaixaMVP(p),/atividade duplicada/);
  const q=exemplo();delete q.atividades;
  assert.throws(()=>validarMemoriaCaixaMVP(q),/detalhamento de atividades/);
});
