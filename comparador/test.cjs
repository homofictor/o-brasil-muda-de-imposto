const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(code);
const ctx = vm.createContext({});
for (const name of ['cnpjValid', 'calc']) {
  const start = code.indexOf('function ' + name + '(');
  const end = code.indexOf('\n', start);
  vm.runInContext(code.slice(start, end), ctx);
}
assert.equal(ctx.cnpjValid('11.222.333/0001-81'), true);
assert.equal(ctx.cnpjValid('11.222.333/0001-82'), false);
assert.equal(ctx.cnpjValid('00.000.000/0000-00'), false);
assert.equal(ctx.cnpjValid('12.ABC.345/01DE-35'), true);
const proposal = { total: 100000, freight: 1000, days: 60, credit: 20000, creditDays: 30 };
assert.equal(ctx.calc(proposal, 0, 'eligible').withCredit, 81000);
assert.equal(ctx.calc(proposal, 0, 'none').withCredit, 101000);
assert.equal(ctx.calc(proposal, 1, 'eligible').withCredit, 101000 / 1.01 ** 2 - 20000 / 1.01);
assert.ok(ctx.calc({...proposal, creditDays: 90}, 1, 'eligible').withCredit > ctx.calc(proposal, 1, 'eligible').withCredit);
assert.ok(ctx.calc({...proposal, days: 90}, 1, 'eligible').withCredit < ctx.calc(proposal, 1, 'eligible').withCredit);
console.log('OK: sintaxe, 4 validações de CNPJ e 5 testes financeiros.');
