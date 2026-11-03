import test from 'node:test';
import assert from 'node:assert/strict';
import {verificarIntegridadeRelatorioFicticio as verificar} from './mvp-integridade-relatorio-demo.js';

function exemplo() {
  const anos = Array.from({length:8}, (_,i)=>2026+i);
  const cenarios = ['favoravel','central','adverso'].map((id,k)=>{
    const exercicios = anos.map((ano,i)=>{
      const caixaOriginal=70+i, servicoDivida=40, deltaCaixa=-(k+1)*(i+1);
      const caixaAjustado=caixaOriginal+deltaCaixa;
      return {ano, caixaOriginal, servicoDivida, deltaCaixa, caixaAjustado,
        ebitdaIncremental:-1, ncgIncremental:1, ibsIncremental:-1, cbsIncremental:-1,
        icsdOriginal:caixaOriginal/servicoDivida, icsdAjustado:caixaAjustado/servicoDivida};
    });
    return {id,exercicios,resumo:{menorICSD:Math.min(...exercicios.map(x=>x.icsdAjustado)),
      deltaCaixaAcumulado:exercicios.reduce((s,x)=>s+x.deltaCaixa,0),
      anosInsuficiencia:exercicios.filter(x=>x.caixaAjustado<x.servicoDivida).map(x=>x.ano)}};
  });
  return [{status:'exemplo_sintetico_nao_homologado',exercicios:anos,cenarios,limitacoes:['Sem homologação']},
    {status:'memoria_contabil_sintetica',periodo:2026,indicadores:Array.from({length:5},(_,i)=>({valor:i}))}];
}
test('aceita somente relatório fictício integral com 24 linhas e três cenários',()=>{
  const [r,m]=exemplo();
  assert.deepEqual(verificar(r,m),{cenarios:3,exerciciosPorCenario:8,linhas:24,origem:'exemplo_ficticio',aptoParaParecer:false});
});
test('recusa ausência de um exercício em qualquer cenário',()=>{
  const [r,m]=exemplo();r.cenarios[1].exercicios.pop();assert.throws(()=>verificar(r,m),/incompleto/);
});
test('recusa cenário adicional ou nome não previsto',()=>{
  const [r,m]=exemplo();r.cenarios[0].id='setorial';assert.throws(()=>verificar(r,m));
});
test('recusa mudança da referência original entre cenários',()=>{
  const [r,m]=exemplo();r.cenarios[2].exercicios[0].caixaOriginal+=10;assert.throws(()=>verificar(r,m));
});
test('recusa ICSD incoerente com caixa e dívida',()=>{
  const [r,m]=exemplo();r.cenarios[1].exercicios[3].icsdAjustado=99;assert.throws(()=>verificar(r,m));
});
test('recusa total acumulado e anos de insuficiência incorretos',()=>{
  const [r,m]=exemplo();r.cenarios[0].resumo.deltaCaixaAcumulado=0;assert.throws(()=>verificar(r,m));
  const [r2,m2]=exemplo();r2.cenarios[2].resumo.anosInsuficiencia=[2026];assert.throws(()=>verificar(r2,m2));
});
test('recusa valores não finitos e serviço da dívida negativo',()=>{
  const [r,m]=exemplo();r.cenarios[1].exercicios[4].caixaAjustado=Infinity;assert.throws(()=>verificar(r,m));
  const [r2,m2]=exemplo();r2.cenarios[1].exercicios[4].servicoDivida=-40;assert.throws(()=>verificar(r2,m2));
});
test('recusa memória fictícia incompleta ou período divergente',()=>{
  const [r,m]=exemplo();m.periodo=2025;assert.throws(()=>verificar(r,m));
});
test('não aceita dados com status de parecer ou relatório real',()=>{
  const [r,m]=exemplo();r.status='parecer_aprovado';assert.throws(()=>verificar(r,m));
});
