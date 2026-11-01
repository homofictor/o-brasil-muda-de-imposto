import test from 'node:test';
import assert from 'node:assert/strict';
import {iniciarPonteImportacaoMVP} from './mvp-import-bridge.js';

test('rejeita transferência sem envioId e confirma somente identificador válido',()=>{
 const old={window:globalThis.window,location:globalThis.location,BroadcastChannel:globalThis.BroadcastChannel,crypto:globalThis.crypto};
 const recebidos=[],avisos=[],enviados=[],canais=[];
 class Canal {
  constructor(){canais.push(this)}
  close(){}
  postMessage(m){enviados.push(m)}
 }
 const abrir=new EventTarget();
 try{
  globalThis.BroadcastChannel=Canal;
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'}});
  globalThis.location={href:'https://exemplo.invalid/motor-rt-credito-360/mvp.html'};
  globalThis.window={open:()=>({}),addEventListener:()=>{}};
  iniciarPonteImportacaoMVP({abrir,receber:x=>recebidos.push(x),status:x=>avisos.push(x),limpar:()=>{}});
  abrir.dispatchEvent(new Event('click'));
  const pacote={tipo:'rt360-candidatos-revisados-v1',candidatos:[{field:'interestExpense',value:12,periodMonths:12}]};
  for(const envioId of [undefined,0,-1,'1',1.5,Infinity,Number.MAX_SAFE_INTEGER+1]){
   canais[0].onmessage({data:{...pacote,envioId}});
   assert.equal(recebidos.length,0);
   assert.equal(enviados.length,0);
   assert.match(avisos.at(-1),/recusado/);
  }
  canais[0].onmessage({data:{...pacote,envioId:1}});
  assert.equal(recebidos.length,1);
  assert.deepEqual(enviados,[{tipo:'rt360-recebimento-confirmado-v1',envioId:1}]);
 }finally{
  for(const [k,v] of Object.entries(old)){
   if(v===undefined)delete globalThis[k];else Object.defineProperty(globalThis,k,{configurable:true,value:v});
  }
 }
});
