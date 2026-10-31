import test from 'node:test';
import assert from 'node:assert/strict';
import {apurarCreditosAnuais} from './creditos.js';

test('rejeita estouro numérico no saldo disponível de IBS ou CBS', () => {
  assert.throws(() => apurarCreditosAnuais({anoInicial:2027, anos:1,
    saldoInicial:1e308, gerados:{2027:1e308}}), /limite numérico/);
});

test('preserva a conciliação dos saldos usuais em exercícios consecutivos', () => {
  const r=apurarCreditosAnuais({anoInicial:2027, anos:2, saldoInicial:100,
    gerados:{2027:50,2028:20}, debitos:{2027:40,2028:60}, ressarcidos:{2028:10}});
  assert.deepEqual(r.map(a=>a.saldoFinal), [110,60]);
  assert.ok(r.every(a=>Number.isFinite(a.conciliacao) && Math.abs(a.conciliacao)<1e-7));
});
