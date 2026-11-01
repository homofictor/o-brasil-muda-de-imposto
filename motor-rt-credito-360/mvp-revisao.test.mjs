import test from 'node:test';
import assert from 'node:assert/strict';
import {configurarInvalidacaoRevisaoMVP} from './mvp-revisao.js';

function tela() {
  const ids = ['financeiro', 'atividades', 'ncg', 'revisao-dre', 'revisao-ponte', 'revisao-ncg', 'resultados', 'mensagem'];
  const itens = Object.fromEntries(ids.map(id => [id, Object.assign(new EventTarget(), {checked: false, hidden: true, textContent: '', className: ''})]));
  configurarInvalidacaoRevisaoMVP({getElementById: id => itens[id]});
  return itens;
}
const marcar = tela => ['dre', 'ponte', 'ncg'].forEach(id => { tela['revisao-' + id].checked = true; });

test('alteração de qualquer grupo financeiro invalida todas as revisões e oculta resultados', () => {
  for (const grupo of ['financeiro', 'atividades', 'ncg']) {
    const t = tela(); marcar(t); t.resultados.hidden = false;
    t[grupo].dispatchEvent(new Event('input'));
    assert.equal(t.resultados.hidden, true);
    for (const id of ['dre', 'ponte', 'ncg']) assert.equal(t['revisao-' + id].checked, false);
    assert.match(t.mensagem.textContent, /Confirme novamente/);
  }
});

test('evento change também invalida revisões (alteração por controle do navegador)', () => {
  const t = tela(); marcar(t);
  t.atividades.dispatchEvent(new Event('change'));
  assert.equal(t['revisao-dre'].checked, false);
  assert.equal(t['revisao-ponte'].checked, false);
  assert.equal(t['revisao-ncg'].checked, false);
});

test('alterar checkbox após cálculo oculta resultados anteriores', () => {
  const t = tela(); marcar(t); t.resultados.hidden = false;
  t['revisao-ponte'].checked = false;
  t['revisao-ponte'].dispatchEvent(new Event('change'));
  assert.equal(t.resultados.hidden, true);
  assert.match(t.mensagem.textContent, /Calcule novamente/);
});

test('edição inicial não cria alerta falso quando não há resultado ou revisão', () => {
  const t = tela();
  t.financeiro.dispatchEvent(new Event('input'));
  assert.equal(t.mensagem.textContent, '');
  assert.equal(t.resultados.hidden, true);
});
