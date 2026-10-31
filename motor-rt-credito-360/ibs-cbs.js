import {apurarCreditosAnuais} from "./creditos.js";

/**
 * Apuração financeira separada de IBS e CBS.
 * Créditos não podem ser compensados entre tributos neste modelo.
 * Não substitui a escrituração ou a validação das regras legais.
 */
export function apurarIBSeCBS({
 anoInicial,anos=5,ibs={},cbs={}
}){
 const calcular=(nome,dados)=>{
  if(!dados||typeof dados!=="object")throw new Error("Dados ausentes: "+nome);
  return apurarCreditosAnuais({
   anoInicial,anos,saldoInicial:dados.saldoInicial??0,
   gerados:dados.gerados??{},debitos:dados.debitos??{},
   ressarcidos:dados.ressarcidos??{},ajustesNegativos:dados.ajustesNegativos??{}
  });
 };
 const serieIBS=calcular("IBS",ibs),serieCBS=calcular("CBS",cbs);
 const anosConsolidados=serieIBS.map((linha,i)=>{
  const outra=serieCBS[i];
  const totais={
   debitoTotal:linha.debito+outra.debito,
   creditoGeradoTotal:linha.gerado+outra.gerado,
   creditoUtilizadoTotal:linha.utilizado+outra.utilizado,
   tributoPagarTotal:linha.tributoPagar+outra.tributoPagar,
   ressarcimentoRecebidoTotal:linha.ressarcido+outra.ressarcido
  };
  // Cada conta pode ser finita, mas a soma IBS + CBS pode exceder o limite.
  for(const [nome,valor] of Object.entries(totais))
   if(!Number.isFinite(valor))
    throw new Error("Consolidação IBS/CBS não finita: "+nome+" "+linha.ano);
  return {ano:linha.ano,ibs:linha,cbs:outra,...totais,
   saldoCreditoIBS:linha.saldoFinal,saldoCreditoCBS:outra.saldoFinal};
 });
 return {anos:anosConsolidados,
  alertas:["Sem compensação cruzada entre IBS e CBS.",
   "Créditos, alíquotas e ressarcimentos dependem de validação legal e documental.",
   "Não modela restrições por tipo de crédito, prazo ou destinação."],
  homologado:false};
}
