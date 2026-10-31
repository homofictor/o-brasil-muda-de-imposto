import test from "node:test";
import assert from "node:assert/strict";
import {integrarIBSCBSAoCredito} from "./integracao-ibs-cbs-credito.js";
import {mapearContas,conciliarExercicio} from "./conciliacao-contabil.js";

// Caso inteiramente sintético: taxas e créditos são hipóteses de teste,
// não regras legais por setor. Não representa DFC nem homologação de crédito.
const criarContas=(ano,valores)=>Object.entries(valores).map(([contaPadrao,valor],indiceOrigem)=>({
 contaPadrao,valor,indiceOrigem,exercicio:ano,demonstracao:
 ["ativo_total","passivo_exigivel","patrimonio_liquido"].includes(contaPadrao)?"balanco_patrimonial":"dre"
}));
const mapear=(linhas)=>mapearContas(linhas.map((l,i)=>({
 conta:l.contaPadrao,valor:l.valor,exercicio:l.exercicio,
 demonstracao:l.demonstracao,linhaOrigem:i+1
})),linhas.map((l,i)=>({contaPadrao:l.contaPadrao,indiceOrigem:i,fator:1,
 justificativa:"Classificação sintética explícita"})));
const atividades=[
 ["comercio",0.06,0.04],["industria",0.07,0.03],
 ["servicos",0.04,0.05],["construcao",0.03,0.04],
 ["saude",0.02,0.03],["transporte",0.05,0.04],
 ["agronegocio",0.01,0.02],["multissetorial",0.08,0.06]
].map(([id,ibs,cbs])=>({id,receitaBase:100,crescimento:0,
 aliquotasValidadas:{ibs:{2027:ibs},cbs:{2027:cbs}}}));
const eventosCredito=[
 {id:"insumo-industria",atividadeId:"industria",tributo:"ibs",ano:2027,
  valor:8,fundamento:"Hipótese documental sintética",validadoPorAnalista:true},
 {id:"insumo-agro",atividadeId:"agronegocio",tributo:"ibs",ano:2027,
  valor:4,fundamento:"Hipótese documental sintética",validadoPorAnalista:true},
 {id:"compra-comercio",atividadeId:"comercio",tributo:"cbs",ano:2027,
  valor:6,fundamento:"Hipótese documental sintética",validadoPorAnalista:true}
];
const perto=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`Esperado ${b}; recebido ${a}`);

test("concilia DRE e balanços sintéticos, NCG, contas IBS/CBS e ICSD por oito atividades",()=>{
 const base=mapear(criarContas(2026,{ativo_total:1000,passivo_exigivel:600,
  patrimonio_liquido:400,receita_liquida:800,custos:480,despesas_operacionais:160}));
 const projetado=mapear(criarContas(2027,{ativo_total:1060,passivo_exigivel:640,
  patrimonio_liquido:420}));
 assert.deepEqual(base.erros,[]);assert.deepEqual(projetado.erros,[]);
 assert.equal(conciliarExercicio(base.normalizadas).conciliado,true);
 assert.equal(conciliarExercicio(projetado.normalizadas).conciliado,true);
 const soma=(nome)=>base.normalizadas.filter(c=>c.contaPadrao===nome)
  .reduce((total,c)=>total+c.valor,0);
 const receita=soma("receita_liquida");
 const ebitda=receita-soma("custos")-soma("despesas_operacionais");
 perto(receita,800);perto(ebitda,160);
 // NCG operacional: clientes + estoques - fornecedores. Não inclui caixa nem dívida.
 const ncgBase=120+90-100,ncgProjetada=140+95-115;
 const variacaoNCG=ncgProjetada-ncgBase;
 perto(variacaoNCG,10);
 const r=integrarIBSCBSAoCredito({anoBase:2026,anos:1,
  historico:{exercicio:2026,receitaLiquida:receita,ebitda,
   ativoTotal:1000,patrimonioLiquido:400,revisadoPorAnalista:true},
  atividades,eventosCredito,aliquotaReferencia:0.1,
  tratamentoTributario:{referenciaRefletida:false,reformaRefletida:false,
   evidenciaContabil:"DRE sintética pré-tributos conciliada para teste",
   validadoPorAnalista:true},
  capex:{2027:20},variacaoNCG:{2027:variacaoNCG},
  impostosResultado:{2027:5},juros:{2027:15},amortizacoes:{2027:25}});
 const p=r.projecoes[0];
 assert.equal(p.atividades.length,8);
 perto(p.ibs.debito,36);perto(p.cbs.debito,31);
 perto(p.ibs.utilizado,12);perto(p.cbs.utilizado,6);
 perto(p.ibs.tributoPagar,24);perto(p.cbs.tributoPagar,25);
 perto(p.ibs.conciliacao,0);perto(p.cbs.conciliacao,0);
 perto(p.caixaAntesTributos,125);perto(p.tributoReferencia,80);
 perto(p.caixaReferencia,45);perto(p.caixaReforma,76);
 perto(p.servicoDivida,40);perto(p.icsdReferencia,1.125);
 perto(p.icsdReforma,1.9);perto(p.variacaoCaixa,31);
 assert.equal(p.auditoriaPonte.autorizadoParaProjecao,true);
 assert.equal(r.aptoParaParecer,false);
});

test("divergência de balanço impede conciliação contábil, sem simular aprovação",()=>{
 const divergente=mapear(criarContas(2027,{ativo_total:1060,
  passivo_exigivel:640,patrimonio_liquido:419}));
 const c=conciliarExercicio(divergente.normalizadas);
 perto(c.diferenca,1);
 assert.equal(c.conciliado,false);
 assert.equal(c.aptoParaProjecao,false);
 assert.equal(c.status,"aguardando_revisao");
});
