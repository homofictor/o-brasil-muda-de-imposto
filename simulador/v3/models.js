function numSet(id,v){if($(id))$(id).value=v}
function currentKind(){return cnaeSuggestion?.kind || (($('annex').value==='I')?'commerce':$('annex').value==='II'?'industry':'service')}
function migrationDefaults(kind){
  if(kind==='service')return{irpjPres:.32,csllPres:.32};
  return{irpjPres:.08,csllPres:.12};
}
function legacyTransition(year){return year<=2028?1:({2029:.9,2030:.8,2031:.7,2032:.6,2033:0}[year]??0)}
function modelForYear(year){
  applyFactorR();
  const annualRevenue=num('monthlyRevenue')*12;
  const monthlyRevenue=num('monthlyRevenue');
  const rbt12=num('rbt12');
  const annex=$('annex').value;
  const sr=simplesRate(annex,rbt12,year);
  const share=dasConsumptionShare(annex,sr.idx,year);
  const das=annualRevenue*sr.effective;
  const dasCbs=das*share.cbs, dasIbs=das*share.ibs, embedded=dasCbs+dasIbs;
  const dasWithout=Math.max(0,das-embedded);
  const rr=regularRates(year);const factor=revenueRateFactor();
  const grossRegularRate=(rr.cbs+rr.ibs)*factor;
  const grossVat=annualRevenue*grossRegularRate;
  const purchases=annualRevenue*clamp(num('purchasesPct')/100,0,1);
  const eligible=clamp(num('eligibleCreditPct')/100,0,1);const regSup=clamp(num('regularSuppliersPct')/100,0,1);
  const inputCredit=purchases*eligible*regSup*grossRegularRate;
  const netVat=Math.max(0,grossVat-inputCredit);
  const hybridCompliance=num('hybridCompliance')*12;
  const fullCompliance=num('fullCompliance')*12;
  const pureTotal=das;
  const hybridTotal=dasWithout+netVat+hybridCompliance;
  const kind=currentKind();const pres=migrationDefaults(kind);
  const presumedBaseIR=annualRevenue*pres.irpjPres;const irpj=presumedBaseIR*.15+Math.max(0,presumedBaseIR-240000)*.10;
  const csll=annualRevenue*pres.csllPres*.09;
  const payroll=num('monthlyPayroll')*12;const cpp=payroll*.20;
  const legacy=annualRevenue*clamp(num('legacyRate')/100,0,.40)*legacyTransition(year);
  const presumedTotal=netVat+irpj+csll+cpp+legacy+fullCompliance;
  const realProfit=Math.max(0,annualRevenue*(num('realProfitMargin')/100));
  const realIrpj=realProfit*.15+Math.max(0,realProfit-240000)*.10;const realCsll=realProfit*.09;
  const realTotal=netVat+realIrpj+realCsll+cpp+legacy+fullCompliance;
  const b2b=clamp(num('b2bPct')/100,0,1);
  const pureClientCredit=embedded*b2b;
  const hybridClientCredit=grossVat*b2b;
  const extraClientCredit=Math.max(0,hybridClientCredit-pureClientCredit);
  const selectedModels=[
    {key:'pure',name:'Simples Nacional 100%',total:pureTotal,tax:pureTotal,credit:pureClientCredit,compliance:0},
    {key:'hybrid',name:'Simples híbrido',total:hybridTotal,tax:dasWithout+netVat,credit:hybridClientCredit,compliance:hybridCompliance},
    {key:'presumed',name:'Lucro Presumido',total:presumedTotal,tax:presumedTotal-fullCompliance,credit:hybridClientCredit,compliance:fullCompliance},
    {key:'real',name:'Lucro Real',total:realTotal,tax:realTotal-fullCompliance,credit:hybridClientCredit,compliance:fullCompliance}
  ];
  const simpleEligible=rbt12>0&&rbt12<=4800000&&$('simpleStatus').value!=='no';
  const eligibleModels=selectedModels.filter(m=> simpleEligible || !['pure','hybrid'].includes(m.key));
  const taxBest=[...eligibleModels].sort((a,b)=>a.total-b.total)[0];
  const b2bSales=annualRevenue*b2b;
  const extraHybridCost=hybridTotal-pureTotal;
  const breakEvenCapture=b2bSales>0?Math.max(0,extraHybridCost)/b2bSales:Infinity;
  const capture=clamp(num('capturePct')/100,0,1);
  const adjustedHybrid=hybridTotal-extraClientCredit*capture;
  const commercialBest = simpleEligible && adjustedHybrid < pureTotal ? 'hybrid' : taxBest.key;
  return {year,annualRevenue,monthlyRevenue,annex,sr,share,das,dasCbs,dasIbs,embedded,dasWithout,rr,factor,grossRegularRate,grossVat,purchases,inputCredit,netVat,hybridCompliance,fullCompliance,pureTotal,hybridTotal,presumedTotal,realTotal,irpj,csll,cpp,legacy,realIrpj,realCsll,pureClientCredit,hybridClientCredit,extraClientCredit,b2bSales,extraHybridCost,breakEvenCapture,capture,adjustedHybrid,taxBest,commercialBest,simpleEligible,models:selectedModels};
}
