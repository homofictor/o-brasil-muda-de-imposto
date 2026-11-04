'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { conciliarPonteTemporal } = require('../motor-rt-credito-360/ponte-temporal.cjs');
const base = { dataAbertura:'2025-12-31', dataFechamento:'2026-06-30',
  contas:[{codigo:'1.1', aberturaCentavos:10000, movimentosCentavos:-2500, fechamentoCentavos:7500}] };
test('concilia movimentos explícitos',()=>assert.equal(conciliarPonteTemporal(base).comparavel,true));
test('detecta diferença de um centavo',()=>assert.deepEqual(
  conciliarPonteTemporal({...base, contas:[{...base.contas[0], fechamentoCentavos:7501}]}).divergencias,
  [{codigo:'1.1',diferencaCentavos:1}]));
test('não presume movimento ausente',()=>assert.equal(
  conciliarPonteTemporal({...base, contas:[{codigo:'1.1', aberturaCentavos:10000, fechamentoCentavos:7500}]}).motivo,'saldo_ou_movimento_ausente'));
test('rejeita datas invertidas',()=>assert.equal(conciliarPonteTemporal({...base,dataFechamento:'2025-01-01'}).motivo,'periodo_invalido'));
test('rejeita duplicidade',()=>assert.equal(conciliarPonteTemporal({...base,contas:[base.contas[0],base.contas[0]]}).motivo,'conta_invalida_ou_duplicada'));
test('rejeita overflow',()=>assert.equal(conciliarPonteTemporal({...base,contas:[{codigo:'1',aberturaCentavos:Number.MAX_SAFE_INTEGER,movimentosCentavos:1,fechamentoCentavos:0}]}).motivo,'overflow'));
