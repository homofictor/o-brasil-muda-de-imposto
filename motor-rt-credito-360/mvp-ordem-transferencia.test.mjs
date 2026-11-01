import test from 'node:test';
import assert from 'node:assert/strict';
import {iniciarPonteImportacaoMVP} from './mvp-import-bridge.js';

const pacote = (envioId, value) => ({
  tipo: 'rt360-candidatos-revisados-v1', envioId,
  candidatos: [{field: 'interestExpense', value, periodMonths: 12}]
});

test('receptor rejeita mensagens antigas e repetidas sem substituir o último valor revisado', () => {
  const originais = {window: globalThis.window, location: globalThis.location,
    BroadcastChannel: globalThis.BroadcastChannel, crypto: globalThis.crypto};
  const canais = [], recebidos = [], avisos = [];
  class Canal {
    constructor(nome) {this.nome = nome; this.respostas = []; canais.push(this);}
    postMessage(msg) {this.respostas.push(msg);}
    close() {this.fechado = true;}
  }
  try {
    globalThis.BroadcastChannel = Canal;
    Object.defineProperty(globalThis, 'crypto', {configurable: true,
      value: {randomUUID: () => '00000000-0000-4000-8000-000000000001'}});
    globalThis.location = {href: 'https://exemplo.invalid/motor-rt-credito-360/mvp.html'};
    globalThis.window = {open: () => ({}), addEventListener: () => {}};
    const abrir = new EventTarget();
    iniciarPonteImportacaoMVP({abrir, receber: x => recebidos.push(x),
      status: x => avisos.push(x), limpar: () => {}});
    abrir.dispatchEvent(new Event('click'));
    const canal = canais[0];
    canal.onmessage({data: pacote(2, 200)});
    canal.onmessage({data: pacote(1, 100)});
    canal.onmessage({data: pacote(2, 200)});
    assert.deepEqual(recebidos.map(x => x[0].value), [200]);
    assert.equal(canal.respostas.length, 1);
    assert.match(avisos.at(-1), /antiga|repetida/i);
    // Mensagem inválida com id maior não deve bloquear envio posterior válido.
    canal.onmessage({data: {...pacote(5, 500), candidatos: [{field: 'cnpj', value: 1, periodMonths: 12}]}});
    canal.onmessage({data: pacote(3, 300)});
    assert.deepEqual(recebidos.map(x => x[0].value), [200, 300]);
    // Nova sessão reinicia a sequência de envios.
    abrir.dispatchEvent(new Event('click'));
    canais[1].onmessage({data: pacote(1, 400)});
    assert.deepEqual(recebidos.map(x => x[0].value), [200, 300, 400]);
  } finally {
    for (const [k, v] of Object.entries(originais)) {
      if (v === undefined) delete globalThis[k];
      else Object.defineProperty(globalThis, k, {configurable: true, value: v});
    }
  }
});
