import {apurarCreditosAnuais} from "./creditos.js";

/**
 * Projeção por atividade econômica. Cada segmento deve ter alíquota efetiva
 * anual validada externamente. Créditos são associados a eventos documentados,
 * não a uma redução fixa da receita. Modelo ilustrativo, sem apuração legal.
 */
export function projetarAtividadesRT({
 anoBase,anos=5,atividades=[],eventosCredito=[],saldoInicial=0,
 ressarcimentosRecebidos={},ajustesNegativos={}
}){
 if(!Number.isInteger(anoBase)||!Number.isInteger(anos)||anos<1||anos>10)
  throw new Error("Período inválido");
 if(!Array.isArray(atividades)||!atividades.length||!Array.isArray(eventosCredito))
  throw new Error("Atividades ou créditos inválidos");
 const debitos={},gerados={},receitas={},detalhes={};
 for(let i=1;i<=anos;i++){
  const ano=anoBase+i;
  debitos[ano]=0;gerados[ano]=0;receitas[ano]=0;detalhes[ano]=[];
  for(const a of atividades){
   if(typeof a.id!=="string"||!a.id||!Number.isFinite(a.receitaBase)||
     a.receitaBase<0||!Number.isFinite(a.crescimento)||a.crescimento<=-1)
    throw new Error("Atividade inválida");
   const aliquota=a.aliquotasValidadas?.[ano];
   if(!Number.isFinite(aliquota)||aliquota<0||aliquota>1)
    throw new Error("Alíquota não validada para "+a.id+" em "+ano);
   const receita=a.receitaBase*Math.pow(1+a.crescimento,i);
   const debito=receita*aliquota;
   receitas[ano]+=receita;debitos[ano]+=debito;
   detalhes[ano].push({atividadeId:a.id,descricao:a.descricao??a.id,
    receita,aliquota,debito});
  }
 }
 const ids=new Set(atividades.map(a=>a.id));
 if(ids.size!==atividades.length)throw new Error("Atividades duplicadas");
 for(const e of eventosCredito){
  if(!ids.has(e.atividadeId))throw new Error("Crédito vinculado a atividade desconhecida");
  if(!Number.isInteger(e.ano)||e.ano<=anoBase||e.ano>anoBase+anos||
    !Number.isFinite(e.valor)||e.valor<0||
    typeof e.fundamento!=="string"||!e.fundamento.trim()||
    e.validadoPorAnalista!==true)
   throw new Error("Evento de crédito não validado");
  gerados[e.ano]+=e.valor;
 }
 const conta=apurarCreditosAnuais({anoInicial:anoBase+1,anos,saldoInicial,
  gerados,debitos,ressarcidos:ressarcimentosRecebidos,ajustesNegativos});
 return {projecoes:conta.map(c=>({
  ...c,receitaTotal:receitas[c.ano],atividades:detalhes[c.ano]
 })),eventosCredito:eventosCredito.map(e=>({...e})),
  aptoParaParecer:false,
  alertas:["Premissas tributárias por atividade precisam de homologação legal.",
   "Créditos agregados sem segregação IBS/CBS; não representa apuração fiscal.",
   "Não presume crédito automático sobre qualquer compra ou venda de veículo."]};
}
