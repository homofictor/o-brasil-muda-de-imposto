import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../simulador/v3/import.js',import.meta.url),'utf8');
const start=source.indexOf('function csvRows(text){');
const end=source.indexOf('function rowsText(',start);
assert.ok(start>=0 && end>start,'Leitor CSV v3.2 deve existir');
const csvRows=runInNewContext(source.slice(start,end)+'\ncsvRows;');

test('CSV UTF-8 com BOM preserva cabeçalho e valores',()=>{
 const rows=csvRows('\\uFEFFConta;Valor\\nReceita;1.234,56\\n');
 assert.deepEqual(JSON.parse(JSON.stringify(rows)),[['Conta','Valor'],['Receita','1.234,56']]);
});

test('CSV sem BOM e campos entre aspas continuam íntegros',()=>{
 const rows=csvRows('Conta;Descrição\\n1;"Receita; líquida"\\n');
 assert.deepEqual(JSON.parse(JSON.stringify(rows)),[['Conta','Descrição'],['1','Receita; líquida']]);
});
