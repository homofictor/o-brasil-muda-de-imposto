import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {iniciarPonteImportacaoMVP} from './mvp-import-bridge.js';

test('restaurar cancela a sessão e impede entrega de candidatos antigos', () => {
  const anteriores = {window: globalThis.window, location: globalThis.location,
    BroadcastChannel: globalThis.BroadcastChannel, crypto: globalThis.crypto};
  const canais = [], recebidos = [], limpezas = [];
  let sequencia = 0;
  class Canal {
    constructor(nome) {this.nome = nome; this.fechado = false; canais.push(this);}
    postMessage() {}
    close() {this.fechado = true;}
  }
  try {
    globalThis.BroadcastChannel = Canal;
    Object.defineProperty(globalThis, 'crypto', {configurable: true,
      value: {randomUUID: () => '00000000-0000-4000-8000-' + String(++sequencia).padStart(12, '0')}});
    globalThis.location = {href: 'https://exemplo.invalid/motor-rt-credito-360/mvp.html'};
    globalThis.window = {open: () => ({}), addEventListener: () => {}};
    const abrir = new EventTarget();
    const cancelar = iniciarPonteImportacaoMVP({abrir,
      receber: x => recebidos.push(x), status: () => {},
      limpar: () => limpezas.push(true)});
    assert.equal(typeof cancelar, 'function');
    abrir.dispatchEvent(new Event('click'));
    const primeiro = canais[0];
    primeiro.onmessage({data: {tipo: 'rt360-candidatos-revisados-v1', envioId: 1,
      candidatos: [{field: 'interestExpense', value: 20, periodMonths: 12}]}});
    assert.equal(recebidos.length, 1);
    cancelar();
    assert.equal(primeiro.fechado, true);
    assert.equal(primeiro.onmessage, null);
    assert.equal(limpezas.length, 2);
    abrir.dispatchEvent(new Event('click'));
    assert.equal(canais.length, 2);
    canais[1].onmessage({data: {tipo: 'rt360-candidatos-revisados-v1', envioId: 1,
      candidatos: [{field: 'interestExpense', value: 30, periodMonths: 12}]}});
    assert.deepEqual(recebidos.map(x => x[0].value), [20, 30]);
  } finally {
    for (const [k, v] of Object.entries(anteriores)) {
      if (v === undefined) delete globalThis[k];
      else Object.defineProperty(globalThis, k, {configurable: true, value: v});
    }
  }
});

test('botão restaurar do HTML encerra a sessão antes de preencher', () => {
  const html = readFileSync(new URL('./mvp.html', import.meta.url), 'utf8');
  assert.match(html, /const cancelarImportacao = iniciarPonteImportacaoMVP\(\{/);
  assert.match(html, /restaurar'\)\.addEventListener\('click',\(\)=>\{cancelarImportacao\?\.\(\);preencher\(\);/);
});
