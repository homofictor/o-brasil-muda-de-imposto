import test from 'node:test';
import assert from 'node:assert/strict';
import {conciliarLotesContabeisAprovados} from './mvp-adaptador-revisoes.js';

const grupos = {
  BP: [['ativo',100],['passivo',60],['patrimonio',40]],
  DRE: [['receita_liquida',90],['custos',50],['despesas',30]],
  BALANCETE: [['debitos',120],['creditos',120]]
};
function lote(tipo, ano=2025) {
  const entries=grupos[tipo];
  return {documentoRef:'ref_'+tipo+'_'+ano,
    periodo:tipo==='DRE'?{inicio:ano+'-01-01',fim:ano+'-12-31'}:{dataBase:ano+'-12-31'},
    revisao:{documentoId:'nao_deve_sair',exercicio:ano,demonstracao:tipo,status:'revisado',
      aptoParaProjecao:true,erros:[],aprovacao:{analistaId:'nao_deve_sair'},
      registros:entries.map(([grupo,valor])=>({conta:'conta_'+grupo,valor,unidade:'BRL',revisadoPorAnalista:true}))},
    classificacoes:entries.map(([grupo],indice)=>({indice,grupo,linhaOrigem:indice+1}))};
}
const base=()=>[lote('BP'),lote('DRE'),lote('BALANCETE')];
test('concilia três demonstrações aprovadas sem vazar identificadores nem aplicar projeções',()=>{
  const resultado=conciliarLotesContabeisAprovados(base());
  assert.equal(resultado.exercicios[0].status,'fechamento_aritmetico');
  assert.equal(resultado.exercicios[0].diferencaBP,0);
  assert.equal(resultado.exercicios[0].diferencaBalancete,0);
  assert.equal(resultado.exercicios[0].resultadoDREIlustrativo,10);
  assert.equal(resultado.aptoParaParecer,false);
  assert.equal(resultado.aplicadoProjecao,false);
  assert.equal(JSON.stringify(resultado).includes('nao_deve_sair'),false);
});
test('rejeita revisão não aprovada ou registro sem revisão',()=>{
  const a=base();a[0].revisao.status='aguardando_revisao';
  assert.throws(()=>conciliarLotesContabeisAprovados(a));
  const b=base();b[0].revisao.registros[0].revisadoPorAnalista=false;
  assert.throws(()=>conciliarLotesContabeisAprovados(b));
});
test('rejeita mapeamento parcial, duplicado ou grupo incompatível',()=>{
  const a=base();a[0].classificacoes.pop();assert.throws(()=>conciliarLotesContabeisAprovados(a));
  const b=base();b[0].classificacoes[1].indice=0;assert.throws(()=>conciliarLotesContabeisAprovados(b));
  const c=base();c[0].classificacoes[0].grupo='receita_liquida';assert.throws(()=>conciliarLotesContabeisAprovados(c));
});
test('rejeita escala não confirmada e valores negativos ou infinitos',()=>{
  const a=base();a[0].revisao.registros[0].unidade='MIL_BRL';assert.throws(()=>conciliarLotesContabeisAprovados(a));
  const b=base();b[0].revisao.registros[0].valor=-100;assert.throws(()=>conciliarLotesContabeisAprovados(b));
  const c=base();c[0].revisao.registros[0].valor=Infinity;assert.throws(()=>conciliarLotesContabeisAprovados(c));
});
test('rejeita DRE parcial e balancete intermediário no fechamento anual',()=>{
  const a=base();a[1].periodo.inicio='2025-04-01';assert.throws(()=>conciliarLotesContabeisAprovados(a));
  const b=base();b[2].periodo.dataBase='2025-09-30';assert.throws(()=>conciliarLotesContabeisAprovados(b));
});
test('detecta divergência no BP sem apresentar conciliação fictícia',()=>{
  const a=base();a[0].revisao.registros[0].valor=101;
  const r=conciliarLotesContabeisAprovados(a).exercicios[0];
  assert.equal(r.status,'pendente_revisao');assert.equal(r.diferencaBP,1);
});
test('rejeita referência documental repetida e não usa texto de conta para classificar',()=>{
  const a=base();a[1].documentoRef=a[0].documentoRef;
  assert.throws(()=>conciliarLotesContabeisAprovados(a));
  const b=base();b[0].revisao.registros[0].conta='fornecedores';
  assert.equal(conciliarLotesContabeisAprovados(b).exercicios[0].status,'fechamento_aritmetico');
});
