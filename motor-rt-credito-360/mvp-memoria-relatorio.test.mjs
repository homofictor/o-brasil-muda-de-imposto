import test from 'node:test';
import assert from 'node:assert/strict';
import {gerarMemoriaContabilSintetica} from './mvp-memoria-relatorio.js';

test('memória fictícia apresenta conciliação aritmética de balancete e BP', () => {
  const r = gerarMemoriaContabilSintetica();
  assert.equal(r.status, 'memoria_contabil_sintetica');
  assert.equal(r.periodo, 2026);
  assert.equal(r.indicadores.length, 5);
  assert.equal(r.indicadores[0].valor, 1700);
  assert.match(r.indicadores[0].nota, /Créditos: 1700; diferença: 0/);
  assert.equal(r.indicadores[1].valor, 1060);
  assert.match(r.indicadores[1].nota, /Passivo: 640; patrimônio líquido: 420/);
});

test('memória demonstra DRE, EBITDA e variação de NCG do exemplo', () => {
  const r = gerarMemoriaContabilSintetica();
  assert.equal(r.indicadores[2].valor, 800);
  assert.equal(r.indicadores[3].valor, 160);
  assert.equal(r.indicadores[4].valor, 10);
  assert.match(r.indicadores[4].nota, /anterior: 220; atual: 230/);
});

test('memória explicita independência dos cenários e ausência de FCADS', () => {
  const r = gerarMemoriaContabilSintetica();
  assert.match(r.ressalva, /não alimentam os três cenários/);
  assert.match(r.ressalva, /Não há DFC, FCADS contratual/);
  assert.match(r.ressalva, /fictícia/);
});
