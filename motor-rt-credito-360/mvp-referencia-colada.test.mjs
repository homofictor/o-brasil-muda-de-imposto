import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretarReferenciaColada} from './mvp-referencia-colada.js';
const tabela = () => Array.from({length:8},(_,i)=>`${2026+i}\t${70+i*2}\t40\t${(70+i*2)/40}`).join('\n');
test('interpreta oito exercícios com referência conciliada sem alterar dados',()=>{
 const txt=tabela(); const r=interpretarReferenciaColada(txt);
 assert.equal(r.length,8); assert.deepEqual(r[0],{ano:2026,caixaOriginal:70,servicoDivida:40,icsdConferido:1.75});
 assert.equal(r[7].ano,2033); assert.equal(txt,tabela());
});
test('aceita vírgula decimal e cabeçalho conhecido',()=>{
 const t='ano\tcaixaOriginal\tservicoDivida\ticsdConferido\n'+tabela().replaceAll('.',',');
 assert.equal(interpretarReferenciaColada(t)[0].icsdConferido,1.75);
});
test('recusa ICSD inconsistente e impede mistura de referência sintética',()=>{
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t70\t40\t1.75','2026\t70\t40\t1.25')), /não concilia/);
 assert.throws(()=>interpretarReferenciaColada(tabela().split('\n').slice(0,7).join('\n')), /exatamente 8/);
});
test('recusa anos fora de ordem, fórmulas e milhar ambíguo',()=>{
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t','2027\t')), /exercício esperado/);
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t70\t','2026\t=SUM(A1:A3)\t')), /sem separador/);
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t70\t','2026\t1.000,00\t')), /sem separador/);
});
test('sem serviço da dívida exige ICSD vazio',()=>{
 const t=tabela().replace('2026\t70\t40\t1.75','2026\t70\t0\t');
 assert.equal(interpretarReferenciaColada(t)[0].icsdConferido,null);
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t70\t40\t1.75','2026\t70\t0\t1.75')), /ICSD vazio/);
});
test('rejeita valores não finitos, negativos no serviço e dados extras',()=>{
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t70\t40','2026\t70\t-40')), /negativo/);
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t70\t40','2026\tInfinity\t40')), /sem separador/);
 assert.throws(()=>interpretarReferenciaColada(tabela().replace('2026\t70\t40','2026\t70\t40\t999')), /4 colunas/);
});
