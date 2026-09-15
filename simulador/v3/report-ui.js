/* V3.2 - relatório executivo compacto e navegação entre resumo e memória técnica */
(function(){
 const el=id=>document.getElementById(id);
 const safeText=(id,value)=>{const n=el(id);if(n)n.textContent=value==null?'—':String(value)};
 const money=value=>Number.isFinite(value)?brl2.format(value):'—';
 const pct=value=>Number.isFinite(value)?pct1(value):'—';
 const validModels=r=>[...(r?.models||[])].filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total);
 const pendingModels=r=>(r?.models||[]).filter(m=>m.valid===false||!Number.isFinite(m.total));
 const creditFor=(r,m)=>m?.key==='pure'?(r.pureClientCredit||0):(r.regularClientCredit||0);

 function setReportView(view){
  document.querySelectorAll('[data-report-panel]').forEach(panel=>{const active=panel.dataset.reportPanel===view;panel.hidden=!active;panel.classList.toggle('active',active)});
  document.querySelectorAll('[data-report-view]').forEach(btn=>{const active=btn.dataset.reportView===view;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false')});
 }
 window.setReportView=setReportView;

 function copyText(from,to){const a=el(from),b=el(to);if(a&&b)b.textContent=a.textContent||'—'}

 function renderRanking(r){
  const valid=validModels(r),tbody=el('execRankingBody');if(!tbody)return;
  if(!valid.length){tbody.innerHTML='<tr><td colspan="5">Nenhum modelo possui dados suficientes para formar ranking.</td></tr>';return}
  tbody.innerHTML=valid.map((m,i)=>{
   const rate=r.annualRevenue>0?m.total/r.annualRevenue:0,credit=creditFor(r,m);
   return `<tr class="${i===0?'winner':''}"><td><span class="rankPill">${i+1}º</span></td><td><strong>${m.name}</strong>${i===0?'<small>Recomendado nas premissas atuais</small>':''}</td><td>${money(m.total)}</td><td>${pct(rate)}</td><td>${money(credit)}</td></tr>`;
  }).join('');
 }

 function renderPending(r){
  const pending=pendingModels(r),box=el('execPendingBlock');if(!box)return;
  if(!pending.length){box.hidden=true;box.innerHTML='';return}
  box.hidden=false;
  box.innerHTML=`<strong>Modelos ainda não ranqueados</strong><div>${pending.map(m=>`<span><b>${m.name}</b>${m.validationMessage||'Dados insuficientes para validação.'}</span>`).join('')}</div>`;
 }

 function renderTransition(all){
  const y27=all.find(x=>x.year===2027),y33=all.find(x=>x.year===2033);
  safeText('exec2027Consumption',y27?money((y27.netVat||0)+(y27.legacy||0)):'—');
  safeText('exec2033Consumption',y33?money((y33.netVat||0)+(y33.legacy||0)):'—');
  const line=el('execTransitionYears');if(!line)return;
  line.innerHTML=all.map(x=>`<div class="${x.year===selectedYear?'selected':''}"><span>${x.year}</span><b>${money((x.netVat||0)+(x.legacy||0))}</b></div>`).join('');
 }

 function renderImpacts(r){
  copyText('riskLabel','execRiskLabel');copyText('riskNumber','execRiskScore');copyText('extraClientCredit','execExtraCredit');copyText('breakEvenCapture','execCapture');
  copyText('workingCapital','execWorkingCapital');copyText('financingGap','execFinancingGap');copyText('cashPer100','execCashPer100');
  const b2b=Math.max(0,Math.min(100,Number(el('b2bPct')?.value)||0));
  let commercial='A análise comercial não altera o ranking tributário por si só.';
  if(r.simpleEligible&&r.extraClientCredit>0){commercial=`${b2b.toLocaleString('pt-BR',{maximumFractionDigits:1})}% das vendas foram informadas como B2B. O regime regular gera ${money(r.extraClientCredit)} adicionais de crédito ao cliente em relação ao Simples puro. Esse valor só cria benefício para a empresa se puder ser convertido em preço, margem, retenção ou volume.`}
  else if(!r.simpleEligible){commercial=`O Simples não está confirmado como alternativa. A análise B2B deve concentrar-se no crédito efetivamente gerado no regime regular e na reação dos clientes.`}
  safeText('execCommercialText',commercial);
  let cash='A pressão de caixa deve ser lida separadamente da carga tributária.';
  try{
   const c=typeof cashMetrics==='function'?cashMetrics(r):null;
   if(c){const reserve=Number(el('cashReserve')?.value)||0;if(c.gap>0){safeText('execReserveStatus','Reserva insuficiente');cash=`A reserva informada não cobre toda a necessidade estimada. O cenário indica ${money(c.gap)} de financiamento adicional.`}else{safeText('execReserveStatus','Reserva suficiente');cash=`A reserva informada cobre a necessidade adicional de liquidez estimada neste cenário. O split payment continua exigindo acompanhamento do fluxo de caixa.`}}
  }catch(_){safeText('execReserveStatus','Revisar caixa')}
  safeText('execCashText',cash);
 }

 function renderConclusion(r,rec,all,srec){
  const valid=validModels(r),pending=pendingModels(r),best=valid[0],second=valid[1],box=el('execConclusion');if(!box)return;
  if(!best){box.innerHTML='<p>Não há dados suficientes para uma conclusão executiva. Complete as pendências destacadas antes de usar o relatório para decisão.</p>';return}
  const gap=second?second.total-best.total:null,same2033=srec&&srec.key===rec.key;
  const p1=`<p><strong>Decisão tributária.</strong> ${best.name} apresenta o menor desembolso anual estimado em ${r.year}, de <strong>${money(best.total)}</strong>${second?`, com vantagem de <strong>${money(gap)}</strong> sobre ${second.name}`:''}. O ranking considera a carga própria da empresa e não desconta o crédito pertencente ao cliente.</p>`;
  let p2='';
  if(r.simpleEligible&&r.extraClientCredit>0){p2=`<p><strong>Ponto que pode alterar a decisão.</strong> O regime regular entrega aproximadamente <strong>${money(r.extraClientCredit)}</strong> adicionais de crédito aos clientes B2B em relação ao Simples puro. A vantagem só compensa economicamente se houver capacidade real de capturar esse valor em preço, margem, retenção ou volume.</p>`}
  else{p2='<p><strong>Ponto de atenção.</strong> A conclusão deve ser confrontada com contratos, benefícios específicos, créditos efetivos e qualidade dos dados contábeis antes de qualquer opção formal.</p>'}
  const transition=`<p><strong>Visão de longo prazo.</strong> ${same2033?`A alternativa recomendada em ${r.year} permanece a mesma em 2033, reforçando a consistência do resultado ao longo da transição.`:`A recomendação muda na visão estrutural de 2033 para ${srec?.title||'outro modelo'}. Isso exige comparar a decisão imediata com a estratégia de longo prazo.`}${pending.length?` ${pending.map(m=>m.name).join(' e ')} ${pending.length>1?'não entraram':'não entrou'} no ranking atual por falta de dados suficientes ou impedimento identificado.`:''}</p>`;
  box.innerHTML=p1+p2+transition;
 }

 function renderActionsExecutive(r){
  const actions=[],pending=pendingModels(r);
  pending.forEach(m=>{if(m.validationMessage)actions.push(`${m.name}: ${m.validationMessage}`)});
  try{if(cnaeSuggestion?.factorR)actions.push(`Confirmar o Fator R e o Anexo indicado pelas premissas antes da decisão.`)}catch(_){}
  const b2b=Number(el('b2bPct')?.value)||0;if(b2b>=40)actions.push('Validar com os principais clientes PJ se o crédito de IBS/CBS influencia preço, homologação ou retenção.');
  actions.push('Confirmar a composição das receitas por tratamento de IBS/CBS e substituir estimativas por dados efetivos sempre que possível.');
  actions.push('Validar aquisições que geram crédito e o regime tributário dos principais fornecedores.');
  try{const c=typeof cashMetrics==='function'?cashMetrics(r):null;if(c?.gap>0)actions.push(`Planejar fonte adicional de liquidez para o gap estimado de ${money(c.gap)}.`)}catch(_){}
  actions.push('Validar a decisão final com o contador responsável antes de alterar qualquer regime tributário.');
  const unique=[...new Set(actions)].slice(0,4),list=el('execActions');if(list)list.innerHTML=unique.map(x=>`<li>${x}</li>`).join('');
 }

 function renderExecutiveReport(r,rec,all,srec){
  if(!r)return;const valid=validModels(r),best=valid[0],second=valid[1],gap=best&&second?second.total-best.total:null;
  const title=best?`${best.name} em ${r.year}`:rec.title;safeText('recommendationTitle',title);
  const lead=best?`${best.name} apresenta o menor desembolso entre os modelos validados${second?`, com diferença de ${money(gap)} para ${second.name}`:''}. Os fatores que podem mudar essa decisão aparecem abaixo.`:rec.text;
  safeText('recommendationText',lead);
  safeText('yearDecision',best?.name||rec.title);safeText('yearReason',best?`${money(best.total)} por ano · ${pct(r.annualRevenue>0?best.total/r.annualRevenue:0)} da receita`:'Dados insuficientes');
  safeText('execSavings',gap==null?'—':money(gap));safeText('execSecond',second?`vs. ${second.name}`:'Sem segundo modelo validado');
  safeText('structuralDecision',srec?.title||'—');safeText('structuralReason',srec?.key===rec.key?'Mantém a recomendação no regime pleno.':'A recomendação muda no cenário estrutural.');
  const exec=el('executiveReport');if(exec)exec.dataset.year=String(r.year);
  renderRanking(r);renderPending(r);renderTransition(all);renderImpacts(r);renderConclusion(r,rec,all,srec);renderActionsExecutive(r);
 }
 window.renderExecutiveReport=renderExecutiveReport;

 function refreshExecutive(){
  try{if(typeof years==='undefined'||typeof modelForYear!=='function')return;const all=years.map(modelForYear),r=all.find(x=>x.year===selectedYear),rec=recommendation(r),structural=all.find(x=>x.year===2033),srec=recommendation(structural);renderExecutiveReport(r,rec,all,srec)}catch(err){console.error('Resumo executivo:',err)}
 }

 function init(){
  document.querySelectorAll('[data-report-view]').forEach(btn=>btn.addEventListener('click',()=>setReportView(btn.dataset.reportView)));
  el('generateDiagnosisBtn')?.addEventListener('click',()=>setReportView('executive'));
  setReportView('executive');
  const oldCalculate=window.calculate;
  if(typeof oldCalculate==='function')window.calculate=function(){const result=oldCalculate.apply(this,arguments);refreshExecutive();return result};
  refreshExecutive();
 }
 init();
})();