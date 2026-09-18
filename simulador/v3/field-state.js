const fieldStateIds=['activity','simpleStatus','meiStatus','annex','monthlyRevenue','rbt12','monthlyPayroll','factorMode','b2bPct','purchasesPct','eligibleCreditPct','regularSuppliersPct','professionalReduction30','mixFull','mix30','mix40','mix60','mixZero','fullCbs','fullIbs','monthlyCppBase','employerRatePct','presumedIrpjPct','presumedCsllPct','realAccountingProfitAnnual','cashAndEquivalents','liquidInvestments','cashReserve','currentAssets','currentLiabilities','workingCapitalNet','interestExpense','debtStart','debtEnd','debtAverage','dreMonths','financeRateMode','financeRate','splitPct','floatDays','refundDays','capturePct','hybridCompliance','fullCompliance','legacyRate','realAdditionsAnnual','realExclusionsAnnual','irpjLossCarryforward','csllNegativeBase','currentConsumptionMode','currentConsumptionTaxAnnual','currentOperatingMarginPct','priceTransferPct'];

function fieldStateContainer(id){
 const el=$(id);return el?.closest('.field,.mix')||null;
}
function fieldStateBadge(container){
 if(!container)return null;let badge=container.querySelector(':scope > .fieldStateBadge');
 if(!badge){badge=document.createElement('span');badge.className='fieldStateBadge';container.appendChild(badge)}
 return badge;
}
function setFieldState(id,state='complete',label){
 const box=fieldStateContainer(id);if(!box)return;
 box.classList.remove('state-pending','state-complete','state-auto','state-derived');
 const badge=fieldStateBadge(box);
 if(state==='pending'){
  box.classList.add('state-pending');if(badge)badge.textContent=label||'REVISAR';
 }else{
  box.classList.add('state-complete');
  if(state==='auto')box.classList.add('state-auto');
  if(state==='derived')box.classList.add('state-derived');
  if(badge)badge.textContent=label||(state==='auto'?'AUTO':state==='derived'?'CALCULADO':'OK');
 }
 updateFieldCompletion();
}
function markFieldComplete(id,label='OK'){setFieldState(id,'complete',label)}
function markFieldAuto(id,label='AUTO'){setFieldState(id,'auto',label)}
function markFieldDerived(id,label='CALCULADO'){setFieldState(id,'derived',label)}
function markFieldPending(id,label='REVISAR'){setFieldState(id,'pending',label)}

function updateFieldCompletion(){
 const total=fieldStateIds.filter(id=>fieldStateContainer(id)).length;
 const complete=fieldStateIds.filter(id=>fieldStateContainer(id)?.classList.contains('state-complete')).length;
 const el=$('fieldCompletionText');if(el)el.textContent=`${complete} de ${total} campos confirmados`;
 const bar=$('fieldCompletionBar');if(bar)bar.style.width=`${total?Math.round((complete/total)*100):0}%`;
}
function insertFieldLegend(){
 const first=$('setupMount')?.querySelector('.panel');if(!first||$('fieldStateLegend'))return;
 const legend=document.createElement('div');legend.id='fieldStateLegend';legend.className='fieldStateLegend';
 legend.innerHTML=`<div class="fieldLegendText"><strong>Preenchimento guiado</strong><span><i class="legendDot pending"></i> amarelo: falta revisar ou confirmar</span><span><i class="legendDot complete"></i> verde: preenchido, calculado ou sugerido</span></div><div class="fieldCompletion"><b id="fieldCompletionText">0 campos confirmados</b><div><i id="fieldCompletionBar"></i></div></div>`;
 const anchor=first.querySelector('.sectionTitle');anchor?.insertAdjacentElement('afterend',legend);
}
function resetAutoFieldStates(){
 ['activity','simpleStatus','meiStatus','annex','factorMode','b2bPct','eligibleCreditPct','regularSuppliersPct','professionalReduction30','mix30','mix40','mix60','mixZero','legacyRate','presumedIrpjPct','presumedCsllPct'].forEach(id=>markFieldPending(id));
}
function initFieldStates(){
 insertFieldLegend();
 let restored={};try{restored=JSON.parse(localStorage.getItem('brmi_v3')||'{}')}catch(_){}
 fieldStateIds.forEach(id=>{
  if(Object.prototype.hasOwnProperty.call(restored,id)&&String(restored[id]).trim()!=='')setFieldState(id,'complete','SALVO');
  else setFieldState(id,'pending');
  const el=$(id);if(!el||el.dataset.fieldStateBound)return;el.dataset.fieldStateBound='1';
  const confirm=()=>markFieldComplete(id);
  el.addEventListener('input',confirm);el.addEventListener('change',confirm);
 });
 ['cashReserve','workingCapitalNet','debtAverage','mixFull'].forEach(id=>markFieldDerived(id,'CALCULADO'));
 ['fullCbs','fullIbs'].forEach(id=>markFieldAuto(id,'PREMISSA'));
 const cnpj=$('cnpj');if(cnpj&&!cnpj.dataset.fieldStateBound){
  cnpj.dataset.fieldStateBound='1';cnpj.addEventListener('input',()=>{const raw=cnpj.value.replace(/[^A-Z0-9]/gi,'');const box=fieldStateContainer('cnpj');if(box){box.classList.remove('state-complete','state-auto','state-derived');box.classList.add('state-pending');const b=fieldStateBadge(box);if(b)b.textContent=raw.length===14?'BUSCAR':'REVISAR'};resetAutoFieldStates();updateFieldCompletion()});
  setFieldState('cnpj','pending','REVISAR');
 }
 updateFieldCompletion();
}

function enableV32Import(){
 if(document.getElementById('v32ImportModule'))return;
 const css=document.createElement('link');css.rel='stylesheet';css.href='/simulador/v3/import.css?v=20260918-6';document.head.appendChild(css);
 const s=document.createElement('script');s.id='v32ImportModule';s.src='/simulador/v3/import.js?v=20260918-6';s.onload=()=>{if(typeof window.patchAuditImportAnalyzer==='function')window.patchAuditImportAnalyzer();if(typeof initDocumentImport==='function')initDocumentImport();const p=document.getElementById('importPanel'),g=document.getElementById('diagnosisGate');if(p&&g)g.parentNode.insertBefore(p,g);const b=document.body.classList.contains('guidedMode')?null:document.querySelector('.brand > div > span');if(b)b.textContent='Simulador Empresarial da Reforma Tributária · V3.2'};document.body.appendChild(s)
}
setTimeout(enableV32Import,0);
