'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { importarMovimentosV32 } = require('../motor-rt-credito-360/importador-v32-adaptador.cjs');
const periodo = { inicio: '2026-01-01', fim: '2026-06-30' };
const doc = { file: 'balancete-ficticio.csv', movimentosRevisados: [{ codigo: '1.01', movimentosCentavos: 12500, competenciaInicio: periodo.inicio, competenciaFim: periodo.fim, revisado: true }] };
test('rejeita sugestões de indicadores sem movimentos revisados', () => {
  assert.equal(importarMovimentosV32([{ file: 'dre.pdf', candidates: [{ field: 'rbt12', value: 100 }] }], periodo).motivo, 'movimentos_revisados_ausentes');
});
test('preserva documento e centavos sem inferir diferenças de saldos', () => {
  const r = importarMovimentosV32([doc], periodo);
  assert.equal(r.valido, true);
  assert.deepEqual(r.movimentos[0], { codigo: '1.01', movimentosCentavos: 12500, documentoOrigem: doc.file, competenciaInicio: periodo.inicio, competenciaFim: periodo.fim });
});
test('bloqueia documento de origem divergente', () => {
  assert.equal(importarMovimentosV32([{ ...doc, movimentosRevisados: [{ ...doc.movimentosRevisados[0], documentoOrigem: 'outro.pdf' }] }], periodo).motivo, 'origem_inconsistente');
});
test('bloqueia competência divergente', () => {
  assert.equal(importarMovimentosV32([doc], { inicio: '2026-02-01', fim: periodo.fim }).valido, false);
});

test('bloqueia arquivos distintos com mesmo nome, sem identificador inequívoco', () => {
  const segundo = { file: doc.file, movimentosRevisados: [{ ...doc.movimentosRevisados[0], codigo: '2.01' }] };
  assert.equal(importarMovimentosV32([doc, segundo], periodo).motivo, 'origem_documental_duplicada');
});
test('permite nomes distintos e contas distintas', () => {
  const segundo = { file: 'dre-ficticia.csv', movimentosRevisados: [{ ...doc.movimentosRevisados[0], codigo: '2.01' }] };
  assert.equal(importarMovimentosV32([doc, segundo], periodo).valido, true);
});
