import test from 'node:test';
import assert from 'node:assert/strict';
import {extrairCandidatosRevisados, validarPacoteRevisado, estimarJurosAnuais, iniciarPonteImportacaoMVP} from './mvp-import-bridge.js';
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

test('nova sessão de importação invalida candidatos da sessão anterior antes de abrir outra aba',()=>{
 const anteriores={window:globalThis.window,location:globalThis.location,BroadcastChannel:globalThis.BroadcastChannel,crypto:globalThis.crypto};
 const canais=[];let contador=0;const limpezas=[];const recebidos=[];
 class CanalFalso {
  constructor(nome){this.nome=nome;this.fechado=false;canais.push(this)}
  close(){this.fechado=true}
 }
 const abrir=new EventTarget();
 try {
  globalThis.BroadcastChannel=CanalFalso;
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=>`00000000-0000-4000-8000-${String(++contador).padStart(12,'0')}`}});
  globalThis.location={href:'https://exemplo.invalid/motor-rt-credito-360/mvp.html'};
  globalThis.window={open:()=>({}),addEventListener:()=>{}};
  iniciarPonteImportacaoMVP({abrir,receber:c=>recebidos.push(c),status:()=>{},limpar:()=>limpezas.push('limpou')});
  abrir.dispatchEvent(new Event('click'));
  canais[0].onmessage({data:{tipo:'rt360-candidatos-revisados-v1',envioId:1,candidatos:[{field:'interestExpense',value:24,periodMonths:6}]}});
  assert.equal(recebidos.length,1);
  abrir.dispatchEvent(new Event('click'));
  assert.equal(canais[0].fechado,true);
  assert.equal(limpezas.length,2);
  assert.equal(canais.length,2);
 } finally {
  for(const [k,v] of Object.entries(anteriores)){
   if(v===undefined)delete globalThis[k];else Object.defineProperty(globalThis,k,{configurable:true,value:v});
  }
 }
});
