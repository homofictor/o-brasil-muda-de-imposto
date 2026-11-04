const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'simulador/v3/import.js'), 'utf8');
const match = source.match(/function csvRows\(text\)\{[\s\S]*?\nfunction rowsText\(/);
assert.ok(match, 'csvRows deve permanecer no leitor compartilhado');
const csvRows = vm.runInNewContext(`${match[0].slice(0, -'function rowsText('.length)}; csvRows`);
const cases = [
  {name:'BOM e separador ponto e vírgula', input:'\uFEFFConta;Valor\nReceita;1200', expected:[['Conta','Valor'],['Receita','1200']]},
  {name:'descrição com quebra de linha entre aspas', input:'Conta;Valor\n"Receita\noperacional";1200', expected:[['Conta','Valor'],['Receita\noperacional','1200']]},
  {name:'separador e aspas escapadas', input:'Conta;Valor\n"Serviço; ""especial""";200', expected:[['Conta','Valor'],['Serviço; "especial"','200']]},
  {name:'linhas CRLF', input:'Conta;Valor\r\nCaixa;100\r\n', expected:[['Conta','Valor'],['Caixa','100']]},
];
for(const {name,input,expected} of cases){assert.deepEqual(JSON.parse(JSON.stringify(csvRows(input))),expected,name);console.log(`OK: ${name}`)}
assert.throws(()=>csvRows('Conta;Valor\n"Receita;1200'),/aspas não foi fechado/);
console.log('OK: aspas não fechadas rejeitadas');
