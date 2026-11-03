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
 assert.equal(r.excecoes.length,2);assert.match(r.excecoes[0],/amortizações/);
 assert.match(r.excecoes[1],/período parcial de 6 meses/);
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
test('RBT12 sem 12 meses comprovados gera ressalva sem presumir receita anual',()=>{
 for(const meses of [null,6]) {
  const r=triarExcecoesContabeis([c('rbt12',800,meses)]);
  assert.match(r.excecoes.join(' '),/RBT12: período de 12 meses não comprovado/);
 }
 assert.equal(triarExcecoesContabeis([c('rbt12',800,12)]).excecoes.length,1);
});
test('tributos sem 12 meses e juros sem competência exigem revisão',()=>{
 const r=triarExcecoesContabeis([c('currentConsumptionTaxAnnual',40,6),c('interestExpense',12,null)]);
 assert.match(r.excecoes.join(' '),/Não anualizar nem comparar com IBS\/CBS automaticamente/);
 assert.match(r.excecoes.join(' '),/Não anualizar nem estimar serviço da dívida/);
 assert.equal(r.recebidos,2);
});
test('margem sem competência gera ressalva, saldos patrimoniais não são anualizados',()=>{
 const r=triarExcecoesContabeis([c('currentOperatingMarginPct',20,null),c('currentAssets',100,null)]);
 assert.match(r.excecoes.join(' '),/Margem operacional: período não informado/);
 assert.equal(r.excecoes.some(x=>x.includes('Ativo circulante: período')),false);
});
test('juros e margem de período parcial não são tratados como anuais',()=>{
 const r=triarExcecoesContabeis([c('interestExpense',18,9),c('currentOperatingMarginPct',12,3)]);
 assert.match(r.excecoes.join(' '),/Despesas financeiras: período parcial de 9 meses/);
 assert.match(r.excecoes.join(' '),/Margem operacional: período parcial de 3 meses/);
 assert.equal(r.excecoes.length,4);
 assert.equal(JSON.stringify(r).includes('arquivo'),false);
});
test('período anual não recebe alerta de período parcial',()=>{
 const r=triarExcecoesContabeis([c('interestExpense',18,12),c('currentOperatingMarginPct',12,12)]);
 assert.equal(r.excecoes.length,2);
 assert.equal(r.excecoes.some(x=>x.includes('período parcial')),false);
});

// Regressão: dados parciais não podem ser anualizados nem convertidos em parecer.
test('tributo de consumo sem competência anual exige ressalva',()=>{
 const resultado=triarExcecoesContabeis([{field:'currentConsumptionTaxAnnual',value:120,periodMonths:6}]);
 assert.ok(resultado.excecoes.some(x=>x.includes('Não anualizar')));
 assert.match(resultado.aviso,/Nenhum candidato alimenta automaticamente/);
});
test('período zero é rejeitado antes da triagem',()=>{
 assert.throws(()=>triarExcecoesContabeis([{field:'rbt12',value:100,periodMonths:0}]));
});

test('par circulante incompleto não permite inferir capital circulante ou NCG',()=>{
 for(const campo of ['currentAssets','currentLiabilities']){
  const resultado=triarExcecoesContabeis([c(campo,100,null)]);
  assert.ok(resultado.excecoes.some(x=>x.includes('Capital circulante incompleto')));
  assert.ok(resultado.excecoes.some(x=>x.includes('NCG operacional')));
 }
 const completo=triarExcecoesContabeis([c('currentAssets',100,null),c('currentLiabilities',80,null)]);
 assert.equal(completo.excecoes.some(x=>x.includes('Capital circulante incompleto')),false);
});

test('saldo circulante negativo requer revisão de sinal antes da conciliação',()=>{
 const r=triarExcecoesContabeis([c('currentAssets',-25,null),c('currentLiabilities',80,null)]);
 assert.ok(r.excecoes.some(x=>x.includes('Saldo circulante negativo')));
 assert.ok(r.excecoes.some(x=>x.includes('NCG operacional')));
 assert.equal(r.recebidos,2);
});
test('saldo circulante zero não é classificado como negativo',()=>{
 const r=triarExcecoesContabeis([c('currentAssets',0,null),c('currentLiabilities',80,null)]);
 assert.equal(r.excecoes.some(x=>x.includes('Saldo circulante negativo')),false);
});

test('dois saldos circulantes negativos geram um alerta consolidado',()=>{
 const r=triarExcecoesContabeis([c('currentAssets',-10,null),c('currentLiabilities',-20,null)]);
 assert.equal(r.excecoes.filter(x=>x.includes('Saldo circulante negativo')).length,1);
 assert.ok(r.excecoes.some(x=>x.includes('NCG operacional')));
});

test('receita bruta negativa exige conferência de estornos antes de projetar',()=>{
 const r=triarExcecoesContabeis([c('rbt12',-200,12)]);
 assert.ok(r.excecoes.some(x=>x.includes('RBT12 negativa')));
 assert.equal(r.recebidos,1);
});
test('tributos negativos exigem conferência de créditos e compensações',()=>{
 const r=triarExcecoesContabeis([c('currentConsumptionTaxAnnual',-50,12)]);
 assert.ok(r.excecoes.some(x=>x.includes('Tributos atuais negativos')));
 assert.equal(r.excecoes.some(x=>x.includes('período de 12 meses não comprovado')),false);
});
test('receita e tributos positivos não recebem alerta de sinal negativo',()=>{
 const r=triarExcecoesContabeis([c('rbt12',200,12),c('currentConsumptionTaxAnnual',50,12)]);
 assert.equal(r.excecoes.some(x=>x.includes('RBT12 negativa')||x.includes('Tributos atuais negativos')),false);
});
