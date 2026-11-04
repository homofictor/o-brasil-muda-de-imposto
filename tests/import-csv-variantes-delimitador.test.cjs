const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'simulador/v3/import.js'), 'utf8');
const match = source.match(/function csvRows\(text\)\{[\s\S]*?\nfunction rowsText\(/);
assert.ok(match, 'csvRows deve permanecer no importador compartilhado');
const csvRows = vm.runInNewContext(match[0].slice(0, -'function rowsText('.length) + '; csvRows');
const cases = [
  ['CSV com vírgulas e descrição entre aspas', 'Conta,Valor\n"Receita, serviços",1200\nCaixa,500', [['Conta','Valor'],['Receita, serviços','1200'],['Caixa','500']]],
  ['CSV com quebra de linha CR isolada', 'Conta;Valor\rCaixa;500\r', [['Conta','Valor'],['Caixa','500']]],
];
for (const [name, input, expected] of cases) {
  assert.deepEqual(JSON.parse(JSON.stringify(csvRows(input))), expected, name);
  console.log('OK: ' + name);
}
