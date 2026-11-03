import test from 'node:test';
import assert from 'node:assert/strict';
import {criarEmissorConfirmado, TIPO_CONFIRMACAO} from './mvp-confirmacao-transferencia.js';
function preparar() {
  const enviados = [], confirmados = [];
  const canal = {postMessage: pacote => enviados.push(pacote)};
  const emissor = criarEmissorConfirmado({canal, avisar: () => {},
    aoConfirmar: pacote => confirmados.push(pacote), agendar: () => 1, desagendar: () => {}});
  return {enviados, confirmados, canal, emissor};
}
test('permite transferir somente rubricas preliminares', () => {
  const s = preparar();
  s.emissor.enviar([], [{conta: 'receita'}]);
  assert.equal(s.enviados[0].candidatos.length, 0);
  assert.equal(s.enviados[0].rascunhos.length, 1);
});
test('recusa pacote totalmente vazio', () => {
  const s = preparar();
  assert.throws(() => s.emissor.enviar([], []));
  assert.equal(s.enviados.length, 0);
});
test('confirma recebimento mesmo sem valores aceitos', () => {
  const s = preparar();
  s.emissor.enviar([], [{conta: 'receita'}]);
  s.canal.onmessage({data: {tipo: TIPO_CONFIRMACAO, envioId: 1}});
  assert.equal(s.confirmados.length, 1);
});
test('preserva envio de valores aceitos', () => {
  const s = preparar();
  s.emissor.enviar([{field: 'rbt12', value: 10}]);
  assert.equal(s.enviados[0].candidatos.length, 1);
});
