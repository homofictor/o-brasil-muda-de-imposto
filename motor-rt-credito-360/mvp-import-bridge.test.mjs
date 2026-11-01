import test from 'node:test';
import assert from 'node:assert/strict';
import {extrairCandidatosRevisados, validarPacoteRevisado, estimarJurosAnuais} from './mvp-import-bridge.js';
const aceito=(field,value,periodMonths=12)=>({field,value,periodMonths,accepted:true,applied:true});
test('somente candidatos explicitamente aceitos, sem CNPJ ou fonte documental',()=>{
 const result=extrairCandidatosRevisados([aceito('interestExpense',24,6),aceito('cnpj',123),
  {...aceito('rbt12',300),accepted:false},{...aceito('currentAssets',100),applied:false},
  {...aceito('interestExpense',24,6),source:'nome-documento.pdf'}]);
 assert.deepEqual(result,[{field:'interestExpense',value:24,periodMonths:6}]);
 assert.equal(JSON.stringify(result).includes('documento'),false);
});
test('rejeita campos conflitantes e valores não finitos',()=>{
 assert.deepEqual(extrairCandidatosRevisados([aceito('rbt12',200),aceito('rbt12',300),aceito('interestExpense',Infinity)]),[]);
});
test('valida pacote recebido e bloqueia campos arbitrários, duplicações e períodos falsos',()=>{
 const tipo='rt360-candidatos-revisados-v1';
 assert.deepEqual(validarPacoteRevisado({tipo,candidatos:[{field:'rbt12',value:120,periodMonths:12}]}),
  [{field:'rbt12',rotulo:'Receita bruta/RBT12 (referência, não receita líquida)',value:120,periodMonths:12}]);
 for(const candidatos of [[{field:'cnpj',value:123,periodMonths:12}],
  [{field:'rbt12',value:Infinity,periodMonths:12}],
  [{field:'rbt12',value:100,periodMonths:13}],
  [{field:'rbt12',value:100,periodMonths:12},{field:'rbt12',value:200,periodMonths:12}]])
  assert.throws(()=>validarPacoteRevisado({tipo,candidatos}));
});
test('despesa financeira de período parcial é anualizada uma vez, somente com período válido',()=>{
 assert.equal(estimarJurosAnuais([{field:'interestExpense',value:24,periodMonths:6}]),48);
 assert.equal(estimarJurosAnuais([{field:'interestExpense',value:24,periodMonths:null}]),null);
 assert.equal(estimarJurosAnuais([{field:'interestExpense',value:-24,periodMonths:12}]),null);
});
test('não mapeia receita bruta, ativo ou passivo circulante como receita líquida ou NCG',()=>{
 const r=validarPacoteRevisado({tipo:'rt360-candidatos-revisados-v1',candidatos:[
  {field:'rbt12',value:800,periodMonths:12},{field:'currentAssets',value:100,periodMonths:null}]});
 assert.equal(estimarJurosAnuais(r),null);
 assert.equal(r.length,2);
});
