/* Projeção gerencial de janeiro a dezembro de 2027. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('./das-2027.js'):root.SimplesDAS2027);if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.SimplesProjecao=api;})(typeof window!=='undefined'?window:undefined,function(das){
'use strict';
const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
function serie(text){const a=String(text||'').trim().split(/[;\s]+/).filter(Boolean).map(x=>Number(x.replace(',','.')));if(a.length!==12||a.some(n=>!Number.isFinite(n)||n<0))throw new Error('Informe 12 valores não negativos, sem separador de milhar, separados por ponto e vírgula.');return a;}
function calcular(d){
 if(d.modoDas!=='auto')throw new Error('A projeção exige o modo automático do DAS. Valores manuais de um mês não permitem recalcular faixas futuras.');
 const historico=serie(d.historico);
 if(!Number.isFinite(d.rbt12)||Math.abs(historico.reduce((a,b)=>a+b,0)-d.rbt12)>0.02)throw new Error('A soma das receitas de 2026 deve conferir com o RBT12 de janeiro de 2027.');
 if(!Number.isFinite(d.receita)||d.receita<=0||!Number.isFinite(d.crescimento)||d.crescimento< -100||d.crescimento>100)throw new Error('Informe receita inicial positiva e variação mensal entre -100% e 100%.');
 if(d.sujeitaFatorR)throw new Error('Atividades sujeitas ao Fator R precisam também da projeção mensal da folha. A projeção está indisponível para esse caso.');
 if(!['fixos','proporcionais'].includes(d.creditos))throw new Error('Selecione como os créditos acompanham a receita.');
 for(const k of ['taxaCbs','taxaIbs','creditoCbs','creditoIbs','admin'])if(!Number.isFinite(d[k])||d[k]<0)throw new Error('Revise alíquotas, créditos e custo de conformidade.');
 const futuras=d.futuras&&d.futuras.trim()?serie(d.futuras):null;
 const meses=[],fila=[...historico];let saldoCbs=0,saldoIbs=0,receitaAno=0;
 for(let i=0;i<12;i++){
  const receita=futuras?futuras[i]:cents(d.receita*Math.pow(1+d.crescimento/100,i));
  receitaAno=cents(receitaAno+receita);
  if(receitaAno>3600000)throw new Error('Mês '+(i+1)+': receita acumulada de 2027 acima de R$ 3,6 milhões. Sublimites e efeitos de excesso exigem análise contábil; nenhum total anual foi emitido.');
  const rbt12=cents(fila.reduce((a,b)=>a+b,0));
  let ap;try{ap=das.calcular({anexo:d.anexo,rbt12,receita});}catch(e){throw new Error('Mês '+(i+1)+': '+e.message+' Nenhum total anual foi emitido.');}
  const fator=d.creditos==='proporcionais'?receita/d.receita:1;
  const regular=das.apurarRegular({receita,taxaCbs:d.taxaCbs,taxaIbs:d.taxaIbs,creditoCbs:cents(d.creditoCbs*fator+saldoCbs),creditoIbs:cents(d.creditoIbs*fator+saldoIbs)});
  saldoCbs=regular.saldoCbs;saldoIbs=regular.saldoIbs;
  const hibrido=cents(ap.dasResidual+regular.recolhimentoRegular+d.admin);
  meses.push({mes:i+1,receita,rbt12,faixa:ap.faixa,aliquota:ap.aliquotaEfetiva,das:ap.dasTotal,parcela:ap.ibsCbs,regular:regular.recolhimentoRegular,hibrido,diferenca:cents(ap.dasTotal-hibrido),saldoCbs,saldoIbs});
  fila.shift();fila.push(receita);
 }
 const total={};for(const key of ['receita','das','parcela','regular','hibrido','diferenca'])total[key]=cents(meses.reduce((a,b)=>a+b[key],0));
 return {meses,total,saldoCbs,saldoIbs};
}
return {serie,calcular};
});
