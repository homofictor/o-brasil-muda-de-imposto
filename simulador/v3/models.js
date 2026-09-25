function numSet(id,v){const el=$(id);if(!el)return;if(typeof window.setMoneyInputValue==='function'&&el.closest?.('.money'))window.setMoneyInputValue(el,v);else el.value=v}
function currentKind(){return cnaeSuggestion?.kind||(($('annex').value==='I')?'commerce':$('annex').value==='II'?'industry':'service')}
function migrationDefaults(kind){return kind==='service'?{irpjPres:.32,csllPres:.32}:{irpjPres:.08,csllPres:.12}}
function legacyTransition(year){return year<=2028?1:({2029:.9,2030:.8,2031:.7,2032:.6,2033:0}[year]??0)}
function hasFieldValue(id){const el=$(id);return !!el&&String(el.value).trim()!==''}
function realTaxSnapshot(profit,additions,exclusions,irpjLossAvailable,csllLossAvailable){
 const adjustedBeforeLoss=Math.max(0,Number(profit||0)+Math.max(0,Number(additions||0))-Math.max(0,Number(exclusions||0)));
 const irpjLossUsed=Math.min(Math.max(0,Number(irpjLossAvailable||0)),adjustedBeforeLoss*.30),csllLossUsed=Math.min(Math.max(0,Number(csllLossAvailable||0)),adjustedBeforeLoss*.30);
 const irpjBase=Math.max(0,adjustedBeforeLoss-irpjLossUsed),csllBase=Math.max(0,adjustedBeforeLoss-csllLossUsed);
 const irpj=irpjBase*.15+Math.max(0,irpjBase-240000)*.10,csll=csllBase*.09;
 return{adjustedBeforeLoss,irpjLossUsed,csllLossUsed,irpjBase,csllBase,irpj,csll,total:irpj+csll}
}
function realPresumedBreakEven(annualRevenue,targetTax,additions,exclusions,irpjLossAvailable,csllLossAvailable){
 if(!(annualRevenue>0)||!(targetTax>=0))return null;
 if(targetTax===0)return{profit:0,margin:0,tax:0};
 let lo=-Math.max(annualRevenue,1),hi=Math.max(annualRevenue,500000),guard=0;
 while(realTaxSnapshot(hi,additions,exclusions,irpjLossAvailable,csllLossAvailable).total<targetTax&&guard<12){hi*=2;guard++}
 if(realTaxSnapshot(hi,additions,exclusions,irpjLossAvailable,csllLossAvailable).total<targetTax)return null;
 for(let i=0;i<70;i++){const mid=(lo+hi)/2,t=realTaxSnapshot(mid,additions,exclusions,irpjLossAvailable,csllLossAvailable).total;if(t<targetTax)lo=mid;else hi=mid}
 const profit=(lo+hi)/2;return{profit,margin:profit/annualRevenue,tax:realTaxSnapshot(profit,additions,exclusions,irpjLossAvailable,csllLossAvailable).total}
}
function importedOperatingCreditProfile(annualRevenue){
 const docs=window.brmiImport?.docs||[];
 const profiles=docs.map(d=>d?.operatingCreditDetail).filter(Boolean).sort((a,b)=>(Number(b.ratioToRevenue)||0)-(Number(a.ratioToRevenue)||0));
 const p=profiles[0];if(!p||!(Number(p.ratioToRevenue)>0))return null;
 const annualAmount=Math.max(0,annualRevenue*Number(p.ratioToRevenue));
 return{source:p.source||'DRE importada',annualAmount,ratioToRevenue:Number(p.ratioToRevenue),confidence:p.confidence||'medium',method:p.method||'proxy de despesas operacionais',note:p.note||''};
}

