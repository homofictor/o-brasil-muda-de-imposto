const assert=require('node:assert/strict');
const{parseMoneyValue,formatMoneyValue}=require('../v3/money-format.js');

assert.equal(parseMoneyValue('20.000,00'),20000);
assert.equal(parseMoneyValue('20000,00'),20000);
assert.equal(parseMoneyValue('20000.50'),20000.5);
assert.equal(parseMoneyValue('-1.234,56'),-1234.56);
assert.equal(formatMoneyValue(20000),'20.000,00');
assert.equal(formatMoneyValue('1234,5'),'1.234,50');

console.log('money-format: padrão brasileiro validado');
