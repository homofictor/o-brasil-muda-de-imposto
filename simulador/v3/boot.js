function renderActions(r,rec){
  const acts=[];const fr=factorRValue();
  if(cnaeSuggestion?.factorR)acts.push(`Confirmar o Fator R. A estimativa atual é ${pct1(fr)} e aponta para Anexo ${fr>=.28?'III':'V'}.`);else acts.push(`Confirmar o Anexo ${r.annex} e a segregação correta das receitas antes de formalizar qualquer opção.`);
  if(num('b2bPct')>=40)acts.push('Mapear os principais clientes PJ e medir se a diferença de crédito influencia preço, homologação de fornecedor ou permanência na cadeia.');else acts.push('Como a participação B2B informada é menor, priorizar a comparação de carga própria e simplicidade operacional.');
  acts.push('Classificar as receitas por cClassTrib e substituir os percentuais genéricos de redução pelos tratamentos efetivamente aplicáveis.');
  acts.push('Separar fornecedores por regime tributário e validar quais compras realmente geram crédito integral de IBS/CBS.');
  const c=cashMetrics(r);if(c.gap>0)acts.push(`Planejar aproximadamente ${brl.format(c.gap)} de fonte adicional de liquidez para o cenário de split payment informado.`);else acts.push('A reserva financeira informada cobre a necessidade adicional de capital de giro estimada neste cenário.');
  if(selectedYear===2027)acts.push('Se a empresa for do Simples e quiser IBS/CBS no regime regular no primeiro semestre de 2027, observar o prazo oficial de setembro de 2026 e as regras de cancelamento.');
  acts.push(`Validar a recomendação “${rec.title}” com contador responsável, considerando contratos, benefícios, créditos específicos, estado/município e particularidades da atividade.`);
  $('actionList').innerHTML=acts.map(x=>`<li>${x}</li>`).join('');
}
function deadline(){
  const now=new Date();const end=new Date('2026-09-30T23:59:59-03:00');const start=new Date('2026-09-01T00:00:00-03:00');
  if(now>=start&&now<=end){const days=Math.ceil((end-now)/86400000);$('deadlineBanner').hidden=false;$('deadlineBanner').querySelector('div').innerHTML=`<strong>Decisão para 2027 em andamento.</strong> Restam aproximadamente ${days} dia${days===1?'':'s'} para o prazo de 30/09/2026 para opção pelo regime regular de IBS/CBS no primeiro semestre de 2027.`}
}
function calculate(){
  applyFactorR();revenueRateFactor();renderYearButtons();if($('yearRange'))$('yearRange').value=selectedYear;
  const all=years.map(modelForYear);const r=all.find(x=>x.year===selectedYear);const rec=recommendation(r);const structural=all.find(x=>x.year===2033);const srec=recommendation(structural);
  $('recommendationTitle').textContent=`${rec.title} em ${selectedYear}`;$('recommendationText').textContent=rec.text;
  $('yearDecision').textContent=rec.title;$('yearReason').textContent=rec.text;
  $('structuralDecision').textContent=srec.title;$('structuralReason').textContent=srec.text;
  const fr=factorRValue();$('factorResult').textContent=pct1(fr);$('factorResultText').textContent=cnaeSuggestion?.factorR?(fr>=.28?'Pelas premissas, tende ao Anexo III.':'Pelas premissas, tende ao Anexo V.'):'Exibido como indicador de referência.';
  if(typeof renderReferenceComparison==='function')renderReferenceComparison(all);
  renderVatSummary(r);renderTimeline(all);renderModels(r,rec);renderCompetition(r);renderCash(r);renderActions(r,rec);
  try{localStorage.setItem('brmi_v3',JSON.stringify(Object.fromEntries([...document.querySelectorAll('input,select')].filter(el=>el.id&&el.id!=='yearRange').map(el=>[el.id,el.type==='checkbox'?el.checked:el.value]))))}catch(_){}
}
function restore(){try{const x=JSON.parse(localStorage.getItem('brmi_v3')||'{}');Object.entries(x).forEach(([id,v])=>{const el=$(id);if(!el)return;if(el.type==='checkbox')el.checked=Boolean(v);else el.value=v})}catch(_){} }
let revenueSyncing=false,lastRevenueSource='monthly';
function syncRevenue(source,markDerived=false){
 const toggle=$('revenueSync');if(revenueSyncing||!toggle?.checked)return;revenueSyncing=true;lastRevenueSource=source;
 if(source==='monthly'){
  const monthly=Math.max(0,num('monthlyRevenue'));numSet('rbt12',Math.round(monthly*12*100)/100);if(markDerived&&typeof markFieldDerived==='function')markFieldDerived('rbt12');
 }else{
  const annual=Math.max(0,num('rbt12'));numSet('monthlyRevenue',Math.round((annual/12)*100)/100);if(markDerived&&typeof markFieldDerived==='function')markFieldDerived('monthlyRevenue');
 }
 revenueSyncing=false;
}
function dirty(){if(typeof markDiagnosisDirty==='function')markDiagnosisDirty();}
$('cnpj').addEventListener('input',e=>{e.target.value=normalizeCnpjInput(e.target.value);dirty()});
$('lookupBtn').addEventListener('click',lookupCnpj);
$('monthlyRevenue').addEventListener('input',()=>{if(typeof markFieldComplete==='function')markFieldComplete('monthlyRevenue');syncRevenue('monthly',true);dirty()});
$('rbt12').addEventListener('input',()=>{if(typeof markFieldComplete==='function')markFieldComplete('rbt12');syncRevenue('annual',true);dirty()});
$('revenueSync').addEventListener('change',()=>{if($('revenueSync').checked)syncRevenue(lastRevenueSource,true);dirty()});
$('printBtn').addEventListener('click',()=>window.print());
document.querySelectorAll('input,select').forEach(el=>{
 if(!['cnpj','yearRange','monthlyRevenue','rbt12','revenueSync'].includes(el.id))el.addEventListener('input',dirty);
 if(!['yearRange','monthlyRevenue','rbt12','revenueSync'].includes(el.id))el.addEventListener('change',dirty)
});
restore();if(typeof initFieldStates==='function')initFieldStates();if($('revenueSync')?.checked)syncRevenue('monthly',false);deadline();if(typeof initEnhancedResults==='function')initEnhancedResults();if(typeof initDiagnosisFlow==='function')initDiagnosisFlow();calculate();
