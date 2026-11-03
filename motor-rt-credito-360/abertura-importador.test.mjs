import test from 'node:test';
import assert from 'node:assert/strict';
import {abrirImportadorSeguro} from './abertura-importador.js';
test('preserva parâmetros e confirma solicitação', () => {
  let args;
  const r=abrirImportadorSeguro((...a)=>{args=a;return {};},'https://example.test/?rt360=abc');
  assert.equal(r.solicitado,true);
  assert.deepEqual(args,['https://example.test/?rt360=abc','_blank','noopener,noreferrer']);
});
test('retorno null não significa bloqueio com noopener', () => {
  assert.equal(abrirImportadorSeguro(()=>null,'x').solicitado,true);
});
test('exceção de window.open é tratada', () => {
  assert.equal(abrirImportadorSeguro(()=>{throw Error('blocked')},'x').solicitado,false);
});
