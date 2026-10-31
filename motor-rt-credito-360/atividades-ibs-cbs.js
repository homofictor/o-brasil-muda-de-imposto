import {apurarIBSeCBS} from "./ibs-cbs.js";

/**
 * Projeção tributária segmentada com contas independentes IBS/CBS.
 * Valores de crédito são hipóteses documentadas, não direitos presumidos.
 * Não utilizar sem revisão legal e conciliação contábil.
 */
export function projetarAtividadesIBSCBS({
 anoBase,anos=5,atividades,eventosCredito=[],
 saldosIniciais={ibs:0,cbs:0},
 ressarcimentosRecebidos={ibs:{},cbs:{}},
 ajustesNegativos={ibs:{},cbs:{}}
}){
 if(!Number.isInteger(anoBase)||!Number.isInteger(anos)||anos<1||anos>10||
    !Array.isArray(atividades)||atividades.length===0||
    !Array.isArray(eventosCredito))throw new Error("Entradas inválidas");
 const ids=new Set();
 for(const a of atividades){
  if(typeof a.id!=="string"||!a.id||ids.has(a.id)||
     !Number.isFinite(a.receitaBase)||a.receitaBase<0||
     !Number.isFinite(a.crescimento)||a.crescimento<=-1)
   throw new Error("Atividade inválida ou duplicada");
  ids.add(a.id);
 }
 const debitos={ibs:{},cbs:{}},gerados={ibs:{},cbs:{}},receitas={},detalhes={};
 for(let i=1;i<=anos;i++){
  const ano=anoBase+i;
  receitas[ano]=0;detalhes[ano]=[];
  for(const t of ["ibs","cbs"]){debitos[t][ano]=0;gerados[t][ano]=0;}
  for(const a of atividades){
   const receita=a.receitaBase*Math.pow(1+a.crescimento,i);
   const taxas={};const valorTributo={};
   for(const t of ["ibs","cbs"]){
    const taxa=a.aliquotasValidadas?.[t]?.[ano];
    if(!Number.isFinite(taxa)||taxa<0||taxa>1)
     throw new Error("Alíquota "+t+" não validada: "+a.id+" "+ano);
    taxas[t]=taxa;valorTributo[t]=receita*taxa;
    debitos[t][ano]+=valorTributo[t];
   }
   receitas[ano]+=receita;
   detalhes[ano].push({atividadeId:a.id,descricao:a.descricao??a.id,
    receita,aliquotas:taxas,debitos:valorTributo});
  }
 }
 const vistos=new Set();
 for(const e of eventosCredito){
  if(typeof e.id!=="string"||!e.id||vistos.has(e.id)||
     !ids.has(e.atividadeId)||!["ibs","cbs"].includes(e.tributo)||
     !Number.isInteger(e.ano)||e.ano<=anoBase||e.ano>anoBase+anos||
     !Number.isFinite(e.valor)||e.valor<0||
     typeof e.fundamento!=="string"||!e.fundamento.trim()||
     e.validadoPorAnalista!==true)
   throw new Error("Evento de crédito inválido ou não validado");
  vistos.add(e.id);
  gerados[e.tributo][e.ano]+=e.valor;
 }
 const conta=apurarIBSeCBS({anoInicial:anoBase+1,anos,
  ibs:{saldoInicial:saldosIniciais.ibs??0,gerados:gerados.ibs,
   debitos:debitos.ibs,ressarcidos:ressarcimentosRecebidos.ibs,
   ajustesNegativos:ajustesNegativos.ibs},
  cbs:{saldoInicial:saldosIniciais.cbs??0,gerados:gerados.cbs,
   debitos:debitos.cbs,ressarcidos:ressarcimentosRecebidos.cbs,
   ajustesNegativos:ajustesNegativos.cbs}});
 return {projecoes:conta.anos.map(a=>({...a,
  receitaTotal:receitas[a.ano],atividades:detalhes[a.ano]})),
  eventosCredito:eventosCredito.map(e=>({...e})),
  homologado:false,aptoParaParecer:false,
  ressalvas:["Créditos segregados por tributo e vinculados à atividade e competência.",
   "Aquisição ou renovação de frota não garante automaticamente direito a crédito.",
   "Sem modelagem de créditos condicionados, transição e prazos de ressarcimento."]};
}
