import test from 'node:test';
import assert from 'node:assert/strict';
import {triarExcecoesContabeis} from './mvp-triagem-excecoes.js';
const c=(field,value=100,periodMonths=12)=>({field,value,periodMonths});
test('pacote vazio não inventa pendências ou conciliação',()=>{
 const r=triarExcecoesContabeis([]);
 assert.equal(r.recebidos,0);assert.deepEqual(r.excecoes,[]);
 assert.match(r.aviso,/não uma medição de materialidade/);
});
test('ativo e passivo circulantes geram uma exceção de NCG sem cálculo indevido',()=>{
 const r=triarExcecoesContabeis([c('currentAssets',300,null),c('currentLiabilities',180,null)]);
 assert.equal(r.recebidos,2);assert.equal(r.excecoes.length,1);
 assert.match(r.excecoes[0],/não determinam NCG/);
 assert.equal(JSON.stringify(r).includes('120'),false);
});
test('despesa financeira não é confundida com serviço da dívida',()=>{
 const r=triarExcecoesContabeis([c('interestExpense',24,6)]);
 assert.equal(r.excecoes.length,1);assert.match(r.excecoes[0],/amortizações/);
});
test('receita bruta, margem e tributos geram pendências distintas sem inferir valores',()=>{
 const r=triarExcecoesContabeis([c('rbt12'),c('currentOperatingMarginPct',20),c('currentConsumptionTaxAnnual',10)]);
 assert.equal(r.excecoes.length,3);
 assert.match(r.excecoes.join(' '),/receita líquida/);
 assert.match(r.excecoes.join(' '),/dupla contagem/);
});
test('recusa duplicações, campos não autorizados e valores inválidos',()=>{
 for(const pacote of [[c('rbt12'),c('rbt12')],[c('cnpj')],[c('rbt12',Infinity)],
  [c('rbt12',NaN)],[c('rbt12',1e16)],[c('interestExpense',2,13)],null])
  assert.throws(()=>triarExcecoesContabeis(pacote));
});
test('nenhum dado de origem, nome ou documento é transportado para a triagem',()=>{
 const r=triarExcecoesContabeis([{...c('rbt12'),source:'arquivo-confidencial.pdf',cnpj:'00000000000000'}]);
 assert.equal(JSON.stringify(r).includes('confidencial'),false);
 assert.equal(JSON.stringify(r).includes('00000000000000'),false);
});