function automotiveImportedCreditProfile(annualRevenue){
 const docs=window.brmiImport?.docs||[];
 const profiles=docs.map(d=>d?.automotiveDetail).filter(Boolean).sort((a,b)=>(Number(b.revenueCoverage)||0)-(Number(a.revenueCoverage)||0));
 const p=profiles[0];if(!p||!(Number(p.revenueTotal)>0)||!(Number(p.costTotal)>0))return null;
 const coverage=Number(p.revenueCoverage);if(Number.isFinite(coverage)&&coverage<.70)return null;
 const scale=annualRevenue>0&&p.revenueTotal>0?annualRevenue/p.revenueTotal:1;
 if(!Number.isFinite(scale)||scale<=0||scale>3)return null;
 const costs=p.costs||{},scaled=k=>Math.max(0,Number(costs[k]||0))*scale;
 return{
  source:p.source||'DRE importada',
  basis:p.basis||'DRE historica',
  confidence:'low',
  revenueCoverage:Number.isFinite(coverage)?coverage:null,
  newVehicles:scaled('newVehicles'),
  usedVehicles:scaled('usedVehicles'),
  parts:scaled('parts'),
  services:scaled('services'),
  costTotal:Math.max(0,Number(p.costTotal)||0)*scale,
  usedVehiclesMention:p.usedVehiclesMention===true
 };
}

