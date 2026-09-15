function numSet(id,v){if($(id))$(id).value=v}
function currentKind(){return cnaeSuggestion?.kind||(($('annex').value==='I')?'commerce':$('annex').value==='II'?'industry':'service')}
function migrationDefaults(kind){return kind==='service'?{irpjPres:.32,csllPres:.32}:{irpjPres:.08,csllPres:.12}}
function legacyTransition(year){return year<=2028?1:({2029:.9,2030:.8,2031:.7,2032:.6,2033:0}[year]??0)}
function hasFieldValue(id){const el=$(id);return !!el&&String(el.value).trim()!==''}
function modelForYear(year){
 applyFactorR();
 const annualRevenue=num('monthlyRevenue')*12,monthlyRevenue=num('monthlyRevenue'),rbt12=num('rbt12'),annex=$('annex').value;
 const eligibility=simpleEligibility(rbt12),isMei=eligibility.status==='mei',simpleComputable=!isMei&&rbt12>0&&rbt12<=SIMPLES_LIMIT;
 const sr=simplesRate(annex,rbt12,year),share=dasConsumptionShare(annex,sr.idx,year,sr.effective),das=simpleComputable?annualRevenue*sr.effective:0;
 const dasCbs=simpleComputable?das*share.cbs:0,dasIbs=simpleComputable?das*share.ibs:0,embedded=dasCbs+dasIbs,dasWithout=Math.max(0,das-embedded);
 const rr=regularRates(year),factor=revenueRateFactor(),fullRegularRate=rr.cbs+rr.ibs,grossRegularRate=fullRegularRate*factor,grossVat=annualRevenue*grossRegularRate;
 const acquisitions=annualRevenue*clamp(num('purchasesPct')/100,0,1),eligible=clamp(num('eligibleCreditPct')/100,0,1),regSup=clamp(num('regularSuppliersPct')/100,0,1);
 const inputCredit=acquisitions*eligible*regSup*fullRegularRate,netVat=Math.max(0,grossVat-inputCredit);
 const hybridCompliance=num('hybridCompliance')*12,fullCompliance=num('fullCompliance')*12;
 const factorRPayroll=num('monthlyPayroll')*12,annexCpp=annex==='IV'&&simpleComputable?factorRPayroll*.20:0;
 const pureTotal=das+annexCpp,hybridTotal=dasWithout+netVat+annexCpp+hybridCompliance;
 const kind=currentKind(),pres=migrationDefaults(kind),presumedBaseIR=annualRevenue*pres.irpjPres;
 const irpj=presumedBaseIR*.15+Math.max(0,presumedBaseIR-240000)*.10,csll=annualRevenue*pres.csllPres*.09;
 const cppBaseKnown=hasFieldValue('monthlyCppBase')||factorRPayroll===0,cppBaseMonthly=Math.max(0,num('monthlyCppBase')),employerRate=clamp(num('employerRatePct')/100,0,.80),cpp=cppBaseMonthly*12*employerRate;
 const legacy=annualRevenue*clamp(num('legacyRate')/100,0,.40)*legacyTransition(year),presumedTotal=netVat+irpj+csll+cpp+legacy+fullCompliance,presumedValid=cppBaseKnown;
 const realProfitKnown=hasFieldValue('realAccountingProfitAnnual'),accountingProfit=num('realAccountingProfitAnnual'),additions=Math.max(0,num('realAdditionsAnnual')),exclusions=Math.max(0,num('realExclusionsAnnual'));
 const adjustedBeforeLoss=Math.max(0,accountingProfit+additions-exclusions),irpjLossAvailable=Math.max(0,num('irpjLossCarryforward')),csllLossAvailable=Math.max(0,num('csllNegativeBase'));
 const irpjLossUsed=Math.min(irpjLossAvailable,adjustedBeforeLoss*.30),csllLossUsed=Math.min(csllLossAvailable,adjustedBeforeLoss*.30),realIrpjBase=Math.max(0,adjustedBeforeLoss-irpjLossUsed),realCsllBase=Math.max(0,adjustedBeforeLoss-csllLossUsed);
 const realIrpj=realProfitKnown?(realIrpjBase*.15+Math.max(0,realIrpjBase-240000)*.10):0,realCsll=realProfitKnown?realCsllBase*.09:0,realTotal=netVat+realIrpj+realCsll+cpp+legacy+fullCompliance,realValid=realProfitKnown&&cppBaseKnown;
 const b2b=clamp(num('b2bPct')/100,0,1),pureClientCredit=simpleComputable?embedded*b2b:0,regularClientCredit=grossVat*b2b,hybridClientCredit=regularClientCredit,extraClientCredit=Math.max(0,hybridClientCredit-pureClientCredit);
 const allModels=[
  {key:'pure',name:'Simples Nacional 100%',total:pureTotal,tax:pureTotal,credit:pureClientCredit,compliance:0,valid:simpleComputable,validationMessage:simpleComputable?'':'Simples não aplicável.'},
  {key:'hybrid',name:'Simples híbrido',total:hybridTotal,tax:dasWithout+netVat+annexCpp,credit:hybridClientCredit,compliance:hybridCompliance,valid:simpleComputable,validationMessage:simpleComputable?'':'Simples híbrido não aplicável.'},
  {key:'presumed',name:'Lucro Presumido',total:presumedTotal,tax:presumedTotal-fullCompliance,credit:regularClientCredit,compliance:fullCompliance,valid:presumedValid,validationMessage:presumedValid?'':'Informe a remuneração mensal sujeita à contribuição patronal.'},
  {key:'real',name:'Lucro Real',total:realTotal,tax:realTotal-fullCompliance,credit:regularClientCredit,compliance:fullCompliance,valid:realValid,validationMessage:realValid?'':(!realProfitKnown?'Informe ou importe o lucro contábil antes de IRPJ e CSLL.':'Informe a remuneração mensal sujeita à contribuição patronal.')}
 ];
 const simpleEligible=eligibility.confirmed,models=allModels.filter(m=>simpleEligible||!['pure','hybrid'].includes(m.key)),validModels=models.filter(m=>m.valid!==false),taxBest=validModels.length?[...validModels].sort((a,b)=>a.total-b.total)[0]:{key:'pending',name:'Dados insuficientes',total:Infinity,valid:false};
 const b2bSales=annualRevenue*b2b,extraHybridCost=hybridTotal-pureTotal,breakEvenCapture=b2bSales>0?Math.max(0,extraHybridCost)/b2bSales:Infinity,creditCaptureNeeded=extraClientCredit>0?Math.max(0,extraHybridCost)/extraClientCredit:Infinity,capture=clamp(num('capturePct')/100,0,1),adjustedHybrid=hybridTotal-extraClientCredit*capture,commercialBest=simpleEligible&&adjustedHybrid<pureTotal?'hybrid':taxBest.key;
 return{year,annualRevenue,monthlyRevenue,rbt12,annex,sr,share,das,dasCbs,dasIbs,embedded,dasWithout,rr,factor,fullRegularRate,grossRegularRate,grossVat,purchases:acquisitions,acquisitions,inputCredit,netVat,hybridCompliance,fullCompliance,pureTotal,hybridTotal,presumedTotal,realTotal,irpj,csll,cpp,cppBaseKnown,cppBaseMonthly,employerRate,annexCpp,legacy,realIrpj,realCsll,realProfitKnown,accountingProfit,additions,exclusions,adjustedBeforeLoss,realIrpjBase,realCsllBase,irpjLossUsed,csllLossUsed,presumedValid,realValid,pureClientCredit,hybridClientCredit,regularClientCredit,extraClientCredit,b2bSales,extraHybridCost,breakEvenCapture,creditCaptureNeeded,capture,adjustedHybrid,taxBest,commercialBest,simpleEligible,simpleComputable,eligibility,isMei,models,allModels};
}
