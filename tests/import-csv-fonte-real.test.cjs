'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Executa a função do arquivo real, sem copiar sua implementação para o teste.
const source=fs.readFileSync(path.resolve(__dirname,'../simulador/v3/import.js'),'utf8');
const start=source.indexOf('function csvRows(');
assert.notEqual(start,-1,'csvRows deve existir no leitor compartilhado');
const end=source.indexOf('\nfunction ',start+1);
const functionSource=source.slice(start,end<0?undefined:end);
const context=vm.createContext({});
vm.runInContext(functionSource,context,{timeout:1000});
const parse=(input)=>JSON.parse(JSON.stringify(context.csvRows(input)));

test('BOM e delimitador ponto e vírgula',()=>{
 assert.deepEqual(parse('\uFEFFConta;Valor\nReceita;1.234,56'),[['Conta','Valor'],['Receita','1.234,56']]);
});
test('vírgulas internas e aspas escapadas',()=>{
 assert.deepEqual(parse('Conta,Descrição,Valor\n1,"Receita, ""serviços""",100'),[['Conta','Descrição','Valor'],['1','Receita, "serviços"','100']]);
});
test('quebra de linha dentro de campo entre aspas',()=>{
 assert.deepEqual(parse('Conta;Descrição\r\n1;"Linha A\r\nLinha B"'),[['Conta','Descrição'],['1','Linha A\r\nLinha B']]);
});
test('rejeita aspas não fechadas',()=>{
 assert.throws(()=>parse('Conta;Descrição\n1;"Incompleta'),/CSV inválido/);
});
