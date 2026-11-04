'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { conciliarSaldos } = require('../motor-rt-credito-360/reconciliacao.cjs');
const { classificarExcecoes } = require('../motor-rt-credito-360/excecoes-materiais.cjs');
const politica = { limiteCentavos: 100, fonte: 'Critério fictício documentado para teste' };
test('divergência abaixo do limite não exige revisão', () => {
 const r=classificarExcecoes(conciliarSaldos([{codigo:'1',centavos:1000}],[{codigo:'1',centavos:950}]),politica);
 assert.equal(r.revisaoPendente,false);assert.equal(r.excecoes[0].diferencaCentavos,50);
});
test('divergência acima do limite exige revisão', () => {
 const r=classificarExcecoes(conciliarSaldos([{codigo:'1',centavos:1000}],[{codigo:'1',centavos:800}]),politica);
 assert.equal(r.revisaoPendente,true);
});
test('conta ausente sempre exige revisão', () => {
 const r=classificarExcecoes(conciliarSaldos([{codigo:'1',centavos:0}],[]),politica);
 assert.equal(r.revisaoPendente,true);assert.equal(r.excecoes[0].diferencaCentavos,null);
});
test('política sem fonte ou limite é rejeitada', () => {
 assert.throws(()=>classificarExcecoes({divergencias:[]},{limiteCentavos:100}),/Política/);
 assert.throws(()=>classificarExcecoes({divergencias:[]},{limiteCentavos:-1,fonte:'x'}),/Política/);
});
test('diferença fora do intervalo seguro é rejeitada', () => {
 assert.throws(()=>classificarExcecoes({divergencias:[{codigo:'1',motivo:'saldo_divergente',bpCentavos:Number.MAX_SAFE_INTEGER,balanceteCentavos:-1}]},politica),RangeError);
});
