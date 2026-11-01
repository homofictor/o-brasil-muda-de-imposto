import test from 'node:test';
import assert from 'node:assert/strict';
import {iniciarPonteImportacaoMVP} from './mvp-import-bridge.js';

test('pagehide descarta candidatos recebidos e invalida canal antigo no retorno da navegação', () => {
  const original = Object.fromEntries(['window', 'location', 'BroadcastChannel', 'crypto'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const canais = [], avisos = [], recebidos = [];
  let limpezas = 0, contador = 0;
  const handlers = new Map();
  class CanalFalso {
    constructor(nome) { this.nome = nome; this.fechado = false; canais.push(this); }
    postMessage() {}
    close() { this.fechado = true; }
  }
  const abrir = new EventTarget();
  try {
    Object.defineProperty(globalThis, 'BroadcastChannel', {configurable: true, value: CanalFalso});
    Object.defineProperty(globalThis, 'crypto', {configurable: true, value: {randomUUID: () => `00000000-0000-4000-8000-${String(++contador).padStart(12,'0')}`}});
    Object.defineProperty(globalThis, 'location', {configurable: true, value: {href:'https://exemplo.invalid/motor-rt-credito-360/mvp.html'}});
    Object.defineProperty(globalThis, 'window', {configurable: true, value: {
      open: () => ({}), addEventListener: (nome, handler) => handlers.set(nome, handler)
    }});
    const cancelar = iniciarPonteImportacaoMVP({abrir, receber: v => recebidos.push(v), status: v => avisos.push(v), limpar: () => {limpezas++;}});
    abrir.dispatchEvent(new Event('click'));
    const canalAntigo = canais[0];
    const receptorAntigo = canalAntigo.onmessage;
    receptorAntigo({data:{tipo:'rt360-candidatos-revisados-v1', envioId:1, candidatos:[{field:'interestExpense',value:12,periodMonths:6}]}});
    assert.equal(recebidos.length, 1);
    const antes = limpezas;
    handlers.get('pagehide')();
    assert.equal(limpezas, antes + 1, 'candidatos devem ser descartados na navegação');
    assert.equal(canalAntigo.fechado, true);
    assert.equal(canalAntigo.onmessage, null);
    assert.match(avisos.at(-1), /Sessão de importação encerrada/);
    abrir.dispatchEvent(new Event('click'));
    assert.equal(canais.length, 2, 'nova sessão precisa de canal independente');
    assert.notEqual(canais[0].nome, canais[1].nome);
    cancelar();
  } finally {
    for (const [k, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, k, descriptor);
      else delete globalThis[k];
    }
  }
});
