import test from 'node:test';
import assert from 'node:assert/strict';
import {validarMemoriaCaixaMVP} from './mvp-conciliacao-caixa.js';
const exemplo = () => ({
  ebitdaReferencia:160, tributoReferencia:80,
  componentesCaixa:{capex:20,variacaoNCG:10,impostosResultado:5,juros:15,amortizacoes:25},
  ibs:{saldoInicial:0,gerado:0,debito:40,utilizado:0,tributoPagar:40,ressarcido:0,ajusteNegativo:0,saldoFinal:0,conciliacao:0},
  cbs:{saldoInicial:0,gerado:0,debito:24,utilizado:0,tributoPagar:24,ressarcido:0,ajusteNegativo:0,saldoFinal:0,conciliacao:0},
  tributoPagarTotal:64,ressarcimentoRecebidoTotal:0,
  caixaAntesTributos:125,caixaReferencia:45,caixaReforma:61,
  servicoDivida:40,icsdReferencia:1.125,icsdReforma:1.525,variacaoCaixa:16
});
function recomputar(p) {
 const c=p.componentesCaixa;
 p.caixaAntesTributos=p.ebitdaReferencia-c.capex-c.variacaoNCG-c.impostosResultado;
 p.caixaReferencia=p.caixaAntesTributos-p.tributoReferencia;
 p.caixaReforma=p.caixaAntesTributos-p.tributoPagarTotal+p.ressarcimentoRecebidoTotal;
 p.servicoDivida=c.juros+c.amortizacoes;
 p.icsdReferencia=p.servicoDivida>0?p.caixaReferencia/p.servicoDivida:null;
 p.icsdReforma=p.servicoDivida>0?p.caixaReforma/p.servicoDivida:null;
 p.variacaoCaixa=p.caixaReforma-p.caixaReferencia;
}
test('caso sintético válido permanece conciliado',()=>assert.equal(validarMemoriaCaixaMVP(exemplo()).variacaoCaixa,16));
for (const campo of ['capex','impostosResultado','juros','amortizacoes']) {
 test(`bloqueia ${campo} negativo mesmo com caixa e ICSD artificialmente reconciliados`,()=>{
  const p=exemplo();p.componentesCaixa[campo]=-1;recomputar(p);
  assert.throws(()=>validarMemoriaCaixaMVP(p),/negativo/);
 });
}
test('bloqueia tributo de referência negativo mesmo com caixa e ICSD reconciliados',()=>{
 const p=exemplo();p.tributoReferencia=-1;recomputar(p);
 assert.throws(()=>validarMemoriaCaixaMVP(p),/tributoReferencia negativo/);
});
test('mantém NCG negativa como liberação de capital de giro',()=>{
 const p=exemplo();p.componentesCaixa.variacaoNCG=-10;recomputar(p);
 assert.equal(validarMemoriaCaixaMVP(p).status,'conciliado_apenas_para_simulacao_sintetica');
});
