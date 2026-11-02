import test from 'node:test';
import assert from 'node:assert/strict';
import {conciliarBalanceteIntermediario} from './mvp-balancete-intermediario.js';

const base = [
  {exercicio:2026, demonstracao:'BALANCETE', grupo:'debitos', valor:1700,
    revisado:true, documentoRef:'ref1', linhaOrigem:1, periodo:{dataBase:'2026-09-30'}},
  {exercicio:2026, demonstracao:'BALANCETE', grupo:'creditos', valor:1700,
    revisado:true, documentoRef:'ref1', linhaOrigem:2, periodo:{dataBase:'2026-09-30'}}
];

test('fecha balancete parcial sem liberar projeção ou parecer', () => {
  const r = conciliarBalanceteIntermediario(base);
  assert.equal(r.status,'fechamento_aritmetico_intermediario');
  assert.equal(r.dataBase,'2026-09-30');
  assert.equal(r.diferencaBalancete,0);
  assert.deepEqual(r.ausentes,[]);
  assert.equal(r.aptoParaParecer,false);
  assert.equal(r.aplicadoProjecao,false);
});
test('divergência permanece pendente sem limiar de materialidade presumido', () => {
  const r = conciliarBalanceteIntermediario(base.map((x,i)=>i===1?{...x,valor:1690}:x));
  assert.equal(r.status,'pendente_revisao');
  assert.equal(r.diferencaBalancete,10);
  assert.equal(r.materialidade.valorAbsoluto,10);
});
test('ausência de créditos não se converte em saldo zero', () => {
  const r = conciliarBalanceteIntermediario(base.slice(0,1));
  assert.equal(r.status,'pendente_revisao');
  assert.equal(r.diferencaBalancete,null);
  assert.deepEqual(r.ausentes,['BALANCETE:creditos']);
});
test('rejeita datas-base misturadas e exercício divergente', () => {
  for(const dataBase of ['2026-10-31','2025-09-30','2026-02-30','2026-12-31'])
    assert.throws(()=>conciliarBalanceteIntermediario([base[0],{...base[1],periodo:{dataBase}}]));
});
test('rejeita documentos não revisados e origem repetida', () => {
  assert.throws(()=>conciliarBalanceteIntermediario([{...base[0],revisado:false},base[1]]));
  assert.throws(()=>conciliarBalanceteIntermediario([base[0],{...base[1],linhaOrigem:1}]));
});
test('não propaga identificadores ou metadados privados', () => {
  const r = conciliarBalanceteIntermediario(base.map(x=>({...x,cnpj:'proibido',nomeArquivo:'proibido.pdf'})));
  assert.equal(JSON.stringify(r).includes('proibido'),false);
  assert.equal(JSON.stringify(r).includes('ref1'),false);
});
test('rejeita lotes vazios, dados não numéricos e demonstração indevida', () => {
  assert.throws(()=>conciliarBalanceteIntermediario([]));
  assert.throws(()=>conciliarBalanceteIntermediario([{...base[0],valor:Infinity}]));
  assert.throws(()=>conciliarBalanceteIntermediario([{...base[0],demonstracao:'DRE'}]));
});
