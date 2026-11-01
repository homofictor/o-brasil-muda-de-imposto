import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {BroadcastChannel} from 'node:worker_threads';
import {criarEmissorConfirmado, confirmarRecebimento, TIPO_CONFIRMACAO} from './mvp-confirmacao-transferencia.js';

const esperar = async (predicado, limiteMs = 1000) => {
  const inicio = Date.now();
  while (!predicado()) {
    if (Date.now() - inicio > limiteMs) throw new Error('Tempo excedido aguardando evento');
    await new Promise(resolve => setTimeout(resolve, 5));
  }
};
const canais = () => {
  const nome = `rt360-teste-${randomUUID()}`;
  return [new BroadcastChannel(nome), new BroadcastChannel(nome)];
};
const candidato = {field:'interestExpense', value:24, periodMonths:6};

test('BroadcastChannel nativo entrega candidatos e confirma somente após recepção', async () => {
  const [origem, destino] = canais();
  const avisos = [], recebidos = [];
  try {
    const emissor = criarEmissorConfirmado({canal:origem, avisar:aviso=>avisos.push(aviso), esperaMs:250});
    destino.onmessage = evento => {
      recebidos.push(evento.data);
      confirmarRecebimento(destino, evento.data);
    };
    emissor.enviar([candidato]);
    assert.match(avisos.at(-1), /Aguardando confirmação/);
    await esperar(() => avisos.some(aviso => /recebido\(s\) pelo Motor/.test(aviso)));
    assert.equal(recebidos.length, 1);
    assert.deepEqual(recebidos[0].candidatos, [candidato]);
    assert.equal(recebidos[0].envioId, 1);
    emissor.encerrar();
  } finally { origem.close(); destino.close(); }
});

test('BroadcastChannel sem receptor não informa recebimento e expira', async () => {
  const [origem, destino] = canais();
  const avisos = [];
  try {
    const emissor = criarEmissorConfirmado({canal:origem, avisar:aviso=>avisos.push(aviso), esperaMs:35});
    emissor.enviar([candidato]);
    await esperar(() => avisos.some(aviso => /não confirmado/.test(aviso)));
    assert.equal(avisos.some(aviso => /recebido\(s\) pelo Motor/.test(aviso)), false);
    emissor.encerrar();
  } finally { origem.close(); destino.close(); }
});

test('confirmação atrasada não confirma uma transferência posterior', async () => {
  const [origem, destino] = canais();
  const avisos = [], ids = [];
  try {
    const emissor = criarEmissorConfirmado({canal:origem, avisar:aviso=>avisos.push(aviso), esperaMs:250});
    destino.onmessage = evento => { ids.push(evento.data.envioId); };
    emissor.enviar([candidato]);
    emissor.enviar([candidato, candidato]);
    await esperar(() => ids.length === 2);
    assert.deepEqual(ids, [1,2]);
    destino.postMessage({tipo:TIPO_CONFIRMACAO, envioId:1});
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(avisos.some(aviso => /recebido\(s\) pelo Motor/.test(aviso)), false);
    destino.postMessage({tipo:TIPO_CONFIRMACAO, envioId:2});
    await esperar(() => avisos.some(aviso => /2 valor\(es\) recebido\(s\)/.test(aviso)));
    emissor.encerrar();
  } finally { origem.close(); destino.close(); }
});
