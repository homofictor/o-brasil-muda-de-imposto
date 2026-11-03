const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../simulador/v3/import.js'), 'utf8');
const line = source.split('\n').find(value => value.startsWith('function csvRows(text){'));
assert.ok(line, 'csvRows must remain available in the existing v3.2 importer');
const csvRows = vm.runInNewContext(line + '; csvRows', {});
const plain = rows => Array.from(rows, row => Array.from(row));

test('semicolon CSV with quoted commas and UTF-8 BOM', () => {
  assert.deepEqual(plain(csvRows('\uFEFF"Descrição, com vírgula";Saldo;Período\r\n"Receita, líquida";123;2025')), [
    ['Descrição, com vírgula', 'Saldo', 'Período'],
    ['Receita, líquida', '123', '2025']
  ]);
});

test('comma CSV with quoted semicolons', () => {
  assert.deepEqual(plain(csvRows('"Descrição; detalhe",Valor\n"Teste; a",10')), [
    ['Descrição; detalhe', 'Valor'],
    ['Teste; a', '10']
  ]);
});
