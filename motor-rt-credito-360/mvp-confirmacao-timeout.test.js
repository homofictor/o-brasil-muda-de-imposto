import test from 'node:test';
import assert from 'node:assert/strict';
import {criarEmissorConfirmado, TIPO_CONFIRMACAO} from './mvp-confirmacao-transferencia.js';

test('timeout não confirma recebimento e permite novo envio', () => {
  const timers = new Map(), enviados = [], confirmados = [], avisos = [];
  let timerId = 0;
  const canal = {postMessage: pacote => enviados.push(pacote)};
  const emissor = criarEmissorConfirmado({canal,
    avisar: aviso => avisos.push(aviso), aoConfirmar: x => confirmados.push(x),
    agendar: fn => {const id = ++timerId; timers.set(id, fn); return id;},
    desagendar: id => timers.delete(id)
  });
  emissor.enviar([{field:'rbt12',value:100}]);
  timers.get(1)();
  canal.onmessage({data:{tipo:TIPO_CONFIRMACAO,envioId:1}});
  assert.equal(confirmados.length,0);
  assert.match(avisos.at(-1),/não confirmado/);
  emissor.enviar([{field:'rbt12',value:100}]);
  assert.deepEqual(enviados.map(x=>x.envioId),[1,2]);
  canal.onmessage({data:{tipo:TIPO_CONFIRMACAO,envioId:2}});
  assert.deepEqual(confirmados,[{envioId:2,quantidade:1}]);
});

test('falha ao publicar pacote não confirma e permite nova tentativa', () => {
  const confirmados=[], avisos=[];
  let falhar=true;
  const canal={postMessage:()=>{if(falhar) throw Error('channel closed');}};
  const emissor=criarEmissorConfirmado({canal,avisar:x=>avisos.push(x),aoConfirmar:x=>confirmados.push(x),agendar:()=>1,desagendar:()=>{}});
  emissor.enviar([{}]);
  assert.match(avisos.at(-1),/Falha no envio local/);
  canal.onmessage({data:{tipo:TIPO_CONFIRMACAO,envioId:1}});
  assert.equal(confirmados.length,0);
  falhar=false;
  emissor.enviar([{}]);
  canal.onmessage({data:{tipo:TIPO_CONFIRMACAO,envioId:2}});
  assert.deepEqual(confirmados,[{envioId:2,quantidade:1}]);
});
