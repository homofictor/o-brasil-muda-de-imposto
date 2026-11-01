import test from 'node:test';
import assert from 'node:assert/strict';
import {SETORES_MVP, premissasSinteticasMVP, prepararEntradaMVP, executarMVP} from './mvp-cenario.js';
const revisao = {dre:true, ponte:true, ncg:true};
test('oito setores com receitas conciliadas e IBS/CBS segregados',()=>{
 const r=prepararEntradaMVP(premissasSinteticasMVP(),revisao);
 assert.equal(SETORES_MVP.length,8);
 assert.equal(r.dadosFinanceiros.historico.receitaLiquida,800);
 assert.equal(r.dadosFinanceiros.atividades[0].aliquotasValidadas.ibs[2027],0.05);
 assert.equal(r.dadosFinanceiros.atividades[0].aliquotasValidadas.cbs[2027],0.03);
 assert.equal(r.dadosFinanceiros.variacaoNCG[2027],10);
});
test('não calcula sem três revisões explícitas',()=>{
 for(const campo of ['dre','ponte','ncg'])
  assert.throws(()=>prepararEntradaMVP(premissasSinteticasMVP(),{...revisao,[campo]:false}),/Confirme/);
});
test('rejeita campos faltantes e alíquotas inválidas',()=>{
 for(const campo of ['capex','juros','impostosResultado','amortizacoes']){
  const p=premissasSinteticasMVP();delete p[campo];
  assert.throws(()=>prepararEntradaMVP(p,revisao),new RegExp(campo));
 }
 const p=premissasSinteticasMVP();p.atividades[0].ibsPercentual=101;
 assert.throws(()=>prepararEntradaMVP(p,revisao),/100%/);
});
test('não apresenta resultado sem status de auditoria e veto de parecer',()=>{
 const p=premissasSinteticasMVP();
 const base={homologado:false,aptoParaParecer:false,statusAuditoriaNCG:'conciliada_documentalmente',
  projecoes:[{statusAuditoriaNCG:'conciliada_documentalmente'}]};
 assert.equal(executarMVP(p,revisao,()=>base).statusMVP,'simulacao_sintetica_nao_homologada');
 assert.throws(()=>executarMVP(p,revisao,()=>({...base,homologado:true})),/controles/);
 assert.throws(()=>executarMVP(p,revisao,()=>({...base,statusAuditoriaNCG:'nao_auditada'})),/controles/);
});
test('não admite documentos reais ou créditos presumidos na demonstração',()=>{
 const r=prepararEntradaMVP(premissasSinteticasMVP(),revisao);
 assert.deepEqual(r.dadosFinanceiros.eventosCredito,[]);
 assert.match(r.auditoriasNCG[2027].saldosBase.clientes.documentoId,/sintetico/);
});
