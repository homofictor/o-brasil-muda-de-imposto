import test from 'node:test';
import assert from 'node:assert/strict';
import {conciliarRubricasRevisadas} from './mvp-conciliacao-rubricas.js';
const base = [
 ['BP','ativo',1060],['BP','passivo',640],['BP','patrimonio',420],
 ['DRE','receita_liquida',800],['DRE','custos',480],['DRE','despesas',160],
 ['BALANCETE','debitos',1700],['BALANCETE','creditos',1700]
].map(([demonstracao,grupo,valor],i)=>({exercicio:2026,demonstracao,grupo,valor,revisado:true,documentoRef:'docA',linhaOrigem:i+1}));
test('fecha BP e balancete fictícios sem transformar resultado em parecer',()=>{
 const r=conciliarRubricasRevisadas(base);
 assert.equal(r.exercicios[0].status,'fechamento_aritmetico');
 assert.equal(r.exercicios[0].resultadoDREIlustrativo,160);
 assert.equal(r.aptoParaParecer,false);assert.equal(r.aplicadoProjecao,false);
 assert.equal(JSON.stringify(r).includes('docA'),false);
});
test('divergência e ausência geram pendência, sem completar dados presumidos',()=>{
 const r=conciliarRubricasRevisadas(base.slice(0,7).map(x=>x.grupo==='ativo'?{...x,valor:1061}:x));
 assert.equal(r.exercicios[0].status,'pendente_revisao');
 assert.equal(r.exercicios[0].diferencaBP,1);
 assert.deepEqual(r.exercicios[0].ausentes,['BALANCETE:creditos']);
});
test('recusa origem repetida, rubrica sem revisão e valores não finitos',()=>{
 for(const extra of [{...base[0]}, {...base[0],linhaOrigem:20,revisado:false},
   {...base[0],linhaOrigem:20,valor:Infinity},
   {...base[0],linhaOrigem:20,grupo:'ncg'},
   {...base[0],linhaOrigem:20,documentoRef:'nome@exemplo.com'}])
  assert.throws(()=>conciliarRubricasRevisadas([...base,extra]));
});
test('permite mesma linha documental em exercícios diferentes e ordena anos',()=>{
 const dois=base.map(r=>({...r,exercicio:2027}));
 const r=conciliarRubricasRevisadas([...dois,...base]);
 assert.deepEqual(r.exercicios.map(x=>x.ano),[2026,2027]);
});
test('pacote vazio não é apresentado como conciliado',()=>{
 const r=conciliarRubricasRevisadas([]);
 assert.deepEqual(r.exercicios,[]);assert.equal(r.aptoParaParecer,false);
});
