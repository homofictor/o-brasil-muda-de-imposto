import test from 'node:test';
import assert from 'node:assert/strict';
import {conciliarRubricasAnuaisComCompetencia} from './mvp-competencia-rubricas.js';
const itens = [
  ['BP','ativo',1060],['BP','passivo',640],['BP','patrimonio',420],
  ['DRE','receita_liquida',800],['DRE','custos',480],['DRE','despesas',160],
  ['BALANCETE','debitos',1700],['BALANCETE','creditos',1700]
].map(([demonstracao,grupo,valor],i)=>({exercicio:2026,demonstracao,grupo,valor,
  revisado:true,documentoRef:'opacoA',linhaOrigem:i+1,
  periodo:demonstracao==='DRE'?{inicio:'2026-01-01',fim:'2026-12-31'}:{dataBase:'2026-12-31'}}));
test('concilia exercício anual fictício sem liberar parecer ou projeção',()=>{
 const r=conciliarRubricasAnuaisComCompetencia(itens);
 assert.equal(r.exercicios[0].status,'fechamento_aritmetico');
 assert.equal(r.exercicios[0].resultadoDREIlustrativo,160);
 assert.equal(r.aptoParaParecer,false);
 assert.equal(r.aplicadoProjecao,false);
 assert.equal(r.tipoCompetencia,'exercicios_anuais_completos');
});
test('rejeita DRE parcial sem anualizar receitas ou margens',()=>{
 const x=itens.map(r=>r.demonstracao==='DRE'?{...r,periodo:{inicio:'2026-01-01',fim:'2026-09-30'}}:r);
 assert.throws(()=>conciliarRubricasAnuaisComCompetencia(x),/DRE parcial/);
});
test('rejeita balancete recente misturado a BP anual',()=>{
 const x=itens.map(r=>r.demonstracao==='BALANCETE'?{...r,periodo:{dataBase:'2026-10-31'}}:r);
 assert.throws(()=>conciliarRubricasAnuaisComCompetencia(x),/balancete intermediário/);
});
test('rejeita competência ausente, data impossível e exercício trocado',()=>{
 for(const periodo of [undefined,{dataBase:'2026-02-30'},{dataBase:'2025-12-31'}])
  assert.throws(()=>conciliarRubricasAnuaisComCompetencia([{...itens[0],periodo}]));
});
test('rejeita rubrica não revisada e origem duplicada',()=>{
 assert.throws(()=>conciliarRubricasAnuaisComCompetencia(itens.map((r,i)=>i===0?{...r,revisado:false}:r)));
 assert.throws(()=>conciliarRubricasAnuaisComCompetencia([...itens,{...itens[0]}]));
});
test('não transporta metadados pessoais, nome de arquivo ou referências opacas à saída',()=>{
 const x=itens.map(r=>({...r,cnpj:'dados-proibidos',nomeArquivo:'dados-proibidos.pdf',textoOriginal:'dados-proibidos'}));
 const resultado=JSON.stringify(conciliarRubricasAnuaisComCompetencia(x));
 assert.equal(resultado.includes('dados-proibidos'),false);
 assert.equal(resultado.includes('opacoA'),false);
});
test('não presume valor zero quando faltar rubrica obrigatória',()=>{
 const r=conciliarRubricasAnuaisComCompetencia(itens.filter(x=>x.grupo!=='despesas'));
 assert.equal(r.exercicios[0].resultadoDREIlustrativo,null);
 assert.equal(r.exercicios[0].status,'pendente_revisao');
});
