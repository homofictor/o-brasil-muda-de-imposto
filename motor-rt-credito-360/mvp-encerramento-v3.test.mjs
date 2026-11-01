import test from 'node:test';
import assert from 'node:assert/strict';
import {encerrarSessaoImportadorV3} from './mvp-encerramento-v3.js';

test('pagehide encerra emissor, fecha canal e bloqueia envio no retorno pelo cache', () => {
  const eventos = [];
  const botao = {disabled: false, setAttribute: (nome, valor) => eventos.push([nome, valor])};
  const mensagem = {textContent: ''};
  encerrarSessaoImportadorV3({
    emissor: {encerrar: () => eventos.push('emissor')},
    canal: {close: () => eventos.push('canal')}, botao, mensagem
  });
  assert.equal(botao.disabled, true);
  assert.deepEqual(eventos, ['emissor', 'canal', ['aria-disabled', 'true']]);
  assert.match(mensagem.textContent, /Sessão de transferência encerrada/);
});

test('pagehide antes da montagem do painel fecha o canal sem exceção', () => {
  let fechamentos = 0;
  assert.doesNotThrow(() => encerrarSessaoImportadorV3({
    emissor: null, canal: {close: () => {fechamentos++;}}, botao: null, mensagem: null
  }));
  assert.equal(fechamentos, 1);
});

test('o encerramento não altera dados contábeis nem candidatos', () => {
  const candidatos = [{field: 'interestExpense', value: 12, periodMonths: 6}];
  const antes = structuredClone(candidatos);
  const botao = {disabled: false, setAttribute() {}};
  encerrarSessaoImportadorV3({emissor: null, canal: {close() {}}, botao, mensagem: {textContent: ''}});
  assert.deepEqual(candidatos, antes);
});
