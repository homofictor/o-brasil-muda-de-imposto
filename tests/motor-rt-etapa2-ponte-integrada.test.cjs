'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { avaliarConciliacaoEtapa2 } = require('../motor-rt-credito-360/etapa2-conciliacao.cjs');
const bp = [{ codigo: '1', centavos: 10000 }, { codigo: '2', centavos: 5000 }];
const balancete = [{ codigo: '1', centavos: 12000 }, { codigo: '2', centavos: 4500 }];
const base = { bp, balancete, dataBP: '2025-12-31', dataBalancete: '2026-06-30' };
const movimentos = [{ codigo: '1', movimentosCentavos: 2000 }, { codigo: '2', movimentosCentavos: -500 }];
test('ponte completa e documentada libera projeção sem comparar saldos diretamente', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos });
  assert.equal(r.ponte.comparavel, true);
  assert.equal(r.aptoParaProjetar, true);
  assert.equal(r.conciliacao, null);
  assert.equal(r.homologado, false);
});
test('movimentação divergente bloqueia projeção', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [{ codigo: '1', movimentosCentavos: 1999 }, movimentos[1]] });
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.ponte.divergencias[0].diferencaCentavos, 1);
});
test('movimento ausente bloqueia por cobertura incompleta', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [movimentos[0]] });
  assert.equal(r.motivo, 'cobertura_incompleta_da_ponte');
  assert.equal(r.aptoParaProjetar, false);
});
test('movimento duplicado bloqueia', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, movimentos: [...movimentos, movimentos[0]] });
  assert.equal(r.motivo, 'movimentos_invalidos_ou_duplicados');
});
test('sem movimentos não compara datas diferentes', () => {
  const r = avaliarConciliacaoEtapa2(base);
  assert.equal(r.aptoParaProjetar, false);
  assert.equal(r.ponte, undefined);
});
test('movimento sem saldo de abertura bloqueia', () => {
  const r = avaliarConciliacaoEtapa2({ ...base, bp: [bp[0]], movimentos });
  assert.equal(r.motivo, 'cobertura_incompleta_da_ponte');
});
