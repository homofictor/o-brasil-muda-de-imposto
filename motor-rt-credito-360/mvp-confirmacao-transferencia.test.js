import test from 'node:test';
import assert from 'node:assert/strict';
import {criarEmissorConfirmado, TIPO_CONFIRMACAO} from './mvp-confirmacao-transferencia.js';

function setup() {
  const enviados = [], confirmados = [];
  const canal = {postMessage: pacote => enviados.push(pacote)};
  const emissor = criarEmissorConfirmado({
    canal, avisar: () => {}, aoConfirmar: evento => confirmados.push(evento),
    agendar: () => 1, desagendar: () => {}
  });
  return {canal, emissor, enviados, confirmados};
}
test('ACK correto confirma uma única vez', () => {
  const x = setup();
  x.emissor.enviar([{}]);
  x.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  x.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  assert.deepEqual(x.confirmados, [{envioId: 1, quantidade: 1}]);
});
test('ACK incorreto não confirma', () => {
  const x = setup();
  x.emissor.enviar([{}]);
  x.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 99}});
  x.canal.onmessage({data: {tipo: 'outro', envioId: 1}});
  assert.equal(x.confirmados.length, 0);
});
test('ACK de envio antigo é ignorado', () => {
  const x = setup();
  x.emissor.enviar([{}]);
  x.emissor.enviar([{}, {}]);
  x.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  assert.equal(x.confirmados.length, 0);
  x.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 2}});
  assert.deepEqual(x.confirmados, [{envioId: 2, quantidade: 2}]);
});
test('encerramento impede confirmação', () => {
  const x = setup();
  x.emissor.enviar([{}]);
  x.emissor.encerrar();
  assert.equal(x.canal.onmessage, null);
  assert.equal(x.confirmados.length, 0);
});
