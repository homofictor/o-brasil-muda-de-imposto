const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../simulador/v3/import.js'),'utf8');
const start=source.indexOf('function csvRows('),end=source.indexOf('\nfunction rowsText(',start);
assert.ok(start>=0&&end>start,'Leitor csvRows deve existir');
const csvRows=vm.runInNewContext(source.slice(start,end)+';csvRows');
const cases=[
 ['BOM e ponto e vírgula entre aspas','\uFEFFconta;valor\n"Receita; operacional";100',[['conta','valor'],['Receita; operacional','100']]],
 ['aspas escapadas','conta;valor\n"Receita ""líquida""";100',[['conta','valor'],['Receita "líquida"','100']]],
];
for(const [name,input,expected] of cases){assert.deepEqual(JSON.parse(JSON.stringify(csvRows(input))),expected,name)}
assert.throws(()=>csvRows('conta;valor\n"Receita;100'),/não foi fechado/);
console.log('3 testes CSV aprovados');
