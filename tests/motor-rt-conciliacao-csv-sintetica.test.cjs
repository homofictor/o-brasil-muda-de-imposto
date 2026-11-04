'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercita o leitor real com BP e DRE sintéticos, sem dados pessoais.
const source = fs.readFileSync(path.resolve(__dirname, '../simulador/v3/import.js'), 'utf8');
const start = source.indexOf('function csvRows(');
assert.ok(start >= 0, 'Leitor CSV compartilhado não encontrado');
const end = source.indexOf('\nfunction ', start + 1);
const context = vm.createContext({});
vm.runInContext(source.slice(start, end < 0 ? undefined : end), context, { timeout: 1000 });
const parse = text => JSON.parse(JSON.stringify(context.csvRows(text)));
const amount = text => {
  const value = String(text).trim().replace(/\./g, '').replace(',', '.');
  assert.match(value, /^-?\d+(?:\.\d+)?$/, 'Saldo não numérico');
  return Number(value);
};
const mapAccounts = csv => {
  const rows = parse(csv);
  assert.deepEqual(rows[0], ['Conta', 'Valor'], 'Cabeçalho incompatível');
  const entries = rows.slice(1);
  assert.ok(entries.every(row => row.length === 2), 'Colunas desalinhadas');
  return Object.fromEntries(entries.map(([key, value]) => [key, amount(value)]));
};
const bp = 'Conta;Valor\nAtivo circulante;1.200,00\nAtivo não circulante;800,00\nPassivo circulante;500,00\nPassivo não circulante;400,00\nPatrimônio líquido;1.100,00';
const dre = 'Conta;Valor\nReceita líquida;2.000,00\nCustos;-1.200,00\nDespesas operacionais;-300,00\nResultado operacional;500,00';

test('BP fictício conciliado: ativo = passivo + patrimônio líquido', () => {
  const a = mapAccounts(bp);
  assert.equal(a['Ativo circulante'] + a['Ativo não circulante'], a['Passivo circulante'] + a['Passivo não circulante'] + a['Patrimônio líquido']);
});
test('DRE fictícia: resultado operacional reconcilia com receitas e despesas', () => {
  const a = mapAccounts(dre);
  assert.equal(a['Receita líquida'] + a.Custos + a['Despesas operacionais'], a['Resultado operacional']);
});
test('divergência material no BP fictício é detectável antes de projetar', () => {
  const a = mapAccounts(bp.replace('1.100,00', '900,00'));
  const diferenca = a['Ativo circulante'] + a['Ativo não circulante'] - a['Passivo circulante'] - a['Passivo não circulante'] - a['Patrimônio líquido'];
  assert.equal(diferenca, 200);
  assert.notEqual(diferenca, 0);
});
