'use strict';
// Executa o mesmo caminho de cálculo da interface, sem empresas reais.
// O DOM mínimo permite conferir estados, valores, bloqueios e resultados do app.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const sourceHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
const mainScripts=[...sourceHtml.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g)]
  .map(m=>m[1]).filter(Boolean);
const inline=mainScripts.at(-1);
const fixtureScript=fs.readFileSync(path.join(root,'qa-fixtures.js'),'utf8');
const qaScript=fs.readFileSync(path.join(root,'qa-panel.js'),'utf8');
const engine=require('../das-2027.js');
const browserWindow={location:{search:'?qa-runner=1'},SimplesDAS2027:engine,SimplesProjecao:require('../projecao.js'),
  print(){},scrollTo(){}};
vm.runInNewContext(fixtureScript,{window:browserWindow});
function Event(type,props){this.type=type;Object.assign(this,props||{});}
function makeDocument(){
 const elements=new Map();
 function makeClassList(){
  const set=new Set();
  return {add:k=>set.add(k),remove:k=>set.delete(k),
    toggle:(k,force)=>{if(force)set.add(k);else set.delete(k);},contains:k=>set.has(k)};
 }
 function get(id){
  if(!elements.has(id)){
   elements.set(id,{id,type:id.startsWith('chk')?'checkbox':'text',value:'',checked:false,
    textContent:'',innerHTML:'',style:{},disabled:false,readOnly:false,
    classList:makeClassList(),children:[],listeners:{},
    addEventListener(name,callback){this.listeners[name]=callback;},
    dispatchEvent(evt){if(this.listeners[evt.type])this.listeners[evt.type](evt);},
    click(){if(this.listeners.click)this.listeners.click();},
    replaceChildren(...children){this.children=children;},appendChild(child){this.children.push(child);},
    scrollIntoView(){}});
  }
  return elements.get(id);
 }
 return {getElementById:get,querySelectorAll:()=>[],createElement:tag=>({tag,textContent:'',style:{},children:[],appendChild(child){this.children.push(child);}})};
}
const doc=makeDocument();
const queryParser=class{has(key){return key==='qa-runner';}};
const env={window:browserWindow,document:doc,Event,URLSearchParams:queryParser};
vm.runInNewContext(inline,env);
vm.runInNewContext(qaScript,env);
assert.equal(typeof browserWindow.SD360QA.verificar,'function');
assert.equal(browserWindow.SD360QA.casos.length,28);
for(const item of browserWindow.SD360QA.casos){
 test(item.entrada.id+' '+item.entrada.empresa,()=>{
  const actual=browserWindow.SD360QA.verificar(doc,item);
  assert.equal(actual.ok,true,'Divergências: '+actual.erros.join(' | '));
  if(item.esperado.status_esperado==='BLOQUEAR')assert.equal(actual.observado,'Cálculo bloqueado');
  else assert.ok(actual.indicadores>=8,'Insuficientes indicadores verificados');
 });
}

test('Interface renderiza 12 meses e bloqueia projeção incoerente',()=>{
const values={modoDas:'auto',simples:'sim',anexo:'I',rbt12:600000,receita:50000,sujeitaFatorR:'nao',taxaCbs:9,taxaIbs:.1,creditoCbs:1000,creditoIbs:0,admin:500,b2b:0,elegiveis:0,capture:0,tributosExtra:0,projAtiva:'sim',projHistorico:Array(12).fill(50000).join(';'),projCrescimento:2,projCreditos:'proporcionais',projFuturas:''};
for(const [k,v] of Object.entries(values))doc.getElementById(k).value=String(v);
doc.getElementById('calcular').click();
assert.equal(doc.getElementById('projLinhas').children.length,12);
assert.match(doc.getElementById('projResumo').textContent,/Receita anual/);
doc.getElementById('projHistorico').value='100';doc.getElementById('calcular').click();
assert.match(doc.getElementById('projResumo').textContent,/Projeção bloqueada/);
assert.equal(doc.getElementById('projLinhas').children.length,0);
});
