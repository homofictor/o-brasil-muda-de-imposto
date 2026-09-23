const $=id=>document.getElementById(id);
const num=id=>typeof window.parseMoneyValue==='function'?window.parseMoneyValue($(id)?.value):Number($(id)?.value||0);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const brl=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const brl2=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
const pct=n=>`${(n*100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}%`;
const pct1=n=>`${(n*100).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`;
const years=[2027,2028,2029,2030,2031,2032,2033];
let selectedYear=2027,companyData=null,cnaeSuggestion=null,sectorSuggestion=null;
let historicalSimpleReported=false;

const SIMPLES_LIMIT=4800000;
const annexBands={
 I:[[180000,.04,0],[360000,.073,5940],[720000,.095,13860],[1800000,.107,22500],[3600000,.143,87300],[4800000,.19,378000]],
 II:[[180000,.045,0],[360000,.078,5940],[720000,.10,13860],[1800000,.112,22500],[3600000,.147,85500],[4800000,.30,720000]],
 III:[[180000,.06,0],[360000,.112,9360],[720000,.135,17640],[1800000,.16,35640],[3600000,.21,125640],[4800000,.33,648000]],
 IV:[[180000,.045,0],[360000,.09,8100],[720000,.102,12420],[1800000,.14,39780],[3600000,.22,183780],[4800000,.33,828000]],
 V:[[180000,.155,0],[360000,.18,4500],[720000,.195,9900],[1800000,.205,17100],[3600000,.23,62100],[4800000,.305,540000]]
};

const splitShares={
 I:{cbs27:[15.33,15.33,15.33,15.33,15.33,34.02],ibs27:[.17,.17,.17,.17,.17,0],cbs33:[15.5,15.5,15.5,15.5,15.5,34.4],ibs33:[34,34,33.5,33.5,33.5,0]},
 II:{cbs27:[13.85,13.85,13.85,13.85,13.85,25.22],ibs27:[.15,.15,.15,.15,.15,0],cbs33:[14,14,14,14,14,25.5],ibs33:[32,32,32,32,32,0]},
 III:{cbs27:[15.43,16.91,16.42,16.42,15.43,19.29],ibs27:[.17,.19,.19,.19,.17,0],cbs33:[15.6,17.1,16.6,16.6,15.6,19.5],ibs33:[33.5,32,32.5,32.5,33.5,0]},
 IV:{cbs27:[21.26,24.73,23.74,22.75,21.76,24.70],ibs27:[.24,.27,.26,.25,.24,0],cbs33:[21.5,25,24,23,22,25],ibs33:[44.5,40,40,40,40,0]},
 V:{cbs27:[16.96,16.96,17.95,18.94,16.96,19.78],ibs27:[.19,.19,.20,.21,.19,0],cbs33:[17.15,17.15,18.15,19.15,17.15,20],ibs33:[14,17,19,21,23.5,0]}
};

