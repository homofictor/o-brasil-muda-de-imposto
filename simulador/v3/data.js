const $=id=>document.getElementById(id);
const num=id=>Number($(id)?.value||0);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const brl2=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
const pct=n=>`${(n*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;
const pct1=n=>`${(n*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;
const years=[2027,2028,2029,2030,2031,2032,2033];
let selectedYear=2027,companyData=null,cnaeSuggestion=null;

const annexBands={
 I:[[180000,.04,0],[360000,.073,5940],[720000,.095,13860],[1800000,.107,22500],[3600000,.143,87300],[4800000,.19,378000]],
 II:[[180000,.045,0],[360000,.078,5940],[720000,.10,13860],[1800000,.112,22500],[3600000,.147,85500],[4800000,.30,720000]],
 III:[[180000,.06,0],[360000,.112,9360],[720000,.135,17640],[1800000,.16,35640],[3600000,.21,125640],[4800000,.33,648000]],
 IV:[[180000,.045,0],[360000,.09,8100],[720000,.102,12420],[1800000,.14,39780],[3600000,.22,183780],[4800000,.33,828000]],
 V:[[180000,.155,0],[360000,.18,4500],[720000,.195,9900],[1800000,.205,17100],[3600000,.23,62100],[4800000,.305,540000]]
};

// Percentuais de repartição da parcela do DAS. Para a 5ª faixa dos Anexos III e IV há fórmula especial quando o teto efetivo do ISS é alcançado.
const splitShares={
 I:{cbs27:[15.33,15.33,15.33,15.33,15.33,34.02],ibs27:[.17,.17,.17,.17,.17,0],cbs33:[15.5,15.5,15.5,15.5,15.5,34.4],ibs33:[34,34,33.5,33.5,33.5,0]},
 II:{cbs27:[13.85,13.85,13.85,13.85,13.85,25.22],ibs27:[.15,.15,.15,.15,.15,0],cbs33:[14,14,14,14,14,25.5],ibs33:[32,32,32,32,32,0]},
 III:{cbs27:[15.43,16.91,16.42,16.42,15.43,19.29],ibs27:[.17,.19,.19,.19,.17,0],cbs33:[15.6,17.1,16.6,16.6,15.6,19.5],ibs33:[33.5,32,32.5,32.5,33.5,0]},
 IV:{cbs27:[21.26,24.73,23.74,22.75,21.76,24.70],ibs27:[.24,.27,.26,.25,.24,0],cbs33:[21.5,25,24,23,22,25],ibs33:[44.5,40,40,40,40,0]},
 V:{cbs27:[16.96,16.96,17.95,18.94,16.96,19.78],ibs27:[.19,.19,.20,.21,.19,0],cbs33:[17.15,17.15,18.15,19.15,17.15,20],ibs33:[14,17,19,21,23.5,0]}
};

function bandsForYear(annex,year){
 const t=annexBands[annex].map(r=>[...r]);
 if(year<=2028){
  if(annex==='I')t[5]=[4800000,.189,378000];
  if(annex==='II')t[5]=[4800000,.299,720000];
  if(annex==='III')t[5]=[4800000,.329,648000];
  if(annex==='IV')t[5]=[4800000,.329,828000];
  if(annex==='V')t[5]=[4800000,.304,540000];
 }
 return t;
}
function simplesRate(annex,rbt12,year){
 const t=bandsForYear(annex,year);let idx=t.findIndex(r=>rbt12<=r[0]);if(idx<0)idx=t.length-1;
 const [limit,nominal,deduction]=t[idx],effective=rbt12>0?Math.max(0,(rbt12*nominal-deduction)/rbt12):0;
 return{effective,idx,nominal,deduction,limit};
}
function specialDasConsumption(annex,bandIndex,year,effective){
 if(bandIndex!==4||effective<=0)return null;
 if(annex==='III'&&effective>.1492537){
  if(year<=2028)return{cbs:((effective-.05)*.2320)/effective,ibs:((effective-.05)*.0026)/effective,special:true};
  if(year>=2029&&year<=2032){const ibsFixed={2029:.005,2030:.010,2031:.015,2032:.020}[year];return{cbs:((effective-.05)*.2346)/effective,ibs:ibsFixed/effective,special:true};}
 }
 if(annex==='IV'&&effective>.125){
  const x={2027:[.05,.3627,.0040],2028:[.05,.3627,.0040],2029:[.045,.3438,.0625],2030:[.04,.3235,.1176],2031:[.035,.3056,.1667],2032:[.03,.2895,.2105]}[year];
  if(x){const[issCap,cbsCoeff,ibsCoeff]=x;return{cbs:((effective-issCap)*cbsCoeff)/effective,ibs:((effective-issCap)*ibsCoeff)/effective,special:true};}
 }
 return null;
}
function dasConsumptionShare(annex,bandIndex,year,effective=0){
 const special=specialDasConsumption(annex,bandIndex,year,effective);if(special)return special;
 const s=splitShares[annex],i=bandIndex;
 if(year<=2028)return{cbs:s.cbs27[i]/100,ibs:s.ibs27[i]/100,special:false};
 const ibsFactor={2029:.1,2030:.2,2031:.3,2032:.4,2033:1}[year]||1;
 return{cbs:s.cbs33[i]/100,ibs:(s.ibs33[i]/100)*ibsFactor,special:false};
}
function regularRates(year){
 const fullCbs=clamp(num('fullCbs')/100,0,.3),fullIbs=clamp(num('fullIbs')/100,0,.4);
 if(year<=2028)return{cbs:Math.max(0,fullCbs-.001),ibs:.001};
 return{cbs:fullCbs,ibs:fullIbs*({2029:.1,2030:.2,2031:.3,2032:.4,2033:1}[year]||1)};
}
function revenueRateFactor(){
 const ids=[['mixFull',1],['mix30',.7],['mix40',.6],['mix60',.4],['mixZero',0]],total=ids.reduce((s,[id])=>s+num(id),0),el=$('mixTotal');
 if(el){el.textContent=`${total.toFixed(0)}%`;el.className='total '+(Math.abs(total-100)<.01?'ok':'bad')}
 if(total<=0)return 1;return ids.reduce((s,[id,f])=>s+num(id)*f,0)/total;
}
function cnaeFmt(code){const s=String(code||'').replace(/\D/g,'').padStart(7,'0');if(s.length!==7)return String(code||'');return`${s.slice(0,2)}.${s.slice(2,4)}-${s.slice(4)}/${s.slice(5,7)}`}
function inferActivity(cnae,description){
 const code=String(cnae||'').replace(/\D/g,'').padStart(7,'0'),prefix=Number(code.slice(0,2)),text=(description||'').toLowerCase();
 if(prefix>=45&&prefix<=47)return{annex:'I',kind:'commerce',factorR:false,confidence:'alta',reason:'divisão de comércio'};
 if((prefix>=10&&prefix<=33)||(prefix>=5&&prefix<=9)||prefix===35||prefix===36)return{annex:'II',kind:'industry',factorR:false,confidence:'média',reason:'atividade industrial ou extrativa'};
 const iv=['construção','obras de','limpeza','conservação','vigilância','advocacia','paisagismo','cessão de mão de obra'];if(iv.some(w=>text.includes(w)))return{annex:'IV',kind:'service',factorR:false,confidence:'média',reason:'serviço com indício de Anexo IV'};
 const fr=['medic','odont','veterin','engenh','arquitet','consultor','tecnologia','software','programa','academia','laborat','jornal','publicidade','design','administra','econom','contab','auditor','psicolog','fisioter','terapia','nutri','representação comercial'];if(fr.some(w=>text.includes(w)))return{annex:'V',kind:'service',factorR:true,confidence:'média',reason:'serviço com indício de Fator R'};
 if(prefix>=49&&prefix<=99)return{annex:'III',kind:'service',factorR:false,confidence:'baixa',reason:'atividade de serviços, sujeita a confirmação'};
 return{annex:'I',kind:'unknown',factorR:false,confidence:'baixa',reason:'atividade não classificada automaticamente'};
}
function factorRValue(){const r=num('rbt12');return r>0?(num('monthlyPayroll')*12)/r:0}
function applyFactorR(){if(cnaeSuggestion?.factorR&&$('factorMode').value==='auto'){$('annex').value=factorRValue()>=.28?'III':'V';$('annexHint').textContent=`Fator R estimado em ${pct1(factorRValue())}. Sugestão automática: Anexo ${$('annex').value}.`;if($('factorHint'))$('factorHint').textContent='O limite de 28% foi aplicado à sugestão automática.'}}