function modelForYear(year){
 applyFactorR();
 const annualRevenue=num('monthlyRevenue')*12,monthlyRevenue=num('monthlyRevenue'),rbt12=num('rbt12'),annex=$('annex').value;
 const eligibility=simpleEligibility(rbt12),simpleEligible=eligibility.confirmed,isMei=eligibility.status==='mei',simpleComputable=!isMei&&rbt12>0&&rbt12<=SIMPLES_LIMIT;
 const sr=simplesRate(annex,rbt12,year),share=dasConsumptionShare(annex,sr.idx,year,sr.effective),das=simpleComputable?annualRevenue*sr.effective:0;
 const dasCbs=simpleComputable?das*share.cbs:0,dasIbs=simpleComputable?das*share.ibs:0,embedded=dasCbs+dasIbs,dasWithout=Math.max(0,das-embedded);
 const rr=regularRates(year),factor=revenueRateFactor(),fullRegularRate=rr.cbs+rr.ibs,grossRegularRate=fullRegularRate*factor,grossVat=annualRevenue*grossRegularRate;
 const reportedAcquisitions=annualRevenue*clamp(num('purchasesPct')/100,0,1),eligible=clamp(num('eligibleCreditPct')/100,0,1),regSup=clamp(num('regularSuppliersPct')/100,0,1);
 const automotiveCreditProfile=automotiveImportedCreditProfile(annualRevenue),operatingCreditProfile=importedOperatingCreditProfile(annualRevenue);
 let acquisitions=reportedAcquisitions,inputCredit=reportedAcquisitions*eligible*regSup*fullRegularRate,creditMethod=operatingCreditProfile?'generic-dre-proxy':'generic';
 if(automotiveCreditProfile){
  const vehicleBase=automotiveCreditProfile.newVehicles+automotiveCreditProfile.usedVehicles;
  const partsBase=automotiveCreditProfile.parts,serviceBase=automotiveCreditProfile.services;
  const knownCostBase=vehicleBase+partsBase+serviceBase;
  const additionalBase=Math.max(0,reportedAcquisitions-knownCostBase);
  const vehicleCredit=vehicleBase*fullRegularRate;
  const partsCredit=partsBase*regSup*fullRegularRate;
  const otherCredit=(serviceBase+additionalBase)*eligible*regSup*fullRegularRate;
  acquisitions=Math.max(reportedAcquisitions,knownCostBase);
  inputCredit=vehicleCredit+partsCredit+otherCredit;
  creditMethod='automotive-dre-proxy';
  automotiveCreditProfile.vehicleCredit=vehicleCredit;automotiveCreditProfile.partsCredit=partsCredit;automotiveCreditProfile.otherCredit=otherCredit;automotiveCreditProfile.additionalBase=additionalBase;automotiveCreditProfile.estimatedCredit=inputCredit;
 }
 const netVat=Math.max(0,grossVat-inputCredit);
 const hybridCompliance=num('hybridCompliance')*12,fullCompliance=num('fullCompliance')*12;
 const factorRPayroll=num('monthlyPayroll')*12,cppBaseKnown=hasFieldValue('monthlyCppBase'),cppBaseMonthly=Math.max(0,num('monthlyCppBase')),employerRate=clamp(num('employerRatePct')/100,0,.80),cpp=cppBaseKnown?cppBaseMonthly*12*employerRate:0;
 const cppRequiredForCrossRegime=simpleEligible,cppComparisonReady=!cppRequiredForCrossRegime||cppBaseKnown,regularProjectionComplete=cppBaseKnown;
 const simplePayrollValid=annex!=='IV'||cppBaseKnown,annexCpp=annex==='IV'&&simpleComputable?cpp:0;
 const pureTotal=das+annexCpp,hybridTotal=dasWithout+netVat+annexCpp+hybridCompliance;
 const kind=currentKind(),pres=migrationDefaults(kind),presumedBaseIR=annualRevenue*pres.irpjPres,presumedBaseCSLL=annualRevenue*pres.csllPres;
 const irpj=presumedBaseIR*.15+Math.max(0,presumedBaseIR-240000)*.10,csll=presumedBaseCSLL*.09;
 const legacyKnown=year>=2033||hasFieldValue('legacyRate'),legacy=annualRevenue*clamp(num('legacyRate')/100,0,.40)*legacyTransition(year),presumedTotal=netVat+irpj+csll+cpp+legacy+fullCompliance,presumedValid=legacyKnown&&cppComparisonReady;
 const historicalProfitKnown=hasFieldValue('realAccountingProfitAnnual'),historicalAccountingProfit=num('realAccountingProfitAnnual'),projectionMode=$('profitProjectionMode')?.value||'sensitivity',projectedProfitKnown=hasFieldValue('projectedRealProfitAnnual'),projectedAccountingProfit=num('projectedRealProfitAnnual');
 const useProjected=projectionMode!=='historical'&&projectedProfitKnown,realProfitKnown=useProjected||historicalProfitKnown,accountingProfit=useProjected?projectedAccountingProfit:historicalAccountingProfit,additions=Math.max(0,num('realAdditionsAnnual')),exclusions=Math.max(0,num('realExclusionsAnnual'));
 const irpjLossAvailable=Math.max(0,num('irpjLossCarryforward')),csllLossAvailable=Math.max(0,num('csllNegativeBase')),realTax=realTaxSnapshot(accountingProfit,additions,exclusions,irpjLossAvailable,csllLossAvailable);
 const adjustedBeforeLoss=realTax.adjustedBeforeLoss,irpjLossUsed=realTax.irpjLossUsed,csllLossUsed=realTax.csllLossUsed,realIrpjBase=realTax.irpjBase,realCsllBase=realTax.csllBase;
 const realIrpj=realProfitKnown?realTax.irpj:0,realCsll=realProfitKnown?realTax.csll:0,realTotal=netVat+realIrpj+realCsll+cpp+legacy+fullCompliance,realValid=realProfitKnown&&legacyKnown&&cppComparisonReady;
 const breakEven=realPresumedBreakEven(annualRevenue,irpj+csll,additions,exclusions,irpjLossAvailable,csllLossAvailable),realDecisionSensitive=projectionMode==='sensitivity'&&!projectedProfitKnown&&historicalProfitKnown;
 const sensitivityMargins=breakEven&&Number.isFinite(breakEven.margin)?[Math.max(0,breakEven.margin*.5),Math.max(0,breakEven.margin),Math.max(0,breakEven.margin*1.5)]:[.05,.10,.15];
 const commonRegular=netVat+cpp+legacy+fullCompliance;
 const profitSensitivity=sensitivityMargins.map((margin,index)=>{const profit=annualRevenue*margin,t=realTaxSnapshot(profit,additions,exclusions,irpjLossAvailable,csllLossAvailable),realScenario=commonRegular+t.total,presumedScenario=commonRegular+irpj+csll;return{key:index===0?'below':index===1?'threshold':'above',label:index===0?'Abaixo do ponto':index===1?'Ponto de indiferença':'Acima do ponto',margin,profit,realTax:t.total,realTotal:realScenario,presumedTotal:presumedScenario,winner:Math.abs(realScenario-presumedScenario)<1?'equal':realScenario<presumedScenario?'real':'presumed'}});
 const b2b=clamp(num('b2bPct')/100,0,1),pureClientCredit=simpleComputable?embedded*b2b:0,regularClientCredit=grossVat*b2b,hybridClientCredit=regularClientCredit,extraClientCredit=Math.max(0,hybridClientCredit-pureClientCredit);
 const simpleModelValid=simpleComputable&&simplePayrollValid,simpleMessage=!simpleComputable?'Simples não aplicável.':'Informe a remuneração mensal sujeita à contribuição patronal para calcular a CPP fora do DAS no Anexo IV.';
 const allModels=[
  {key:'pure',name:'Simples Nacional 100%',total:pureTotal,tax:pureTotal,credit:pureClientCredit,compliance:0,valid:simpleModelValid,validationMessage:simpleModelValid?'':simpleMessage},
  {key:'hybrid',name:'Simples híbrido',total:hybridTotal,tax:dasWithout+netVat+annexCpp,credit:hybridClientCredit,compliance:hybridCompliance,valid:simpleModelValid,validationMessage:simpleModelValid?'':simpleMessage},
  {key:'presumed',name:'Lucro Presumido',total:presumedTotal,tax:presumedTotal-fullCompliance,credit:regularClientCredit,compliance:fullCompliance,valid:presumedValid,totalComplete:regularProjectionComplete,validationMessage:presumedValid?'':(!legacyKnown?'Informe a carga efetiva atual de ICMS/ISS para a transição de 2027 a 2032.':'Informe a remuneração mensal sujeita à contribuição patronal para comparar o Simples com os regimes regulares.')},
  {key:'real',name:'Lucro Real',total:realTotal,tax:realTotal-fullCompliance,credit:regularClientCredit,compliance:fullCompliance,valid:realValid,totalComplete:regularProjectionComplete,validationMessage:realValid?'':(!realProfitKnown?'Informe ou importe o lucro contábil antes de IRPJ e CSLL.':!legacyKnown?'Informe a carga efetiva atual de ICMS/ISS para a transição de 2027 a 2032.':'Informe a remuneração mensal sujeita à contribuição patronal para comparar o Simples com os regimes regulares.')}
 ];
 const models=allModels.filter(m=>simpleEligible||!['pure','hybrid'].includes(m.key)),validModels=models.filter(m=>m.valid!==false),taxBest=validModels.length?[...validModels].sort((a,b)=>a.total-b.total)[0]:{key:'pending',name:'Dados insuficientes',total:Infinity,valid:false};
 const b2bSales=annualRevenue*b2b,extraHybridCost=hybridTotal-pureTotal,breakEvenCapture=b2bSales>0?Math.max(0,extraHybridCost)/b2bSales:Infinity,creditCaptureNeeded=extraClientCredit>0?Math.max(0,extraHybridCost)/extraClientCredit:Infinity,capture=clamp(num('capturePct')/100,0,1),adjustedHybrid=hybridTotal-extraClientCredit*capture,commercialBest=simpleEligible&&adjustedHybrid<pureTotal?'hybrid':taxBest.key;
 return{year,annualRevenue,monthlyRevenue,rbt12,annex,sr,share,das,dasCbs,dasIbs,embedded,dasWithout,rr,factor,fullRegularRate,grossRegularRate,grossVat,purchases:acquisitions,acquisitions,reportedAcquisitions,inputCredit,netVat,creditMethod,automotiveCreditProfile,operatingCreditProfile,hybridCompliance,fullCompliance,pureTotal,hybridTotal,presumedTotal,realTotal,presumedBaseIR,presumedBaseCSLL,irpj,csll,cpp,cppBaseKnown,cppBaseMonthly,employerRate,cppRequiredForCrossRegime,cppComparisonReady,regularProjectionComplete,annexCpp,legacy,legacyKnown,realIrpj,realCsll,realProfitKnown,historicalProfitKnown,historicalAccountingProfit,projectedProfitKnown,projectedAccountingProfit,projectionMode,realDecisionSensitive,breakEven,profitSensitivity,accountingProfit,additions,exclusions,adjustedBeforeLoss,realIrpjBase,realCsllBase,irpjLossUsed,csllLossUsed,presumedValid,realValid,pureClientCredit,hybridClientCredit,regularClientCredit,extraClientCredit,b2bSales,extraHybridCost,breakEvenCapture,creditCaptureNeeded,capture,adjustedHybrid,taxBest,commercialBest,simpleEligible,simpleComputable,eligibility,isMei,models,allModels};
}
