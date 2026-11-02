import test from 'node:test';
import assert from 'node:assert/strict';
import {classificarCandidatosProjecao} from './mvp-elegibilidade-projecao.js';

test('recebe somente candidatos numéricos revisados e não preenche fluxo ou tributos', () => {
  const origem = [{field:'interestExpense', value:120, periodMonths:12, rotulo:'injetado'},
    {field:'currentAssets', value:200, periodMonths:null}];
  const antes = JSON.stringify(origem);
  const r = classificarCandidatosProjecao(origem);
  assert.equal(r.itens.length, 2);
  assert.equal(r.itens[0].rotulo, 'Despesa financeira');
  assert.match(r.itens[0].limitacao, /amortização contratual/);
  assert.equal(r.podePreencherFluxoOriginal, false);
  assert.equal(r.podePreencherIBSCBS, false);
  assert.equal(JSON.stringify(origem), antes);
});
test('não presume NCG a partir de circulantes ou receita líquida a partir de RBT12', () => {
  const r = classificarCandidatosProjecao([
    {field:'currentLiabilities',value:80,periodMonths:12},
    {field:'rbt12',value:1000,periodMonths:12}
  ]);
  assert.match(r.itens[0].limitacao, /NCG/);
  assert.match(r.itens[1].limitacao, /receita líquida/);
});
test('bloqueia duplicidade, campo desconhecido e valores não finitos', () => {
  const base={field:'interestExpense',value:10,periodMonths:12};
  assert.throws(()=>classificarCandidatosProjecao([base,base]), /duplicado/);
  assert.throws(()=>classificarCandidatosProjecao([{...base,field:'servicoDivida'}]), /elegível/);
  assert.throws(()=>classificarCandidatosProjecao([{...base,value:Infinity}]), /elegível/);
  assert.throws(()=>classificarCandidatosProjecao([{...base,periodMonths:13}]), /elegível/);
});
test('não admite payload volumoso ou formato incorreto', () => {
  assert.throws(()=>classificarCandidatosProjecao(null), /inválidos/);
  assert.throws(()=>classificarCandidatosProjecao(Array(7).fill({field:'interestExpense',value:1,periodMonths:12})), /inválidos/);
});
