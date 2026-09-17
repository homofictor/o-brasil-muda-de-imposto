/* V3.2 - correcoes estruturais da auditoria contabil-tributaria */
(function(){
 const professionalPattern=/arquitet|urbanis|engenh|agron|advoc|contab|econom|assistente social|bibliotec|bi[oó]log|educa[cç][aã]o f[ií]sica|estat[ií]st|veterin|zootec|muse[oó]log|qu[ií]mic|rela[cç][oõ]es p[uú]blicas|t[eé]cnic[oa] industrial|t[eé]cnic[oa] agr[ií]cola|\badministrador(?:es|a|as)?\b/i;
 const mandatoryRealPattern=/\bbanco\b|banco comercial|banco de investimento|banco de desenvolvimento|sociedade de cr[eé]dito|financiamento e investimento|cr[eé]dito imobili[aá]rio|corretora de t[ií]tulos|arrendamento mercantil|cooperativa de cr[eé]dito|seguro privado|capitaliza[cç][aã]o|previd[eê]ncia privada aberta|\bfactoring\b|securitiza[cç][aã]o/i;
 function companyText(){return `${companyData?.cnae_fiscal_descricao||''} ${$('activity')?.value||''}`.toLowerCase()}
 function benefitCandidate(cnae,description){const text=`${description||''} ${$('activity')?.value||''}`,code=String(cnae||companyData?.cnae_fiscal||'').replace(/\D/g,'');return professionalPattern.test(text)||code.startsWith('71111')}
 window.professionalBenefitCandidate=benefitCandidate;

 function acquisitionShare(cnae,description){
  const code=String(cnae||'').replace(/\D/g,'').padStart(7,'0'),div=Number(code.slice(0,2)),text=(description||'').toLowerCase();
  if(div>=10&&div<=33)return 55;
  if(div===46)return 70;
  if(div===47)return 65;
  if(div===45)return 50;
  if(div>=41&&div<=43)return 40;
  if(div===55||div===56)return 35;
  if(div===85)return 20;
  if(div===86||/hospital|medic|odont|clinica|clínica|saude|saúde/.test(text))return 18;
  if(/software|tecnologia|consult|contab|auditor|engenh|arquitet|advoc|econom|administra/.test(text))return 15;
  if(div>=49&&div<=82)return 25;
  if(div>=87&&div<=96)return 20;
  return 20;
 }

 const originalSectorProfile=window.sectorProfile;
 window.sectorProfile=function(cnae,description){
  const p=originalSectorProfile(cnae,description);
  p.purchasePct=acquisitionShare(cnae,description);
  if(benefitCandidate(cnae,description)){p.professionalReduction30Candidate=true;p.reason+=`; atividade com potencial redução de 30% do IBS/CBS, sujeita aos requisitos do art. 127 da LC 214/2025`}
  return p;
 };

 function ensurePresumedFields(){
  if($('presumedIrpjPct'))return;
  const anchor=$('monthlyCppBase')?.closest('.grid4');if(!anchor)return;
  const row=document.createElement('div');row.className='grid4';row.id='presumedAuditFields';
  row.innerHTML=`<label class="field"><span>Percentual de presunção do IRPJ</span><div class="suffix"><input id="presumedIrpjPct" type="number" min="0" max="100" step="0.1" value="32"><i>%</i></div><small id="presumedIrpjHint">Sugestão automática pela atividade. Revise quando houver regra específica.</small></label><label class="field"><span>Percentual de presunção da CSLL</span><div class="suffix"><input id="presumedCsllPct" type="number" min="0" max="100" step="0.1" value="32"><i>%</i></div><small id="presumedCsllHint">Sugestão automática pela atividade. Serviços em geral usam 32%, com exceções legais.</small></label><div class="field"><span>Regra para receitas acima de R$ 5 milhões</span><div class="status">O motor aplica acréscimo de 10% aos percentuais de presunção somente sobre a parcela da receita que exceder R$ 5 milhões no ano, conforme a regra vigente desde 2026.</div></div><div class="field"><span>Elegibilidade ao Lucro Presumido</span><div class="status" id="presumedEligibilityHint">O motor verifica o limite de R$ 78 milhões e indícios de atividades legalmente obrigadas ao Lucro Real.</div></div>`;
  anchor.insertAdjacentElement('afterend',row);
 }
 ensurePresumedFields();

 function inferPresumedProfile(){
  const text=companyText(),kind=currentKind();
  if(/transporte.{0,20}(carga|cargas)|carga.{0,20}transporte/.test(text))return{irpj:8,csll:12,confidence:'alta',reason:'transporte de cargas'};
  if(/transporte/.test(text))return{irpj:16,csll:12,confidence:'média',reason:'serviço de transporte; confirme se é carga ou passageiros'};
  if(/hospital|aux[ií]lio diagn[oó]stico|terapia|patologia|imagenologia|radiologia|medicina nuclear|an[aá]lises cl[ií]nicas/.test(text))return{irpj:32,csll:32,confidence:'baixa',reason:'serviço de saúde; percentuais reduzidos de 8% e 12% dependem de requisitos específicos, por isso não são aplicados automaticamente'};
  if(kind==='commerce'||kind==='industry')return{irpj:8,csll:12,confidence:'alta',reason:'atividade comercial ou industrial'};
  return{irpj:32,csll:32,confidence:'média',reason:'prestação de serviços em geral'};
 }
 function applyPresumedSuggestion(force=false){
  ensurePresumedFields();const p=inferPresumedProfile(),ir=$('presumedIrpjPct'),cs=$('presumedCsllPct');
  if(ir&&(force||ir.dataset.autoSuggested!=='0')){ir.value=p.irpj;ir.dataset.autoSuggested='1';if(typeof markFieldAuto==='function')markFieldAuto('presumedIrpjPct','SUGERIDO')}
  if(cs&&(force||cs.dataset.autoSuggested!=='0')){cs.value=p.csll;cs.dataset.autoSuggested='1';if(typeof markFieldAuto==='function')markFieldAuto('presumedCsllPct','SUGERIDO')}
  if($('presumedIrpjHint'))$('presumedIrpjHint').textContent=`Sugestão pela atividade: ${p.reason}. Confiança ${p.confidence}.`;
  if($('presumedCsllHint'))$('presumedCsllHint').textContent=`Sugestão pela atividade: ${p.reason}. Confiança ${p.confidence}.`;
  const barred=mandatoryRealPattern.test(companyText()),over=Number(num('rbt12'))>78000000,h=$('presumedEligibilityHint');
  if(h)h.textContent=barred?'Há indício de atividade legalmente obrigada ao Lucro Real. O Lucro Presumido será retirado do ranking até revisão.':over?'O RBT12 informado supera R$ 78 milhões. O Lucro Presumido será retirado do ranking prospectivo.':'Sem impedimento automático identificado pelo motor. A elegibilidade legal ainda deve ser confirmada.';
 }
 ['presumedIrpjPct','presumedCsllPct'].forEach(id=>$(id)?.addEventListener('input',()=>{$(id).dataset.autoSuggested='0'}));
 $('activity')?.addEventListener('change',()=>applyPresumedSuggestion(false));
 window.migrationDefaults=function(){
  const p=inferPresumedProfile(),ir=hasFieldValue('presumedIrpjPct')?clamp(num('presumedIrpjPct')/100,0,1):p.irpj/100,cs=hasFieldValue('presumedCsllPct')?clamp(num('presumedCsllPct')/100,0,1):p.csll/100;
  return{irpjPres:ir,csllPres:cs};
 };

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
 window.applySectorProfile=function(profile=sectorSuggestion){
  originalApplySectorProfile(profile);applyBenefit(profile);applyPresumedSuggestion(true);
  const el=$('purchasesPct');if(el&&profile?.purchasePct!=null){const state=fieldStateContainer?.('purchasesPct');const userConfirmed=state?.classList.contains('state-complete')&&!state?.classList.contains('state-auto');if(!userConfirmed){el.value=profile.purchasePct;if(typeof markFieldAuto==='function')markFieldAuto('purchasesPct','SUGERIDO');const s=el.closest('.field')?.querySelector('small');if(s)s.textContent=`Estimativa setorial inicial de ${profile.purchasePct}% do faturamento em aquisições e despesas tributadas. Substitua pelo valor da DRE ou dos relatórios de compras quando disponível.`}}
 };
 applyPresumedSuggestion(false);

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
   const out=original(file,parsed);out.candidates=(out.candidates||[]).filter(x=>x&&x.field!=='realProfitMargin');const text=parsed.text,type=detectDoc(text,parsed.rows),dreDoc=type==='DRE'||type==='Balanço + DRE',months=clamp(num('dreMonths')||12,1,12),sections=typeof importStatementSections==='function'?importStatementSections(text):{dre:text},dreText=sections.dre||text;
   let pretax=firstLineValue(dreText,[['lucro antes do irpj e csll'],['resultado antes do irpj e csll'],['lucro antes do imposto de renda'],['resultado antes dos tributos sobre o lucro']]),pretaxReason='Resultado antes dos tributos sobre o lucro localizado na DRE.';
   if(pretax==null&&dreDoc){const netResult=lineValue(dreText,['resultado do exercicio','resultado exercicio','lucro liquido','resultado liquido']),taxProvision=lineValue(dreText,['provisao de irpj e csll','provisao para irpj e csll']);if(netResult!=null&&taxProvision!=null){pretax=netResult+Math.abs(taxProvision);pretaxReason='Resultado do exercício somado à provisão de IRPJ e CSLL identificada na DRE.'}}
   if(pretax!=null&&dreDoc){const annualPretax=pretax*(12/months);out.candidates.push(candidate('realAccountingProfitAnnual','Lucro contábil anual antes de IRPJ e CSLL',annualPretax,file.name,'medium',`${pretaxReason} Valor anualizado a partir de ${months} ${months===1?'mês':'meses'}; revise antes de usar no cenário pro forma.`,fmtMoney(annualPretax)))}
   const revenue=firstLineValue(dreText,[['receita bruta','receita operacional bruta','faturamento bruto','faturamento total'],['receita de vendas','receita de servicos','receita de serviços']]);
   const ebitda=firstLineValue(dreText,[['ebitda'],['lajida']]);
   if(revenue>0&&ebitda!=null&&dreDoc)out.candidates.push(candidate('currentOperatingMarginPct','Margem operacional atual',100*ebitda/revenue,file.name,'high','EBITDA ou LAJIDA dividido pela receita bruta identificada na DRE. Confirme se a demonstração usa a mesma definição do cenário.',fmtPct(100*ebitda/revenue)));
   const consumptionTaxes=firstLineValue(dreText,[['impostos incidentes sobre vendas'],['tributos incidentes sobre vendas'],['impostos sobre vendas e servicos'],['impostos sobre vendas e serviços']]);
   if(consumptionTaxes!=null&&dreDoc){const annualTaxes=Math.abs(consumptionTaxes)*(12/months);out.candidates.push(candidate('currentConsumptionTaxAnnual','Carga atual líquida de tributos sobre consumo',annualTaxes,file.name,'medium',`Tributos sobre vendas identificados na DRE e anualizados a partir de ${months} ${months===1?'mês':'meses'}. Confirme se incluem somente PIS/Cofins, ICMS, ISS e IPI, líquidos dos créditos aplicáveis.`,fmtMoney(annualTaxes)))}
   const salaries=lineValue(dreText,['salarios','ordenados'],['encargos']),prolabore=lineValue(dreText,['pro labore','pro-labore']),remuneration=(salaries||0)+(prolabore||0);
   if(remuneration>0&&dreDoc)out.candidates.push(candidate('monthlyCppBase','Remunerações mensais sujeitas à contribuição patronal',remuneration/months,file.name,'medium','Salários e pró-labore identificados sem somar contas genéricas de encargos. Confirme incidências e periodicidade.',fmtMoney(remuneration/months)));
   return out;
  };wrapped.__auditPatched=true;window.analyseImportDoc=wrapped;
 };
 window.patchAuditImportAnalyzer();

 const originalModelForYear=window.modelForYear;
 window.modelForYear=function(year){
  const r=originalModelForYear(year),pres=window.migrationDefaults(),normal=Math.min(r.annualRevenue,5000000),excess=Math.max(0,r.annualRevenue-5000000),baseIR=normal*pres.irpjPres+excess*pres.irpjPres*1.10,baseCS=normal*pres.csllPres+excess*pres.csllPres*1.10;
  const irpj=baseIR*.15+Math.max(0,baseIR-240000)*.10,csll=baseCS*.09,barred=mandatoryRealPattern.test(companyText()),over78=r.rbt12>78000000,presumedValid=r.cppBaseKnown&&!barred&&!over78,presumedTotal=r.netVat+irpj+csll+r.cpp+r.legacy+r.fullCompliance;
  r.irpj=irpj;r.csll=csll;r.presumedBaseIR=baseIR;r.presumedBaseCSLL=baseCS;r.presumedValid=presumedValid;r.presumedTotal=presumedTotal;r.presumedBarred=barred;r.presumedOverLimit=over78;
  const m=r.allModels.find(x=>x.key==='presumed');if(m){m.total=presumedTotal;m.tax=presumedTotal-r.fullCompliance;m.valid=presumedValid;m.validationMessage=!r.cppBaseKnown?'Informe a remuneração mensal sujeita à contribuição patronal.':barred?'Há indício de atividade legalmente obrigada ao Lucro Real.':over78?'RBT12 acima de R$ 78 milhões: Lucro Presumido não considerado elegível para a análise prospectiva.':''}
  const valid=r.models.filter(x=>x.valid!==false&&Number.isFinite(x.total));r.taxBest=valid.length?[...valid].sort((a,b)=>a.total-b.total)[0]:{key:'pending',name:'Dados insuficientes',total:Infinity,valid:false};
  return r;
 };

 $('professionalReduction30')?.addEventListener('change',()=>{applyBenefit(sectorSuggestion);if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('professional-reduction')});
 if($('professionalReductionWrap'))$('professionalReductionWrap').hidden=true;
})();
