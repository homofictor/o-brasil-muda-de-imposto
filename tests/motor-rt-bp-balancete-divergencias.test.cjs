'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Reutiliza o parser existente, sem dados reais e sem assumir materialidade.
const source = fs.readFileSync(path.resolve(__dirname, '../simulador/v3/import.js'), 'utf8');
const start = source.indexOf('function csvRows(');
assert.ok(start >= 0, 'Leitor CSV compartilhado ausente');
const end = source.indexOf('\nfunction ', start + 1);
const context = vm.createContext({});
vm.runInContext(source.slice(start, end < 0 ? undefined : end), context, { timeout: 1000 });
const parse = csv => JSON.parse(JSON.stringify(context.csvRows(csv)));
function accounts(csv) {
  const rows = parse(csv);
  assert.deepEqual(rows[0], ['Conta', 'Valor']);
  const result = new Map();
  for (const row of rows.slice(1)) {
    assert.equal(row.length, 2, 'Quantidade de colunas inválida');
    const [name, raw] = row;
    assert.ok(!result.has(name), 'Conta duplicada: ' + name);
    const normalized = raw.trim().replace(/\./g, '').replace(',', '.');
    assert.match(normalized, /^-?\d+(?:\.\d+)?$/);
    result.set(name, Math.round(Number(normalized) * 100));
  }
  return result;
}
const bp = 'Conta;Valor\nCaixa;1.000,00\nClientes;500,00\nFornecedores;300,00';
const balancete = 'Conta;Valor\nCaixa;1.000,00\nClientes;500,00\nFornecedores;300,00';
function differences(a, b) {
  return [...new Set([...a.keys(), ...b.keys()])].flatMap(name => {
    const left = a.get(name), right = b.get(name);
    return left === right ? [] : [{ name, bpCentavos: left ?? null, balanceteCentavos: right ?? null }];
  });
}
test('BP e balancete sintéticos com saldos idênticos não geram divergências', () => {
  assert.deepEqual(differences(accounts(bp), accounts(balancete)), []);
});
test('divergência de saldo permanece explícita e não é ajustada automaticamente', () => {
  const changed = balancete.replace('1.000,00', '999,99');
  assert.deepEqual(differences(accounts(bp), accounts(changed)), [
    { name: 'Caixa', bpCentavos: 100000, balanceteCentavos: 99999 }
  ]);
});
test('conta ausente no balancete é sinalizada, sem presumir saldo zero', () => {
  const changed = balancete.replace('Clientes;500,00\n', '');
  assert.deepEqual(differences(accounts(bp), accounts(changed)), [
    { name: 'Clientes', bpCentavos: 50000, balanceteCentavos: null }
  ]);
});
test('contas duplicadas são rejeitadas antes da conciliação', () => {
  assert.throws(() => accounts(bp + '\nCaixa;10,00'), /Conta duplicada/);
});
