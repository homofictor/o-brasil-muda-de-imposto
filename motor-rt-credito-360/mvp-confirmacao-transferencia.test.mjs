import test from 'node:test';
import assert from 'node:assert/strict';
import {TIPO_CONFIRMACAO, confirmarRecebimento, criarEmissorConfirmado} from './mvp-confirmacao-transferencia.js';

function ambiente() {
  const mensagens = [];
  const avisos = [];
  const timers = new Map();
  let proximo = 0;
  const canal = {onmessage: null, postMessage: msg => mensagens.push(msg)};
  const emissor = criarEmissorConfirmado({canal, avisar: s => avisos.push(s),
    agendar: fn => {const id = ++proximo; timers.set(id, fn); return id;},
    desagendar: id => timers.delete(id)});
  return {canal, emissor, mensagens, avisos, timers};
}

test('não declara recebido antes de confirmação correlacionada', () => {
  const a = ambiente();
  a.emissor.enviar([{field: 'interestExpense', value: 12, periodMonths: 12}]);
  assert.match(a.avisos.at(-1), /Aguardando confirmação/);
  assert.equal(a.mensagens[0].envioId, 1);
  a.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 2}});
  assert.match(a.avisos.at(-1), /Aguardando confirmação/);
  a.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  assert.match(a.avisos.at(-1), /recebido\(s\)/);
  assert.equal(a.timers.size, 0);
});

test('ausência de aba receptora gera alerta, não falso sucesso', () => {
  const a = ambiente();
  a.emissor.enviar([{field: 'rbt12', value: 100, periodMonths: 12}]);
  for (const fn of a.timers.values()) fn();
  assert.match(a.avisos.at(-1), /não confirmado/);
  a.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  assert.match(a.avisos.at(-1), /não confirmado/);
});

test('envio novo ignora confirmação atrasada de envio anterior', () => {
  const a = ambiente();
  a.emissor.enviar([{field: 'rbt12', value: 100}]);
  a.emissor.enviar([{field: 'rbt12', value: 200}]);
  assert.equal(a.timers.size, 1);
  a.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  assert.match(a.avisos.at(-1), /Aguardando confirmação/);
  a.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 2}});
  assert.match(a.avisos.at(-1), /recebido\(s\)/);
});

test('Motor só confirma pacote com identificador de envio válido', () => {
  const a = ambiente();
  assert.equal(confirmarRecebimento(a.canal, {envioId: 1}), true);
  assert.deepEqual(a.mensagens[0], {tipo: TIPO_CONFIRMACAO, envioId: 1});
  for (const envioId of [null, -1, 0, 1.5, Infinity, '1', Number.MAX_SAFE_INTEGER + 1])
    assert.equal(confirmarRecebimento(a.canal, {envioId}), false);
  assert.equal(a.mensagens.length, 1);
});

test('erro de envio e fechamento não deixam confirmação pendente', () => {
  const a = ambiente();
  a.canal.postMessage = () => {throw new Error('canal indisponível');};
  a.emissor.enviar([{field: 'rbt12', value: 1}]);
  assert.match(a.avisos.at(-1), /Falha no envio/);
  assert.equal(a.timers.size, 0);
  a.emissor.encerrar();
  assert.equal(a.canal.onmessage, null);
  assert.throws(() => a.emissor.enviar([]), /Não há valores ou rubricas/);
});

test('duas abas simuladas trocam candidatos e confirmação sem documentos', async () => {
  const avisos = [];
  const canalMotor = {onmessage: null, postMessage: msg => queueMicrotask(() => canalImportador.onmessage?.({data: msg}))};
  const canalImportador = {onmessage: null, postMessage: msg => queueMicrotask(() => canalMotor.onmessage?.({data: msg}))};
  let recebido = null;
  canalMotor.onmessage = event => {
    recebido = event.data.candidatos;
    confirmarRecebimento(canalMotor, event.data);
  };
  const emissor = criarEmissorConfirmado({canal: canalImportador, avisar: s => avisos.push(s)});
  const candidatos = [{field: 'interestExpense', value: 42, periodMonths: 6}];
  emissor.enviar(candidatos);
  assert.match(avisos.at(-1), /Aguardando confirmação/);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(recebido, candidatos);
  assert.match(avisos.at(-1), /recebido\(s\)/);
  assert.equal(JSON.stringify(recebido).includes('cnpj'), false);
  emissor.encerrar();
});

test('envia rubricas preliminares mesmo sem candidatos numéricos aceitos', () => {
  const a = ambiente();
  const rascunhos = [{campo: 'estoques', valor: 120}];
  a.emissor.enviar([], rascunhos);
  assert.deepEqual(a.mensagens[0].candidatos, []);
  assert.deepEqual(a.mensagens[0].rascunhos, rascunhos);
  assert.match(a.avisos.at(-1), /Aguardando confirmação/);
  a.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  assert.match(a.avisos.at(-1), /0 valor\(es\) recebido\(s\)/);
  a.emissor.encerrar();
});
