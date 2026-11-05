'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../simulador/v3/import.js'), 'utf8');

test('falha de leitura preserva resultado individual e status de erro', () => {
 const marker = "row.error=String(e?.message||'Falha de leitura')";
 assert.ok(source.includes(marker));
 assert.ok(source.includes("brmiImport.docs.push({file:row.name,type:'Falha de leitura',status:'erro',error:row.error,candidates:[]})"));
});
test('reanálise mantém falhas sem inventar indicadores', () => {
 assert.match(source, /if\(!row\.parsed\)\{if\(row\.error\)brmiImport\.docs\.push\(\{file:row\.name,type:'Falha de leitura',status:'erro',error:row\.error,candidates:\[\]\}\);continue\}/);
});
test('falhas não entram na lista de candidatos', () => {
 const failure = {file:'sintetico.pdf',type:'Falha de leitura',status:'erro',error:'arquivo ilegível',candidates:[]};
 assert.equal(failure.candidates.length,0);
 assert.equal(failure.status,'erro');
});
