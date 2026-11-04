'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Valida o leitor compartilhado real com balancete sintético, sem dados de clientes.
const source=fs.readFileSync(path.resolve(__dirname,'../simulador/v3/import.js'),'utf8');
const start=source.indexOf('function csvRows(');
assert.ok(start>=0,'csvRows deve existir no importador v3.2');
const end=source.indexOf('\nfunction ',start+1);
const context=vm.createContext({});
vm.runInContext(source.slice(start,end<0?undefined:end),context,{timeout:1000});
const parse=input=>JSON.parse(JSON.stringify(context.csvRows(input)));

test('preserva quatro colunas e saldos zero em balancete com separador ;',()=>{
 const csv='Conta;Descrição;Débito;Crédito\r\n1;Caixa;0,00;1.000,00\r\n2;Clientes;500,00;\r\n3;Fornecedores;;0,00\r\n';
 const rows=parse(csv);
 assert.equal(rows.length,4);
 assert.ok(rows.every(row=>row.length===4),'nenhuma coluna deve ser deslocada');
 assert.deepEqual(rows[1],['1','Caixa','0,00','1.000,00']);
 assert.deepEqual(rows[2],['2','Clientes','500,00','']);
 assert.deepEqual(rows[3],['3','Fornecedores','','0,00']);
});
test('não separa descrição de conta com ponto e vírgula entre aspas',()=>{
 const rows=parse('Conta;Descrição;Saldo\n1;"Receitas; serviços";123,45');
 assert.deepEqual(rows[1],['1','Receitas; serviços','123,45']);
});
test('rejeita balancete truncado com descrição entre aspas aberta',()=>{
 assert.throws(()=>parse('Conta;Descrição;Saldo\n1;"Conta incompleta;100'),/CSV inválido/);
});
