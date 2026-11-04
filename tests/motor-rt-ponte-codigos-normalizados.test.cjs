'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { conciliarPonteTemporal } = require('../motor-rt-credito-360/ponte-temporal.cjs');
const base = { dataAbertura:'2025-12-31', dataFechamento:'2026-06-30' };
const conta = (codigo, fechamentoCentavos=110) => ({codigo, aberturaCentavos:100, movimentosCentavos:10, fechamentoCentavos});
test('rejeita códigos equivalentes após trim, sem liberar projeções', () => {
 const r = conciliarPonteTemporal({...base, contas:[conta('1.01'), conta(' 1.01 ')]});
 assert.equal(r.comparavel,false);
 assert.equal(r.revisaoObrigatoria,true);
 assert.equal(r.motivo,'conta_invalida_ou_duplicada');
});
test('normaliza código apresentado nas divergências', () => {
 const r = conciliarPonteTemporal({...base, contas:[conta(' 1.02 ',111)]});
 assert.equal(r.comparavel,false);
 assert.deepEqual(r.divergencias,[{codigo:'1.02',diferencaCentavos:1}]);
});
test('mantém conciliação de código único válido', () => {
 const r = conciliarPonteTemporal({...base, contas:[conta('1.03')]});
 assert.equal(r.comparavel,true);
});
