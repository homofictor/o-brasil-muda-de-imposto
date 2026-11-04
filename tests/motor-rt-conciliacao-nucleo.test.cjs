'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { conciliarSaldos } = require('../motor-rt-credito-360/reconciliacao.cjs');
const bp = [{ codigo: '1.1', centavos: 10000 }, { codigo: '2.1', centavos: 0 }];
test('concilia saldos idênticos inclusive zero', () => assert.deepEqual(conciliarSaldos(bp, [...bp]), { conciliado: true, divergencias: [] }));
test('divergência de um centavo sem ajuste automático', () => assert.deepEqual(conciliarSaldos(bp, [{ codigo: '1.1', centavos: 9999 }, bp[1]]).divergencias, [{ codigo: '1.1', bpCentavos: 10000, balanceteCentavos: 9999, motivo: 'saldo_divergente' }]));
test('conta ausente difere de saldo zero', () => assert.equal(conciliarSaldos(bp, [bp[0]]).divergencias[0].motivo, 'ausente_no_balancete'));
test('rejeita duplicatas e saldos não inteiros', () => { assert.throws(() => conciliarSaldos([...bp, bp[0]], bp), /duplicada/); assert.throws(() => conciliarSaldos([{ codigo: '1', centavos: 1.5 }], []), /inválido/); });