function bandsForYear(annex,year){
 const t=(annexBands[annex]||annexBands.I).map(r=>[...r]);
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
 return{effective,idx,nominal,deduction,limit,overLimit:rbt12>SIMPLES_LIMIT};
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
 const s=splitShares[annex]||splitShares.I,i=bandIndex;
 if(year<=2028)return{cbs:s.cbs27[i]/100,ibs:s.ibs27[i]/100,special:false};
 const ibsFactor={2029:.1,2030:.2,2031:.3,2032:.4,2033:1}[year]||1;
 return{cbs:s.cbs33[i]/100,ibs:(s.ibs33[i]/100)*ibsFactor,special:false};
}
function regularRates(year){
 const fullCbs=clamp(num('fullCbs')/100,0,.3),fullIbs=clamp(num('fullIbs')/100,0,.4);
 if(year<=2028)return{cbs:Math.max(0,fullCbs-.001),ibs:.001};
 return{cbs:fullCbs,ibs:fullIbs*({2029:.1,2030:.2,2031:.3,2032:.4,2033:1}[year]||1)};
}
function syncMixFull(mark=true){
 const reductions=['mix30','mix40','mix60','mixZero'].reduce((s,id)=>s+Math.max(0,num(id)),0),full=Math.max(0,100-reductions),input=$('mixFull');
 if(input){input.value=Math.round(full*100)/100;input.readOnly=true;if(mark&&typeof markFieldDerived==='function')markFieldDerived('mixFull','CALCULADO')}
 return{full,reductions};
}
function revenueRateFactor(){
 syncMixFull(false);
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
function legalNatureBlocksSimple(d=companyData){
 if(!d)return false;
 const rawCode=d.codigo_natureza_juridica??d.natureza_juridica_codigo??d.codigo_natureza??'';
 const code=String(rawCode).replace(/\D/g,'');
 const text=String(d.natureza_juridica||d.descricao_natureza_juridica||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 return code==='2046'||code==='2054'||text.includes('SOCIEDADE ANONIMA');
}
function factorRValue(){const r=num('rbt12');return r>0?(num('monthlyPayroll')*12)/r:0}
function applyFactorR(){
 const eligibility=simpleEligibility(num('rbt12'));
 if(!eligibility.confirmed)return;
 if(cnaeSuggestion?.factorR&&$('factorMode').value==='auto'){
  $('annex').value=factorRValue()>=.28?'III':'V';
  $('annexHint').textContent=`Fator R estimado em ${pct1(factorRValue())}. Sugestão automática: Anexo ${$('annex').value}.`;
  if($('factorHint'))$('factorHint').textContent='O limite de 28% foi aplicado à sugestão automática.';
 }
}

function sectorProfile(cnae,description){
 const code=String(cnae||'').replace(/\D/g,'').padStart(7,'0'),div=Number(code.slice(0,2)),text=(description||'').toLowerCase();
 const base={b2b:60,creditable:70,suppliers:80,confidence:'baixa',reason:'perfil setorial genérico',mix:{full:100,r30:0,r40:0,r60:0,zero:0}};
 if(div>=10&&div<=33)return{...base,b2b:95,creditable:92,suppliers:92,confidence:'alta',reason:'indústria de transformação, tipicamente B2B e intensiva em insumos'};
 if(div===46){if(/medic|odont|hospital|saude|saúde|dispositivo/.test(text))return{...base,b2b:95,creditable:95,suppliers:90,confidence:'média',reason:'comércio atacadista B2B; produtos médico-hospitalares podem ter tratamentos específicos e exigem revisão por NCM/cClassTrib',treatmentReview:true};return{...base,b2b:95,creditable:95,suppliers:90,confidence:'alta',reason:'comércio atacadista, tipicamente B2B'}};
 if(div===47){
  if(/supermerc|mercado|mercearia|padaria|alimento/.test(text))return{...base,b2b:10,creditable:90,suppliers:85,confidence:'média',reason:'varejo alimentar, tipicamente B2C; cesta de produtos pode misturar alíquota cheia e zero',mix:{full:70,r30:0,r40:0,r60:0,zero:30}};
  return{...base,b2b:10,creditable:90,suppliers:85,confidence:'alta',reason:'comércio varejista, tipicamente B2C'};
 }
 if(div===45)return{...base,b2b:55,creditable:90,suppliers:88,confidence:'média',reason:'comércio e serviços automotivos com mix B2B/B2C'};
 if(div>=41&&div<=43)return{...base,b2b:80,creditable:75,suppliers:82,confidence:'média',reason:'construção e obras, com cadeia empresarial relevante'};
 if(div===55||div===56)return{...base,b2b:15,creditable:70,suppliers:75,confidence:'média',reason:'hospedagem/alimentação, normalmente concentrada em consumidor final'};
 if(div===85)return{...base,b2b:30,creditable:35,suppliers:70,confidence:'média',reason:'serviços de educação; revisar enquadramento das operações com redução legal',mix:{full:0,r30:0,r40:0,r60:100,zero:0}};
 if(div===86||/hospital|medic|odont|clinica|clínica|saude|saúde/.test(text))return{...base,b2b:35,creditable:40,suppliers:75,confidence:'média',reason:'serviços de saúde; revisar cClassTrib e alcance da redução legal',mix:{full:0,r30:0,r40:0,r60:100,zero:0}};
 if(/software|tecnologia|consult|contab|auditor|engenh|arquitet|advoc/.test(text))return{...base,b2b:90,creditable:45,suppliers:78,confidence:'média',reason:'serviço profissional/empresarial, tipicamente B2B e intensivo em mão de obra'};
 if(div>=49&&div<=82)return{...base,b2b:75,creditable:60,suppliers:78,confidence:'média',reason:'serviço empresarial com participação relevante de clientes PJ'};
 if(div>=87&&div<=96)return{...base,b2b:20,creditable:50,suppliers:70,confidence:'baixa',reason:'serviço voltado em grande parte ao consumidor final'};
 return base;
}
function applySectorProfile(profile=sectorSuggestion){
 if(!profile)return;
 const set=(id,v,label='SUGERIDO')=>{const el=$(id);if(!el)return;el.value=v;if(typeof markFieldAuto==='function')markFieldAuto(id,label)};
 set('b2bPct',profile.b2b);set('eligibleCreditPct',profile.creditable);set('regularSuppliersPct',profile.suppliers);
 const m=profile.mix||{};set('mix30',m.r30??0);set('mix40',m.r40??0);set('mix60',m.r60??0);set('mixZero',m.zero??0);syncMixFull(true);
 if($('b2bHint'))$('b2bHint').textContent=`Estimado pelo CNAE · confiança ${profile.confidence}. ${profile.reason}.`;
 if($('creditHint'))$('creditHint').textContent=`Estimado pelo perfil de gastos do setor · confiança ${profile.confidence}.`;
 if($('supplierHint'))$('supplierHint').textContent=`Estimado pela cadeia de fornecedores do setor · confiança ${profile.confidence}.`;
 if($('mixHint'))$('mixHint').textContent=`Sugestão inicial por CNAE/atividade · confiança ${profile.confidence}. Revise o cClassTrib das operações reais.`;
 revenueRateFactor();
}

function simpleEligibility(rbt12=num('rbt12')){
 const simple=$('simpleStatus')?.value||'unknown',isMei=companyData?.opcao_pelo_mei===true||$('meiStatus')?.value==='yes';
 if(legalNatureBlocksSimple())return{confirmed:false,potential:false,status:'legal_nature',reason:'Sociedade anônima não pode optar pelo Simples Nacional nem se enquadrar como MEI.'};
 if(isMei)return{confirmed:false,potential:false,status:'mei',reason:'MEI possui regras próprias e não pode usar o regime híbrido.'};
 if(rbt12>SIMPLES_LIMIT)return{confirmed:false,potential:false,status:'over_limit',historical:historicalSimpleReported||simple==='yes',reason:`RBT12 de ${brl2.format(rbt12)} supera o limite de ${brl2.format(SIMPLES_LIMIT)}.`};
 if(simple==='yes')return{confirmed:true,potential:true,status:'confirmed',reason:'Opção pelo Simples informada/confirmada e faturamento dentro do limite.'};
 if(simple==='no')return{confirmed:false,potential:true,status:'not_optant',reason:'Empresa não optante. Eventual opção futura depende das demais condições legais.'};
 return{confirmed:false,potential:true,status:'unknown',reason:'Situação no Simples não confirmada.'};
}
function refreshEligibilityUi(){
 const rbt12=num('rbt12'),e=simpleEligibility(rbt12),annex=$('annex'),factor=$('factorMode'),payroll=$('monthlyPayroll'),simple=$('simpleStatus'),mei=$('meiStatus'),note=$('simpleEligibilityNote'),payrollHint=$('factorPayrollHint');
 const simpleInputsEnabled=e.confirmed;
 if(annex)annex.disabled=!simpleInputsEnabled;
 if(factor)factor.disabled=!simpleInputsEnabled;
 if(payroll)payroll.disabled=!simpleInputsEnabled;
 if(payrollHint)payrollHint.textContent=simpleInputsEnabled
  ?'Use a composição própria do Fator R, incluindo remunerações e os encargos admitidos nessa regra. Este valor não é usado como base automática da contribuição patronal fora do Simples.'
  :'Não aplicável enquanto a empresa não estiver confirmada como optante do Simples Nacional.';
 if(e.status==='legal_nature'){
  if(simple){simple.value='no';simple.disabled=true}
  if(mei){mei.value='no';mei.disabled=true}
  if(annex){annex.value='';annex.disabled=true}
  if(factor)factor.disabled=true;
  if($('annexHint'))$('annexHint').textContent='Não aplicável: sociedades anônimas não podem optar pelo Simples Nacional.';
  if($('factorHint'))$('factorHint').textContent='Não aplicável: o Fator R é exclusivo de situações abrangidas pelo Simples.';
  if(note){note.hidden=false;note.className='status';note.textContent=e.reason}
  if($('companySimple')){$('companySimple').textContent='Simples: não permitido pela natureza jurídica';$('companySimple').className='chip bad'}
  if($('companyMei')){$('companyMei').textContent='MEI: não permitido';$('companyMei').className='chip bad'}
  if(typeof markFieldAuto==='function'){markFieldAuto('simpleStatus','AUTOMÁTICO');markFieldAuto('meiStatus','AUTOMÁTICO');markFieldAuto('annex','N/A');markFieldAuto('factorMode','N/A')}
 }else if(e.status==='over_limit'){
  if(simple){simple.value='no';simple.disabled=true}
  if(annex)annex.disabled=true;if(factor)factor.disabled=true;
  if($('annexHint'))$('annexHint').textContent='Não aplicável à análise prospectiva: faturamento acima do teto do Simples.';
  if($('factorHint'))$('factorHint').textContent='Fator R não é aplicável à análise prospectiva fora do Simples.';
  if(note){note.hidden=false;note.className='status bad';note.textContent=`Não elegível ao Simples pelo faturamento. ${e.reason}${e.historical?' O cadastro pode refletir situação histórica ou transitória, que deve ser tratada separadamente.':''}`}
  if($('companySimple')){$('companySimple').textContent='Simples: não elegível pelo faturamento';$('companySimple').className='chip bad'}
  if(typeof markFieldAuto==='function'){markFieldAuto('simpleStatus','AUTOMÁTICO');markFieldAuto('annex','N/A');markFieldAuto('factorMode','N/A')}
 }else{
  if(simple)simple.disabled=false;if(mei)mei.disabled=false;
  if(!e.confirmed&&e.status!=='unknown'&&annex)annex.value='';
  if(e.status==='not_optant'){
   if($('annexHint'))$('annexHint').textContent='Não aplicável: a empresa não está confirmada como optante do Simples Nacional.';
   if($('factorHint'))$('factorHint').textContent='Não aplicável: o Fator R só é utilizado quando o Simples Nacional estiver confirmado.';
  }else if(e.status==='mei'){
   if($('annexHint'))$('annexHint').textContent='Não aplicável ao MEI nesta comparação.';
   if($('factorHint'))$('factorHint').textContent='Não aplicável ao MEI nesta comparação.';
  }else if(e.status==='unknown'){
   if($('factorHint'))$('factorHint').textContent='Confirme primeiro a situação no Simples Nacional para habilitar o Fator R.';
  }else if(e.status==='confirmed'){
   if($('factorHint'))$('factorHint').textContent=cnaeSuggestion?.factorR?'O limite de 28% será aplicado à sugestão automática.':'Disponível apenas se a atividade efetivamente estiver sujeita ao Fator R.';
  }
  if(note){note.hidden=e.status==='confirmed';if(!note.hidden){note.className='status';note.textContent=e.reason}}
 }
 return e;
}

function financialMetrics(){
 const filled=id=>String($(id)?.value??'').trim()!=='';
 const cashKnown=filled('cashAndEquivalents')||filled('liquidInvestments');
 const cclKnown=filled('currentAssets')&&filled('currentLiabilities');
 const debtKnown=filled('debtStart')||filled('debtEnd');
 const interestKnown=filled('interestExpense');
 const cash=Math.max(0,num('cashAndEquivalents')),liquid=Math.max(0,num('liquidInvestments')),reserve=cash+liquid;
 const ac=Math.max(0,num('currentAssets')),pc=Math.max(0,num('currentLiabilities')),ccl=ac-pc;
 const start=Math.max(0,num('debtStart')),end=Math.max(0,num('debtEnd'));
 const avg=start>0&&end>0?(start+end)/2:(end>0?end:start);
 const interest=Math.max(0,num('interestExpense')),months=clamp(num('dreMonths')||12,1,12);
 let annualRate=debtKnown&&interestKnown&&avg>0&&interest>0?(interest/avg)*(12/months):null;
 const automaticRatePlausible=annualRate!=null&&Number.isFinite(annualRate)&&annualRate<=1;
 if($('cashReserve'))$('cashReserve').value=cashKnown?Math.round(reserve*100)/100:'';
 if($('workingCapitalNet'))$('workingCapitalNet').value=cclKnown?Math.round(ccl*100)/100:'';
 if($('debtAverage'))$('debtAverage').value=debtKnown?Math.round(avg*100)/100:'';
 const mode=$('financeRateMode')?.value||'auto';
 if(mode==='auto'&&automaticRatePlausible){
  $('financeRate').value=Math.round(annualRate*10000)/100;
  if(typeof markFieldDerived==='function')markFieldDerived('financeRate','CALCULADO');
  if($('financeRateSource'))$('financeRateSource').textContent=`Juros e encargos específicos da dívida ÷ dívida financeira média, anualizado para ${months} mês${months===1?'':'es'} de DRE.`;
 }else if(mode==='auto'&&annualRate!=null&&Number.isFinite(annualRate)&&annualRate>1){
  $('financeRate').value='';
  if(typeof markFieldPending==='function'){markFieldPending('financeRate','REVISAR BASE');markFieldPending('interestExpense','REVISAR')}
  if($('financeRateSource'))$('financeRateSource').textContent=`A relação encontrada seria de ${(annualRate*100).toLocaleString('pt-BR',{maximumFractionDigits:2})}% a.a., acima do limite de validação automática. Revise se o numerador contém apenas juros e encargos vinculados às dívidas consideradas.`;
 }else if(mode==='auto'){
  $('financeRate').value='';
  if($('financeRateSource'))$('financeRateSource').textContent='Sem dados suficientes de juros específicos e dívida média. Revise BP/DRE ou altere para premissa manual.';
 }
 if(typeof markFieldDerived==='function'){
  if(cashKnown)markFieldDerived('cashReserve','CALCULADO');
  if(cclKnown)markFieldDerived('workingCapitalNet','CALCULADO');
  if(debtKnown)markFieldDerived('debtAverage','CALCULADO');
 }
 return{cash,liquid,reserve,ac,pc,ccl,start,end,avg,interest,months,annualRate:automaticRatePlausible?annualRate:null,rawAnnualRate:annualRate};
}
