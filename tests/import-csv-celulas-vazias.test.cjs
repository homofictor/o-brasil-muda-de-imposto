'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../simulador/v3/import.js'), 'utf8');
const start = source.indexOf('function csvRows(');
assert.notEqual(start, -1, 'Leitor CSV compartilhado não encontrado');
const end = source.indexOf('\nfunction ', start + 1);
const context = vm.createContext({});
vm.runInContext(source.slice(start, end < 0 ? undefined : end), context, { timeout: 1000 });
const parse = (csv) => JSON.parse(JSON.stringify(context.csvRows(csv)));

test('preserva células vazias e última coluna vazia no balancete', () => {
  assert.deepEqual(parse('Conta;Débito;Crédito;Saldo\nCaixa;100;;100\nFornecedores;;50;'),
    [['Conta','Débito','Crédito','Saldo'],['Caixa','100','','100'],['Fornecedores','','50','']]);
});

test('ignora linhas completamente vazias sem deslocar contas', () => {
  assert.deepEqual(parse('Conta;Valor\r\n\r\nReceita;100\r\n  ;  \r\nDespesa;20\r\n'),
    [['Conta','Valor'],['Receita','100'],['Despesa','20']]);
});

test('mantém zero como valor contábil válido', () => {
  assert.deepEqual(parse('Conta;Saldo\nCaixa;0\nImpostos;0'),
    [['Conta','Saldo'],['Caixa','0'],['Impostos','0']]);
});
