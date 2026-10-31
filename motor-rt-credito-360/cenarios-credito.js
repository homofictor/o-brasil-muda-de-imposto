import {calcularIndicadoresFinanceiros} from "./indicadores-financeiros.js";
import {apurarCreditosAnuais} from "./creditos.js";

/**
 * Ponte entre demonstrações revisadas e cenários de crédito.
 * EBITDA informado é o EBITDA contábil histórico; não recalcula EBITDA
 * por diferença de tributos, evitando dupla contagem e falsa precisão.
 * O impacto tributário é tratado como ajuste de caixa isolado, antes
 * de eventual repasse a preços, mudanças de custos e regime de créditos.
 */
export function compararCenariosCredito({
 historico,anoBase,anos=5,crescimento=0,aliquotaReferencia,
 aliquotasReforma={},creditosGerados={},saldoCreditoInicial=0,
 ressarcimentosRecebidos={},ajustesNegativos={},
 capex={},variacaoNCG={},impostosResultado={},juros={},amortizacoes={}
}){
 if(!historico||historico.revisadoPorAnalista!==true)
  throw new Error("Histórico contábil não aprovado pelo analista");
 const base=calcularIndicadoresFinanceiros(historico);
 if(historico.exercicio!==anoBase)throw new Error("Ano-base divergente");
 if(!Number.isFinite(historico.receitaLiquida)||historico.receitaLiquida<0||
    !Number.isFinite(historico.ebitda)||!Number.isFinite(aliquotaReferencia)||
    aliquotaReferencia<0||aliquotaReferencia>1||!Number.isFinite(crescimento)||
    crescimento<=-1||!Number.isInteger(anos)||anos<1||anos>10)
  throw new Error("Premissas financeiras inválidas");
 const anual=(obj,ano,nome)=>{
  const n=obj[ano]??0;
  if(!Number.isFinite(n)||n<0)throw new Error("Valor inválido: "+nome+" "+ano);
  return n;
 };
 const debitos={};const receitas={};
 for(let i=1;i<=anos;i++){
  const ano=anoBase+i;
  const taxa=aliquotasReforma[ano];
  if(!Number.isFinite(taxa)||taxa<0||taxa>1)throw new Error("Alíquota não validada: "+ano);
  receitas[ano]=historico.receitaLiquida*Math.pow(1+crescimento,i);
  debitos[ano]=receitas[ano]*taxa;
 }
 const contaCreditos=apurarCreditosAnuais({
  anoInicial:anoBase+1,anos,saldoInicial:saldoCreditoInicial,
  gerados:creditosGerados,debitos,ressarcidos:ressarcimentosRecebidos,
  ajustesNegativos
 });
 const margem=historico.receitaLiquida>0?historico.ebitda/historico.receitaLiquida:0;
 const projecoes=contaCreditos.map(c=>{
  const ano=c.ano,receita=receitas[ano],ebitdaBase=receita*margem;
  const tributoAtual=receita*aliquotaReferencia;
  const diferencaTributo=c.tributoPagar-tributoAtual;
  const caixaOperacionalReferencia=ebitdaBase-
   anual(impostosResultado,ano,"impostosResultado")-
   anual(variacaoNCG,ano,"variacaoNCG");
  const caixaDisponivelReferencia=caixaOperacionalReferencia-anual(capex,ano,"capex");
  const caixaDisponivelReforma=caixaDisponivelReferencia-diferencaTributo+c.ressarcido;
  const servicoDivida=anual(juros,ano,"juros")+anual(amortizacoes,ano,"amortizacoes");
  return {ano,receita,ebitdaBase,tributoAtual,tributoReformaBruto:c.debito,
   creditoGerado:c.gerado,creditoUtilizado:c.utilizado,
   creditoSaldoFinal:c.saldoFinal,tributoReformaPago:c.tributoPagar,
   ressarcimentoRecebido:c.ressarcido,diferencaTributo,
   caixaDisponivelReferencia,caixaDisponivelReforma,servicoDivida,
   icsdReferencia:servicoDivida>0?caixaDisponivelReferencia/servicoDivida:null,
   icsdReforma:servicoDivida>0?caixaDisponivelReforma/servicoDivida:null,
   variacaoCaixa:caixaDisponivelReforma-caixaDisponivelReferencia};
 });
 return {anoBase,indicadoresBase:base,projecoes,contaCreditos,
  metodologia:"Cenário de caixa simplificado; tributos tratados como variação incremental.",
  limitacoes:["Alíquotas e créditos precisam de validação legal por operação.",
   "Não modela repasse a preços, impostos indiretos embutidos nos custos, nem alteração de demanda.",
   "Não distingue IBS e CBS nem prazos de ressarcimento.",
   "EBITDA projetado não incorpora efeitos econômicos da reforma.",
   "ICSD ilustrativo, não substitui FCADS contratual."],
  aprovadoParaParecer:false};
}
