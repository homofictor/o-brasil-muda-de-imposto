import {projetarAtividadesIBSCBS} from "./atividades-ibs-cbs.js";
import {auditarPonteTributaria} from "./auditoria-ponte-tributaria.js";
import {calcularIndicadoresFinanceiros} from "./indicadores-financeiros.js";

/**
 * Ponte financeira preliminar para IBS/CBS segregados por atividade.
 * Somente projeta caixa e ICSD quando o analista documenta EBITDA anterior
 * aos tributos sobre consumo em ambos os cenários. Não altera o EBITDA.
 * Não substitui FCADS contratual nem apuração tributária homologada.
 */
export function integrarIBSCBSAoCredito({
 historico,anoBase,anos=5,atividades,eventosCredito=[],aliquotaReferencia,
 saldosIniciais={ibs:0,cbs:0},ressarcimentosRecebidos={ibs:{},cbs:{}},
 ajustesNegativos={ibs:{},cbs:{}},capex={},variacaoNCG={},
 impostosResultado={},juros={},amortizacoes={},tratamentoTributario=null
}){
 if(historico?.revisadoPorAnalista!==true||historico.exercicio!==anoBase)
  throw new Error("Histórico contábil não revisado ou exercício divergente");
 if(!Number.isFinite(historico.receitaLiquida)||historico.receitaLiquida<=0||
    !Number.isFinite(historico.ebitda)||!Number.isFinite(aliquotaReferencia)||
    aliquotaReferencia<0||aliquotaReferencia>1)
  throw new Error("Base financeira ou alíquota de referência inválida");
 const somaReceitas=atividades?.reduce((s,a)=>s+a.receitaBase,0);
 if(!Number.isFinite(somaReceitas)||
    Math.abs(somaReceitas-historico.receitaLiquida)>0.01)
  throw new Error("Receitas por atividade não conciliam com a DRE");
 const tributario=projetarAtividadesIBSCBS({anoBase,anos,atividades,eventosCredito,
  saldosIniciais,ressarcimentosRecebidos,ajustesNegativos});
 const anual=(mapa,ano,nome)=>{
  const valor=mapa?.[ano]??0;
  if(!Number.isFinite(valor)||valor<0)throw new Error("Valor inválido: "+nome+" "+ano);
  return valor;
 };
 const margem=historico.ebitda/historico.receitaLiquida;
 const projecoes=tributario.projecoes.map(t=>{
  const ano=t.ano,ebitdaReferencia=t.receitaTotal*margem;
  const tributoReferencia=t.receitaTotal*aliquotaReferencia;
  const caixaAntesTributos=ebitdaReferencia-anual(capex,ano,"capex")-
   anual(variacaoNCG,ano,"variacaoNCG")-
   anual(impostosResultado,ano,"impostosResultado");
  const auditoriaPonte=auditarPonteTributaria({
   receitaBase:t.receitaTotal,ebitdaBase:ebitdaReferencia,
   tributoReferencia,tributoReforma:t.tributoPagarTotal,
   impostoReferenciaJaRefletidoNoEbitda:tratamentoTributario?.referenciaRefletida,
   impostoReformaJaRefletidoNoEbitda:tratamentoTributario?.reformaRefletida,
   evidenciaContabil:tratamentoTributario?.evidenciaContabil,
   validadoPorAnalista:tratamentoTributario?.validadoPorAnalista
  });
  const conciliado=auditoriaPonte.autorizadoParaProjecao&&
   auditoriaPonte.ajusteTributarioCaixa!==null;
  // Tributos são deduzidos uma única vez, pois o EBITDA foi documentado
  // antes dos tributos sobre consumo. Ressarcimentos são entradas de caixa.
  const caixaReferencia=conciliado?caixaAntesTributos-tributoReferencia:null;
  const caixaReforma=conciliado?caixaAntesTributos-t.tributoPagarTotal+
   t.ressarcimentoRecebidoTotal:null;
  const servicoDivida=anual(juros,ano,"juros")+
   anual(amortizacoes,ano,"amortizacoes");
  return {...t,ebitdaReferencia,tributoReferencia,caixaAntesTributos,
   caixaReferencia,caixaReforma,servicoDivida,auditoriaPonte,
   icsdReferencia:caixaReferencia!==null&&servicoDivida>0?
    caixaReferencia/servicoDivida:null,
   icsdReforma:caixaReforma!==null&&servicoDivida>0?
    caixaReforma/servicoDivida:null,
   variacaoCaixa:conciliado?caixaReforma-caixaReferencia:null};
 });
 return {indicadoresHistoricos:calcularIndicadoresFinanceiros(historico),
  projecoes,homologado:false,aptoParaParecer:false,
  ressalvas:["IBS e CBS segregados, sem compensação cruzada entre tributos.",
   "Caixa e ICSD indisponíveis sem ponte contábil pré-tributos revisada.",
   "Alíquotas, créditos e ressarcimentos dependem de evidência legal e documental.",
   "Fluxo simplificado não substitui FCADS contratual nem conciliação completa."]};
}
