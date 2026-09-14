function numSet(id,v){if($(id))$(id).value=v}
function currentKind(){return cnaeSuggestion?.kind||(($('annex').value==='I')?'commerce':$('annex').value==='II'?'industry':'service')}
function migrationDefaults(kind){return kind==='service'?{irpjPres:.32,csllPres:.32}:{irpjPres:.08,csllPres:.12}}
function legacyTransition(year){return year<=2028?1:({2029:.9,2030:.8,2031:.7,2032:.6,2033:0}[year]??0)}
function modelForYear(year){
 applyFactorR();
 const annualRevenue=num('monthlyRevenue')*12,monthlyRevenue=num('monthlyRevenue'),rbt12=num('rbt12'),annex=$('annex').value;
 const eligibility=simpleEligibility(rbt12),isMei=eligibility.status==='mei',simpleComputable=!isMei&&rbt12>0&&rbt12<=SIMPLES_LIMIT;
 const sr=simplesRate(annex,rbt12,year),share=dasConsumptionShare(annex,sr.idx,year,sr.effective),das=simpleComputable?annualRevenue*sr.effective:0;
 const dasCbs=simpleComputable?das*share.cbs:0,dasIbs=simpleComputable?das*share.ibs:0,embedded=dasCbs+dasIbs,dasWithout=Math.max(0,das-embedded);
 const rr=regularRates(year),factor=revenueRateFactor(),fullRegularRate=rr.cbs+rr.ibs,grossRegularRate=fullRegularRate*factor,grossVat=annualRevenue*grossRegularRate;
 const purchases=annualRevenue*clamp(num('purchasesPct')/100,0,1),eligible=clamp(num('eligibleCreditPct')/100,0,1),regSup=clamp(num('regularSuppliersPct')/100,0,1);
 const inputCredit=purchases*eligible*regSup*fullRegularRate,netVat=Math.max(0,grossVat-inputCredit);
 const hybridCompliance=num('hybridCompliance')*12,fullCompliance=num('fullCompliance')*12;
 const payroll=num('monthlyPayroll')*12,annexCpp=annex==='IV'&&simpleComputable?payroll*.20:0;
 const pureTotal=das+annexCpp,hybridTotal=dasWithout+netVat+annexCpp+hybridCompliance;
 const kind=currentKind(),pres=migrationDefaults(kind),presumedBaseIR=annualRevenue*pres.irpjPres;
 const irpj=presumedBaseIR*.15+Math.max(0,presumedBaseIR-240000)*.10,csll=annualRevenue*pres.csllPres*.09,cpp=payroll*.20;
 const legacy=annualRevenue*clamp(num('legacyRate')/100,0,.40)*legacyTransition(year),presumedTotal=netVat+irpj+csll+cpp+legacy+fullCompliance;
 const realProfit=Math.max(0,annualRevenue*(num('realProfitMargin')/100)),realIrpj=realProfit*.15+Math.max(0,realProfit-240000)*.10,realCsll=realProfit*.09;
 const realTotal=netVat+realIrpj+realCsll+cpp+legacy+fullCompliance,b2b=clamp(num('b2bPct')/100,0,1);
 const pureClientCredit=simpleComputable?embedded*b2b:0,regularClientCredit=grossVat*b2b,hybridClientCredit=regularClientCredit,extraClientCredit=Math.max(0,hybridClientCredit-pureClientCredit);
 const allModels=[
  {key:'pure',name:'Simples Nacional 100%',total:pureTotal,tax:pureTotal,credit:pureClientCredit,compliance:0},
  {key:'hybrid',name:'Simples híbrido',total:hybridTotal,tax:dasWithout+netVat+annexCpp,credit:hybridClientCredit,compliance:hybridCompliance},
  {key:'presumed',name:'Lucro Presumido',total:presumedTotal,tax:presumedTotal-fullCompliance,credit:regularClientCredit,compliance:fullCompliance},
  {key:'real',name:'Lucro Real',total:realTotal,tax:realTotal-fullCompliance,credit:regularClientCredit,compliance:fullCompliance}
 ];
 const simpleEligible=eligibility.confirmed;
 const models=allModels.filter(m=>simpleEligible||!['pure','hybrid'].includes(m.key));
 const taxBest=[...models].sort((a,b)=>a.total-b.total)[0];
 const b2bSales=annualRevenue*b2b,extraHybridCost=hybridTotal-pureTotal,breakEvenCapture=b2bSales>0?Math.max(0,extraHybridCost)/b2bSales:Infinity,capture=clamp(num('capturePct')/100,0,1),adjustedHybrid=hybridTotal-extraClientCredit*capture;
 const commercialBest=simpleEligible&&adjustedHybrid<pureTotal?'hybrid':taxBest.key;
 return{year,annualRevenue,monthlyRevenue,rbt12,annex,sr,share,das,dasCbs,dasIbs,embedded,dasWithout,rr,factor,fullRegularRate,grossRegularRate,grossVat,purchases,inputCredit,netVat,hybridCompliance,fullCompliance,pureTotal,hybridTotal,presumedTotal,realTotal,irpj,csll,cpp,annexCpp,legacy,realIrpj,realCsll,pureClientCredit,hybridClientCredit,regularClientCredit,extraClientCredit,b2bSales,extraHybridCost,breakEvenCapture,capture,adjustedHybrid,taxBest,commercialBest,simpleEligible,simpleComputable,eligibility,isMei,models,allModels};
}
