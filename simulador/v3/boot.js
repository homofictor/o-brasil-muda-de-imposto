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
  applyFactorR();revenueRateFactor();renderYearButtons();
  const all=years.map(modelForYear);const r=all.find(x=>x.year===selectedYear);const rec=recommendation(r);const structural=all.find(x=>x.year===2033);const srec=recommendation(structural);
  $('recommendationTitle').textContent=`${rec.title} em ${selectedYear}`;$('recommendationText').textContent=rec.text;
  $('yearDecision').textContent=rec.title;$('yearReason').textContent=rec.text;
  $('structuralDecision').textContent=srec.title;$('structuralReason').textContent=srec.text;
  const fr=factorRValue();$('factorResult').textContent=pct1(fr);$('factorResultText').textContent=cnaeSuggestion?.factorR?(fr>=.28?'Pelas premissas, tende ao Anexo III.':'Pelas premissas, tende ao Anexo V.'):'Exibido como indicador de referência.';
  renderVatSummary(r);renderTimeline(all);renderModels(r,rec);renderCompetition(r);renderCash(r);renderActions(r,rec);
  try{localStorage.setItem('brmi_v3',JSON.stringify(Object.fromEntries([...document.querySelectorAll('input,select')].map(el=>[el.id,el.value]))))}catch(_){}
}
function restore(){try{const x=JSON.parse(localStorage.getItem('brmi_v3')||'{}');Object.entries(x).forEach(([id,v])=>{if($(id))$(id).value=v})}catch(_){} }
$('cnpj').addEventListener('input',e=>{e.target.value=normalizeCnpjInput(e.target.value)});
$('lookupBtn').addEventListener('click',lookupCnpj);
$('annualizeBtn').addEventListener('click',()=>{numSet('rbt12',num('monthlyRevenue')*12);calculate()});
$('printBtn').addEventListener('click',()=>window.print());
document.querySelectorAll('input,select').forEach(el=>{if(el.id!=='cnpj')el.addEventListener('input',calculate);el.addEventListener('change',calculate)});
restore();deadline();calculate();
