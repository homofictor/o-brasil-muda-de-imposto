import {auditarPonteTributaria} from "./auditoria-ponte-tributaria.js";
import {projetarAtividadesRT} from "./atividades-rt.js";
import {calcularIndicadoresFinanceiros} from "./indicadores-financeiros.js";

/**
 * Integra receitas segmentadas e créditos recorrentes ao fluxo de caixa
 * para serviço da dívida. Não altera EBITDA por uma diferença tributária
 * sem comprovar o tratamento contábil e o repasse econômico.
 */
export function integrarAtividadesCredito({
 historico,anoBase,anos=5,atividades,eventosCredito,
 aliquotaReferencia,ressarcimentosRecebidos={},saldoCreditoInicial=0,
 ajustesNegativos={},capex={},variacaoNCG={},impostosResultado={},
 juros={},amortizacoes={},tratamentoTributario=null
}){
 if(historico?.revisadoPorAnalista!==true||historico.exercicio!==anoBase)
  throw new Error("Histórico contábil não revisado ou exercício divergente");
 if(!Number.isFinite(historico.receitaLiquida)||historico.receitaLiquida<=0||
    !Number.isFinite(historico.ebitda)||!Number.isFinite(aliquotaReferencia)||
    aliquotaReferencia<0||aliquotaReferencia>1)
  throw new Error("Base financeira ou alíquota de referência inválida");
 const somaReceitas=atividades?.reduce((s,a)=>s+a.receitaBase,0);
 if(!Number.isFinite(somaReceitas)||Math.abs(somaReceitas-historico.receitaLiquida)>0.01)
  throw new Error("Receitas por atividade não conciliam com a DRE");
 const tributario=projetarAtividadesRT({
  anoBase,anos,atividades,eventosCredito,saldoInicial:saldoCreditoInicial,
  ressarcimentosRecebidos,ajustesNegativos
 });
 const anual=(mapa,ano,nome)=>{
  const n=mapa[ano]??0;
  if(!Number.isFinite(n)||n<0)throw new Error("Valor inválido: "+nome+" "+ano);
  return n;
 };
 const margem=historico.ebitda/historico.receitaLiquida;
 const projecoes=tributario.projecoes.map(t=>{
  const ano=t.ano,receita=t.receitaTotal,ebitdaReferencia=receita*margem;
  const tributoReferencia=receita*aliquotaReferencia;
  const deltaTributo=t.tributoPagar-tributoReferencia;
  const caixaReferencia=ebitdaReferencia-
   anual(capex,ano,"capex")-anual(variacaoNCG,ano,"variacaoNCG")-
   anual(impostosResultado,ano,"impostosResultado");
  const auditoria=auditarPonteTributaria({
   receitaBase:receita,ebitdaBase:ebitdaReferencia,
   tributoReferencia,tributoReforma:t.tributoPagar,
   impostoReferenciaJaRefletidoNoEbitda:tratamentoTributario?.referenciaRefletida,
   impostoReformaJaRefletidoNoEbitda:tratamentoTributario?.reformaRefletida,
   evidenciaContabil:tratamentoTributario?.evidenciaContabil,
   validadoPorAnalista:tratamentoTributario?.validadoPorAnalista
  });
  const caixaReforma=auditoria.autorizadoParaProjecao &&
   auditoria.ajusteTributarioCaixa!==null
   ?caixaReferencia+auditoria.ajusteTributarioCaixa+t.ressarcido:null;
  const servicoDivida=anual(juros,ano,"juros")+anual(amortizacoes,ano,"amortizacoes");
  return {...t,ebitdaReferencia,tributoReferencia,deltaTributo,
   caixaReferencia,caixaReforma,servicoDivida,auditoriaPonte:auditoria,
   icsdReferencia:servicoDivida>0?caixaReferencia/servicoDivida:null,
   icsdReforma:caixaReforma!==null&&servicoDivida>0?caixaReforma/servicoDivida:null,
   variacaoCaixa:caixaReforma===null?null:caixaReforma-caixaReferencia};
 });
 return {indicadoresHistoricos:calcularIndicadoresFinanceiros(historico),
  projecoes,aptoParaParecer:false,
  ressalvas:["Alíquotas por atividade e créditos dependem de validação jurídica.",
   "Projeção financeira simplificada; ICSD não substitui FCADS contratual.",
   "Não há segregação entre IBS e CBS, nem modelagem de repasse a preços.",
   "Sem ponte tributária auditada, caixa e ICSD da reforma ficam indisponíveis.",
   "A conciliação de receita não substitui a auditoria de demonstrações."]};
}
