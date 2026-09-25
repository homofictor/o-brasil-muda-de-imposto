/* V3.2 - impacto economico em preco, margem e resultado */
(function(root){
 function clampLocal(value,min,max){return Math.max(min,Math.min(max,Number(value)||0))}

 function calculateEconomicImpact(values){
  const revenue=Math.max(0,Number(values.annualRevenue)||0);
  const operatingRevenue=Math.max(0,Number(values.currentOperatingRevenue)||revenue);
  const currentTax=Math.max(0,Number(values.currentConsumptionTax)||0);
  const futureTax=Math.max(0,Number(values.futureConsumptionTax)||0);
  const transferRate=clampLocal(values.priceTransferRate,0,1);
  const currentMargin=Number.isFinite(Number(values.currentOperatingMargin))?Number(values.currentOperatingMargin):null;
  const financeCost=Math.max(0,Number(values.financeCost)||0);
  const taxDelta=futureTax-currentTax;
  const priceChange=taxDelta*transferRate;
  const adjustedRevenue=Math.max(0,revenue+priceChange);
  const unabsorbedDelta=taxDelta-priceChange;
  const requiredPriceRate=revenue>0?taxDelta/revenue:null;
  const currentOperatingResult=currentMargin==null?null:operatingRevenue*currentMargin;
  const projectedOperatingResult=currentOperatingResult==null?null:currentOperatingResult-unabsorbedDelta;
  const adjustedOperatingRevenue=Math.max(0,operatingRevenue+priceChange);
  const projectedOperatingMargin=projectedOperatingResult==null||adjustedOperatingRevenue<=0?null:projectedOperatingResult/adjustedOperatingRevenue;
  const resultEffectRaw=-unabsorbedDelta-financeCost,resultEffect=Object.is(resultEffectRaw,-0)?0:resultEffectRaw;
  return{revenue,operatingRevenue,currentTax,futureTax,taxDelta,transferRate,priceChange,adjustedRevenue,adjustedOperatingRevenue,unabsorbedDelta,requiredPriceRate,currentMargin,currentOperatingResult,projectedOperatingResult,projectedOperatingMargin,financeCost,resultEffect};
 }

 const currentDasShares={
  I:{federal:[.155,.155,.155,.155,.155,.344],local:[.34,.34,.335,.335,.335,0],ipi:[0,0,0,0,0,0]},
  II:{federal:[.14,.14,.14,.14,.14,.255],local:[.32,.32,.32,.32,.32,0],ipi:[.075,.075,.075,.075,.075,.35]},
  III:{federal:[.156,.171,.166,.166,.156,.195],local:[.335,.32,.325,.325,.335,0],ipi:[0,0,0,0,0,0]},
  IV:{federal:[.215,.25,.24,.23,.22,.25],local:[.445,.40,.40,.40,.40,0],ipi:[0,0,0,0,0,0]},
  V:{federal:[.1715,.1715,.1815,.1915,.1715,.20],local:[.14,.17,.19,.21,.235,0],ipi:[0,0,0,0,0,0]}
 };

 function simpleCurrentConsumptionTax(r){
  if(!r?.simpleEligible||!r.annex||r.rbt12<=0)return null;
  const table=root.annexBands?.[r.annex]||annexBands?.[r.annex];
  if(!table)return null;
  let idx=table.findIndex(row=>r.rbt12<=row[0]);if(idx<0)idx=table.length-1;
  const nominal=table[idx][1],deduction=table[idx][2],effective=Math.max(0,(r.rbt12*nominal-deduction)/r.rbt12),das=r.annualRevenue*effective;
  if(r.annex==='III'&&idx===4&&effective>.1492537)return r.annualRevenue*.05+r.annualRevenue*Math.max(0,effective-.05)*.2346;
  if(r.annex==='IV'&&idx===4&&effective>.125)return r.annualRevenue*.05+r.annualRevenue*Math.max(0,effective-.05)*.3667;
  const shares=currentDasShares[r.annex]||currentDasShares.I;
  return das*((shares.federal[idx]||0)+(shares.local[idx]||0)+(shares.ipi[idx]||0));
 }

 function simpleLegacyConsumption(r){
  if(!r?.simpleEligible||r.year>=2033)return 0;
  const shares=root.splitShares?.[r.annex]||splitShares?.[r.annex];
  if(!shares)return 0;
  const replacement=((shares.cbs33?.[r.sr.idx]||0)+(shares.ibs33?.[r.sr.idx]||0))/100;
  return Math.max(0,r.das*replacement-r.embedded);
 }

 function modelConsumptionTax(r,modelKey){
  if(!r)return null;
  if(modelKey==='pure')return r.embedded+simpleLegacyConsumption(r);
  if(modelKey==='hybrid')return r.netVat+simpleLegacyConsumption(r);
  if(modelKey==='presumed'||modelKey==='real')return r.netVat+r.legacy;
  return null;
 }

 function fieldNumber(id){const node=document.getElementById(id);if(!node)return 0;return typeof root.parseMoneyValue==='function'?root.parseMoneyValue(node.value):Number(node.value||0)}
 function hasField(id){const node=document.getElementById(id);return !!node&&String(node.value).trim()!==''}
 function money(value){return Number.isFinite(value)?brl2.format(value):'—'}
 function percent(value){return Number.isFinite(value)?pct1(value):'—'}
 function setText(id,value){const node=document.getElementById(id);if(node)node.textContent=value==null?'—':String(value)}

 function fieldConfidence(id){
  const node=document.getElementById(id);if(!node||String(node.value||'').trim()==='')return'unknown';
  if(node.dataset?.userEdited==='1')return'high';
  if(node.dataset?.importVerified==='1')return node.dataset.importConfidence==='low'?'low':node.dataset.importConfidence==='medium'?'medium':'high';
  const box=node.closest?.('.field,.mix');
  if(box?.classList.contains('state-auto')||box?.classList.contains('state-suggested')||box?.classList.contains('state-premise'))return'medium';
  if(box?.classList.contains('state-complete'))return'high';
  return'medium';
 }
 function minConfidence(list){
  const score={low:0,unknown:0,medium:1,high:2},known=list.filter(Boolean);if(!known.length)return'unknown';
  return known.reduce((a,b)=>(score[b]??0)<(score[a]??0)?b:a,'high');
 }
 function futureConsumptionConfidence(){
  const values=['purchasesPct','eligibleCreditPct','regularSuppliersPct','fullCbs','fullIbs'].map(fieldConfidence);
  if(String(document.getElementById('taxTreatmentAccepted')?.value||'')!=='yes')values.push('low');
  const usedVehicles=root.brmiImport?.docs?.some(d=>d?.usedVehiclesMention===true);
  if(usedVehicles)values.push('low');
  return minConfidence(values);
 }
 function setConfidenceNote(id,confidence){
  const node=document.getElementById(id);if(!node)return;
  if(confidence==='low'){
   node.hidden=false;node.className='economicConfidenceNote low';
   const usedVehicles=root.brmiImport?.docs?.some(d=>d?.usedVehiclesMention===true);
   node.innerHTML=usedVehicles
    ?'<strong>Estimativa preliminar para revenda de veículos</strong><span>Foram identificados veículos seminovos. O simulador considera o potencial de crédito vinculado ao custo de aquisição para evitar tributar economicamente toda a revenda como valor agregado, mas a origem dos veículos, a documentação e a composição real das compras precisam ser confirmadas.</span>'
    :'<strong>Estimativa preliminar</strong><span>Uma ou mais premissas críticas foram extraídas com baixa confiança. Os valores de preço, margem e resultado abaixo são indicativos e devem ser confirmados antes de qualquer decisão.</span>';
  }else if(confidence==='medium'){
   node.hidden=false;node.className='economicConfidenceNote medium';
   node.innerHTML='<strong>Estimativa de cenário</strong><span>Os valores dependem de premissas automáticas ou parâmetros de referência ainda sujeitos a validação.</span>';
  }else{node.hidden=true;node.textContent=''}
 }
 function currentOperatingRevenueBase(r){
  const docs=root.brmiImport?.docs||[],dre=docs.find(d=>(d.type==='DRE'||d.type==='Balanço + DRE')&&Number(d.revenueNet)>0);
  if(!dre)return r?.annualRevenue||0;
  const months=Math.max(1,Math.min(12,fieldNumber('dreMonths')||12));
  return Number(dre.revenueNet)*(12/months);
 }

 function economicImpactFor(r,model){
  const mode=document.getElementById('currentConsumptionMode')?.value||'auto';
  const automatic=simpleCurrentConsumptionTax(r);
  const input=document.getElementById('currentConsumptionTaxAnnual');
  const manual=hasField('currentConsumptionTaxAnnual')?Math.max(0,fieldNumber('currentConsumptionTaxAnnual')):null;
  const currentTax=mode==='auto'?automatic:manual;
  const currentTaxConfidence=mode==='auto'?(automatic==null?'unknown':'medium'):fieldConfidence('currentConsumptionTaxAnnual');
  const futureTaxConfidence=futureConsumptionConfidence(),confidence=minConfidence([currentTaxConfidence,futureTaxConfidence]);
  const source=document.getElementById('currentConsumptionTaxSource');
  if(input){input.readOnly=mode==='auto';if(mode==='auto')input.value=automatic==null?'':Math.round(automatic*100)/100}
  if(source){
   if(mode==='auto'&&automatic!=null)source.textContent='Calculado pela parcela estimada dos tributos sobre consumo no DAS atual. Revise a opção contábil se possuir DRE ou valor efetivo.';
   else if(mode==='auto')source.textContent='Sem base automática disponível. Importe a DRE ou use a informação contábil para calcular a situação atual.';
   else if(input?.dataset?.sourceNote)source.textContent='Calculado a partir da DRE importada. '+input.dataset.sourceNote;
   else source.textContent='Informe PIS/Cofins, ICMS, ISS e IPI líquidos de créditos, conforme aplicável, usando a mesma base anual.';
  }
  const futureTax=modelConsumptionTax(r,model?.key);
  const margin=hasField('currentOperatingMarginPct')?fieldNumber('currentOperatingMarginPct')/100:null;
  let financeCost=0,financeCostKnown=true;try{const cm=root.cashMetrics?root.cashMetrics(r):cashMetrics(r);if(cm?.cost==null){financeCostKnown=false;financeCost=0}else financeCost=cm.cost}catch(_){financeCostKnown=false;financeCost=0}
  if(currentTax==null||futureTax==null)return{known:false,currentTax,futureTax,modelKey:model?.key||null,financeCostKnown,currentTaxConfidence,futureTaxConfidence,confidence};
  return{known:true,modelKey:model.key,financeCostKnown,currentTaxConfidence,futureTaxConfidence,confidence,...calculateEconomicImpact({annualRevenue:r.annualRevenue,currentOperatingRevenue:currentOperatingRevenueBase(r),currentConsumptionTax:currentTax,futureConsumptionTax:futureTax,priceTransferRate:fieldNumber('priceTransferPct')/100,currentOperatingMargin:margin,financeCost})};
 }

 function impactTone(impact){if(!impact?.known)return'pending';if(impact.resultEffect>1)return'positive';if(impact.resultEffect<-1)return'negative';return'neutral'}
 function deltaLabel(value){if(!Number.isFinite(value))return'—';if(value>0)return`Aumento de ${money(value)}`;if(value<0)return`Redução de ${money(Math.abs(value))}`;return'Sem variação estimada'}
 function resultLabel(value){if(!Number.isFinite(value))return'—';if(value>0)return`Ganho de ${money(value)}`;if(value<0)return`Perda de ${money(Math.abs(value))}`;return'Efeito neutro'}

 function renderEconomicImpact(r){
  const valid=(r?.models||[]).filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total),model=valid[0],impact=economicImpactFor(r,model);
  root.lastEconomicImpact=impact;
  const pending='Informe a carga atual líquida dos tributos sobre consumo para comparar preço, margem e resultado.';
  setConfidenceNote('economicConfidenceNote',impact.confidence);setConfidenceNote('execEconomicConfidenceNote',impact.confidence);
  const transferLabel='Efeito no resultado com repasse de '+percent(impact.transferRate);
  setText('techResultEffectLabel',transferLabel);setText('execResultEffectLabel',transferLabel);
  if(!impact.known){
   ['execCurrentConsumptionTax','execFutureConsumptionTax','execTaxDelta','execRequiredPrice','execProjectedMargin','execResultEffect','techCurrentConsumptionTax','techFutureConsumptionTax','techTaxDelta','techPriceTransfer','techUnabsorbedDelta','techFinanceEffect','techResultEffect'].forEach(id=>setText(id,'—'));
   setText('economicImpactStatus','Comparação pendente');setText('economicImpactText',pending);setText('technicalEconomicText',pending);
   const card=document.getElementById('economicImpactCard');if(card)card.dataset.tone='pending';return impact;
  }
  setText('execCurrentConsumptionTax',money(impact.currentTax));setText('execFutureConsumptionTax',money(impact.futureTax));setText('execTaxDelta',deltaLabel(impact.taxDelta));
  setText('execRequiredPrice',impact.requiredPriceRate==null?'—':`${impact.requiredPriceRate>=0?'+':''}${percent(impact.requiredPriceRate)}`);
  setText('execProjectedMargin',impact.projectedOperatingMargin==null?'Informe a margem atual':percent(impact.projectedOperatingMargin));setText('execResultEffect',impact.financeCostKnown?resultLabel(impact.resultEffect):'Parcial · '+resultLabel(impact.resultEffect)+' antes do custo financeiro');
  setText('execEconomicModel',model.name);setText('execEconomicYear',r.year);setText('techProjectedMargin',impact.projectedOperatingMargin==null?'Informe a margem atual':percent(impact.projectedOperatingMargin));
  setText('economicImpactStatus',impact.taxDelta>1?'Pressão sobre a margem':impact.taxDelta<-1?'Potencial de ganho':'Impacto tributário neutro');
  const transfer=percent(impact.transferRate),direction=impact.taxDelta>=0?'acréscimo':'redução';
  const confidencePrefix=impact.confidence==='low'?'Estimativa preliminar. ':impact.confidence==='medium'?'Estimativa de cenário. ':'';
  const fullTransferNote=impact.transferRate>=.999?' Se o mercado não aceitar o repasse integral, parte da variação tributária será absorvida pela margem.':'';
  setText('economicImpactText',confidencePrefix+(impact.financeCostKnown?`O cenário transfere ${transfer} da variação tributária ao preço. O ${direction} anual de preço estimado é ${money(Math.abs(impact.priceChange))}. Após o efeito tributário não transferido e o custo financeiro estimado, o impacto no resultado é ${resultLabel(impact.resultEffect).toLowerCase()}.${fullTransferNote}`:`O cenário transfere ${transfer} da variação tributária ao preço. O ${direction} anual de preço estimado é ${money(Math.abs(impact.priceChange))}. O efeito no resultado antes do custo financeiro é ${resultLabel(impact.resultEffect).toLowerCase()}; informe reserva e taxa financeira para completar a análise.${fullTransferNote}`));
  setText('techCurrentConsumptionTax',money(impact.currentTax));setText('techFutureConsumptionTax',money(impact.futureTax));setText('techTaxDelta',deltaLabel(impact.taxDelta));setText('techPriceTransfer',money(impact.priceChange));setText('techUnabsorbedDelta',money(impact.unabsorbedDelta));setText('techFinanceEffect',impact.financeCostKnown?money(impact.financeCost):'Não calculado');setText('techResultEffect',impact.financeCostKnown?resultLabel(impact.resultEffect):'Parcial · antes do custo financeiro');
  const modelPhrase=((model.key==='real'||model.key==='presumed')&&!model.totalComplete)?'como menor base comparável':'como modelo de menor desembolso validado';
  const automotiveNote=r.creditMethod==='automotive-dre-proxy'
   ?' Para o perfil automotivo identificado na DRE, o crédito futuro usa os custos históricos de veículos novos e seminovos como proxy da base de aquisição, considera peças e serviços separadamente e mantém o resultado como preliminar. A origem dos seminovos e os documentos fiscais devem ser confirmados. A carga atual extraída da DRE também pode não refletir integralmente tributos concentrados anteriormente na cadeia.'
   :'';
  const operatingCreditNote=r.operatingCreditProfile?.annualAmount>0
   ?` A base de aquisições incorpora aproximadamente ${money(r.operatingCreditProfile.annualAmount)} de despesas operacionais de terceiros explicitamente identificadas na DRE com potencial de crédito. O cálculo é conservador: folha, benefícios, depreciação/amortização, despesas financeiras, tributos, seguros e rubricas genéricas permanecem fora até confirmação documental.`
   :'';
  setText('technicalEconomicText',confidencePrefix+`A comparação usa ${model.name} ${modelPhrase} em ${r.year}. A carga de consumo futura considera IBS/CBS e ICMS/ISS residual aplicável. A margem EBITDA usa a receita líquida da DRE quando disponível, enquanto a base tributária usa o faturamento bruto confirmado.`+automotiveNote+operatingCreditNote+fullTransferNote);
  const card=document.getElementById('economicImpactCard');if(card)card.dataset.tone=impactTone(impact);
  return impact;
 }

 root.calculateEconomicImpact=calculateEconomicImpact;
 root.economicImpactFor=economicImpactFor;
 root.renderEconomicImpact=renderEconomicImpact;
 const modeField=typeof document!=='undefined'?document.getElementById('currentConsumptionMode'):null;
 const taxField=typeof document!=='undefined'?document.getElementById('currentConsumptionTaxAnnual'):null;
 function syncEconomicInputMode(){
  if(!modeField||!taxField)return;taxField.readOnly=modeField.value==='auto';
  if(modeField.value==='manual'&&document.getElementById('currentConsumptionTaxSource'))document.getElementById('currentConsumptionTaxSource').textContent=taxField?.dataset?.sourceNote?'Calculado a partir da DRE importada. '+taxField.dataset.sourceNote:'Informe a carga líquida anual de PIS/Cofins, ICMS, ISS e IPI, conforme aplicável.';
 }
 modeField?.addEventListener('change',syncEconomicInputMode);syncEconomicInputMode();
  if(typeof module!=='undefined'&&module.exports)module.exports={calculateEconomicImpact};
})(typeof window!=='undefined'?window:globalThis);
