/* V3.3 - correcoes estruturais da auditoria contabil-tributaria */
(function(){
 const professionalPattern=/arquitet|urbanis|engenh|agron|advoc|contab|econom|administrador|administra[cç][aã]o|assistente social|bibliotec|bi[oó]log|educa[cç][aã]o f[ií]sica|estat[ií]st|veterin|zootec|muse[oó]log|qu[ií]mic|rela[cç][oõ]es p[uú]blicas|t[eé]cnic[oa] industrial|t[eé]cnic[oa] agr[ií]cola/i;
 function benefitCandidate(cnae,description){const text=`${description||''} ${$('activity')?.value||''}`,code=String(cnae||companyData?.cnae_fiscal||'').replace(/\D/g,'');return professionalPattern.test(text)||code.startsWith('71111')}
 window.professionalBenefitCandidate=benefitCandidate;
 const originalSectorProfile=window.sectorProfile;
 window.sectorProfile=function(cnae,description){const p=originalSectorProfile(cnae,description);if(benefitCandidate(cnae,description)){p.professionalReduction30Candidate=true;p.reason+=`; atividade com potencial redução de 30% do IBS/CBS, sujeita aos requisitos do art. 127 da LC 214/2025`}return p};
 function applyBenefit(profile=sectorSuggestion){
  const wrap=$('professionalReductionWrap'),sel=$('professionalReduction30'),hint=$('professionalReductionHint'),candidate=!!profile?.professionalReduction30Candidate||benefitCandidate(companyData?.cnae_fiscal,companyData?.cnae_fiscal_descricao);
  if(wrap)wrap.hidden=!candidate;if(!candidate)return;
  if(hint)hint.textContent='O CNAE indica potencial redução de 30%. Confirme habilitação profissional e os demais requisitos legais antes de usar o benefício.';
  const state=sel?.value||'review';
  if(state==='yes'){[['mixFull',0],['mix30',100],['mix40',0],['mix60',0],['mixZero',0]].forEach(([id,v])=>numSet(id,v));$('mixHint').textContent='Redução de 30% aplicada como premissa confirmada. Ajuste a composição se houver receitas com tratamentos diferentes.'}
  else if(state==='no'){[['mixFull',100],['mix30',0],['mix40',0],['mix60',0],['mixZero',0]].forEach(([id,v])=>numSet(id,v));$('mixHint').textContent='Redução profissional não aplicada. Revise o cClassTrib das operações reais.'}
  else $('mixHint').textContent='O CNAE indica potencial redução de 30% do art. 127. Confirme os requisitos antes de gerar o diagnóstico.';
  revenueRateFactor();
 }
 window.applyProfessionalReductionState=applyBenefit;
 const originalApplySectorProfile=window.applySectorProfile;
 window.applySectorProfile=function(profile=sectorSuggestion){originalApplySectorProfile(profile);applyBenefit(profile)};
 const originalValidate=window.validateDiagnosisInputs;
 if(typeof originalValidate==='function')window.validateDiagnosisInputs=function(){const errors=originalValidate();const candidate=!!sectorSuggestion?.professionalReduction30Candidate||benefitCandidate(companyData?.cnae_fiscal,companyData?.cnae_fiscal_descricao);if(candidate&&$('professionalReduction30')?.value==='review')errors.push('Confirme se a redução de 30% do IBS/CBS para profissão regulamentada é aplicável. O CNAE sozinho não comprova os requisitos do art. 127 da LC 214/2025.');return errors};

 window.financialMetrics=function(){
  const cash=Math.max(0,num('cashAndEquivalents')),liquid=Math.max(0,num('liquidInvestments')),reserve=cash+liquid,ac=Math.max(0,num('currentAssets')),pc=Math.max(0,num('currentLiabilities')),ccl=ac-pc,start=Math.max(0,num('debtStart')),end=Math.max(0,num('debtEnd')),avg=start>0&&end>0?(start+end)/2:(end>0?end:start),interest=Math.max(0,num('interestExpense')),months=clamp(num('dreMonths')||12,1,12),annualRate=avg>0&&interest>0?(interest/avg)*(12/months):null;
  if($('cashReserve'))$('cashReserve').value=Math.round(reserve*100)/100;if($('workingCapitalNet'))$('workingCapitalNet').value=Math.round(ccl*100)/100;if($('debtAverage'))$('debtAverage').value=Math.round(avg*100)/100;
  const mode=$('financeRateMode')?.value||'auto';
  if(mode==='auto'&&annualRate!=null&&Number.isFinite(annualRate)){$('financeRate').value=Math.round(annualRate*10000)/100;if(typeof markFieldDerived==='function')markFieldDerived('financeRate','CALCULADO');$('financeRateSource').textContent=`Juros e encargos divididos pela dívida financeira média, anualizados para ${months} mês${months===1?'':'es'} de DRE.`}
  else if(mode==='auto'){if($('financeRate'))$('financeRate').value='';$('financeRateSource').textContent=avg<=0?'Não aplicável automaticamente: não há dívida financeira informada. Para simular novo financiamento, selecione premissa manual.':'Não calculado: informe juros e encargos da dívida ou selecione premissa manual.'}
  else $('financeRateSource').textContent='Premissa manual para custo de financiamento atual ou futuro.';
  if(typeof markFieldDerived==='function'){markFieldDerived('cashReserve','CALCULADO');markFieldDerived('workingCapitalNet','CALCULADO');markFieldDerived('debtAverage','CALCULADO')}
  return{cash,liquid,reserve,ac,pc,ccl,start,end,avg,interest,months,annualRate};
 };

 window.patchAuditImportAnalyzer=function(){
  const original=window.analyseImportDoc;if(typeof original!=='function'||original.__auditPatched)return;
  const wrapped=function(file,parsed){
   const out=original(file,parsed);out.candidates=(out.candidates||[]).filter(x=>x.field!=='realProfitMargin');const text=parsed.text,type=detectDoc(text,parsed.rows);
   const pretax=firstLineValue(text,[['lucro antes do irpj e csll'],['resultado antes do irpj e csll'],['lucro antes do imposto de renda'],['resultado antes dos tributos sobre o lucro']]);
   if(pretax!=null&&type==='DRE')out.candidates.push(candidate('realAccountingProfitAnnual','Lucro contábil antes de IRPJ e CSLL',pretax,file.name,'high','Resultado contábil antes dos tributos sobre o lucro localizado na DRE.',fmtMoney(pretax)));
   const salaries=lineValue(text,['salarios','ordenados'],['encargos']),prolabore=lineValue(text,['pro labore','pro-labore']),remuneration=(salaries||0)+(prolabore||0);
   if(remuneration>0&&type==='DRE')out.candidates.push(candidate('monthlyCppBase','Remunerações mensais sujeitas à contribuição patronal',remuneration/12,file.name,'medium','Salários e pró-labore identificados sem somar contas genéricas de encargos. Confirme incidências e periodicidade.',fmtMoney(remuneration/12)));
   return out;
  };wrapped.__auditPatched=true;window.analyseImportDoc=wrapped;
 };
 window.patchAuditImportAnalyzer();
 $('professionalReduction30')?.addEventListener('change',()=>{applyBenefit(sectorSuggestion);if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('professional-reduction')});
 if($('professionalReductionWrap'))$('professionalReductionWrap').hidden=true;
})();
