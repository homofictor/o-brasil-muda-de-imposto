/* V3.2 - relatório executivo compacto e navegação entre resumo e memória técnica */
(function(){
 const el=id=>document.getElementById(id);
 const safeText=(id,value)=>{const n=el(id);if(n)n.textContent=value==null?'—':String(value)};
 const money=value=>Number.isFinite(value)?brl2.format(value):'—';
 const pct=value=>Number.isFinite(value)?pct1(value):'—';
 const validModels=r=>[...(r?.models||[])].filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total);
 const pendingModels=r=>(r?.models||[]).filter(m=>m.valid===false||!Number.isFinite(m.total));
 const comparablePending=r=>typeof window.comparablePendingModels==='function'?window.comparablePendingModels(r):(r?.models||[]).filter(m=>m.valid===false);
 const comparisonIncomplete=r=>comparablePending(r).length>0;
 const creditFor=(r,m)=>m?.key==='pure'?(r.pureClientCredit||0):(r.regularClientCredit||0);

 function setReportView(view){
  document.querySelectorAll('[data-report-panel]').forEach(panel=>{const active=panel.dataset.reportPanel===view;panel.hidden=!active;panel.classList.toggle('active',active)});
  document.querySelectorAll('[data-report-view]').forEach(btn=>{const active=btn.dataset.reportView===view;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',active?'true':'false')});
 }
 window.setReportView=setReportView;

 function copyText(from,to){const a=el(from),b=el(to);if(a&&b)b.textContent=a.textContent||'—'}

 function renderRanking(r){
  const valid=validModels(r),tbody=el('execRankingBody'),incomplete=comparisonIncomplete(r);if(!tbody)return;
  if(!valid.length){tbody.innerHTML='<tr><td colspan="5">Nenhum modelo possui dados suficientes para formar ranking.</td></tr>';return}
  tbody.innerHTML=valid.map((m,i)=>{
   const rate=r.annualRevenue>0?m.total/r.annualRevenue:0,credit=creditFor(r,m),lead=i===0?(incomplete?'Menor entre os modelos validados':'Recomendado nas premissas atuais'):'';
   return `<tr class="${i===0?(incomplete?'partialLeader':'winner'):''}"><td><span class="rankPill">${i+1}º</span></td><td><strong>${m.name}</strong>${lead?`<small>${lead}</small>`:''}</td><td>${money(m.total)}</td><td>${pct(rate)}</td><td>${money(credit)}</td></tr>`;
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
  let current2026=window.lastEconomicImpact?.currentTax;
  if(current2026==null){
   try{
    const selected=all.find(x=>x.year===selectedYear),model=validModels(selected)[0];
    if(selected&&model&&typeof economicImpactFor==='function')current2026=economicImpactFor(selected,model)?.currentTax;
   }catch(_){}
  }
  safeText('exec2026Consumption',current2026==null?'—':money(current2026));
  safeText('exec2027Consumption',y27?money((y27.netVat||0)+(y27.legacy||0)):'—');
  safeText('exec2033Consumption',y33?money((y33.netVat||0)+(y33.legacy||0)):'—');
  const line=el('execTransitionYears');if(!line)return;
  line.innerHTML=all.map(x=>`<div class="${x.year===selectedYear?'selected':''}"><span>${x.year}</span><b>${money((x.netVat||0)+(x.legacy||0))}</b></div>`).join('');
 }

 function renderImpacts(r){
  const top=validModels(r).slice(0,2),regularPair=top.length===2&&top.every(m=>m.key==='real'||m.key==='presumed'),incomplete=comparisonIncomplete(r);
  safeText('execDecisionDriversTitle',incomplete?'Pendências antes da decisão':regularPair?'Efeitos da Reforma no negócio':'O que pode mudar a decisão');
  safeText('execDecisionDriversText',incomplete?'O ranking é parcial. Complete os modelos aplicáveis ainda não validados antes de interpretar o primeiro colocado como recomendação.':regularPair?'Crédito B2B e caixa continuam relevantes para a operação, mas não diferenciam Lucro Real de Lucro Presumido, pois ambos utilizam o regime regular de IBS/CBS.':'Competitividade B2B e pressão sobre caixa são analisadas separadamente da carga própria.');
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
   if(c){const reserve=typeof parseMoneyValue==='function'?parseMoneyValue(el('cashReserve')?.value):Number(el('cashReserve')?.value)||0;if(c.gap>0){safeText('execReserveStatus','Reserva insuficiente');cash=`A reserva informada de ${money(reserve)} não cobre toda a necessidade estimada. O cenário indica ${money(c.gap)} de financiamento adicional.`}else{safeText('execReserveStatus','Reserva suficiente');cash=`A reserva informada de ${money(reserve)} cobre a necessidade adicional de liquidez estimada neste cenário. O split payment continua exigindo acompanhamento do fluxo de caixa.`}}
  }catch(_){safeText('execReserveStatus','Revisar caixa')}
  safeText('execCashText',cash);
 }

 function renderConclusion(r,rec,all,srec){
  const valid=validModels(r),pending=pendingModels(r),pendingComparable=comparablePending(r),incomplete=pendingComparable.length>0,best=valid[0],second=valid[1],box=el('execConclusion');if(!box)return;
  if(!best){box.innerHTML='<p>Não há dados suficientes para uma conclusão executiva. Complete as pendências destacadas antes de usar o relatório para decisão.</p>';return}
  const gap=second?second.total-best.total:null,same2033=srec&&srec.key===rec.key;
  const p1=incomplete?`<p><strong>Comparação parcial.</strong> ${best.name} apresenta o menor desembolso entre os modelos já validados em ${r.year}, de <strong>${money(best.total)}</strong>, mas <strong>${pendingComparable.map(m=>m.name).join(' e ')}</strong> ${pendingComparable.length>1?'ainda não possuem':'ainda não possui'} dados suficientes. Não trate esta posição como recomendação final.</p>`:`<p><strong>Decisão tributária.</strong> ${best.name} apresenta o menor desembolso anual estimado em ${r.year}, de <strong>${money(best.total)}</strong>${second?`, com vantagem de <strong>${money(gap)}</strong> sobre ${second.name}`:''}. O ranking considera a carga própria da empresa e não desconta o crédito pertencente ao cliente.</p>`;
  let p2='';const topKeys=valid.slice(0,2).map(m=>m.key),regularPair=topKeys.length===2&&topKeys.every(k=>k==='real'||k==='presumed');
  if(regularPair){p2='<p><strong>Validação entre Lucro Real e Lucro Presumido.</strong> Como ambos utilizam o regime regular de IBS/CBS, crédito B2B e efeito do split payment não diferenciam diretamente os dois regimes. A comparação depende principalmente da margem tributável, percentuais de presunção, despesas dedutíveis, adições e exclusões fiscais, compensações e qualidade da informação contábil.</p>'}
  else if(r.simpleEligible&&r.extraClientCredit>0){p2=`<p><strong>Ponto que pode alterar a decisão.</strong> O regime regular entrega aproximadamente <strong>${money(r.extraClientCredit)}</strong> adicionais de crédito aos clientes B2B em relação ao Simples puro. A vantagem só compensa economicamente se houver capacidade real de capturar esse valor em preço, margem, retenção ou volume.</p>`}
  else{p2='<p><strong>Ponto de atenção.</strong> A conclusão deve ser confrontada com contratos, benefícios específicos, créditos efetivos e qualidade dos dados contábeis antes de qualquer opção formal.</p>'}
  let economic='';const impact=window.lastEconomicImpact;
  if(impact?.known){const direction=impact.resultEffect>0?'ganho':impact.resultEffect<0?'perda':'efeito neutro';economic=`<p><strong>Efeito econômico.</strong> Depois da parcela transferida ao preço e do custo financeiro estimado, o cenário indica <strong>${direction} de ${money(Math.abs(impact.resultEffect))}</strong> por ano no resultado.${impact.projectedOperatingMargin==null?' A margem atual não foi informada, por isso a margem futura não foi projetada.':` A margem operacional projetada é de <strong>${pct(impact.projectedOperatingMargin)}</strong>.`}</p>`}
  const transition=incomplete?`<p><strong>Visão de longo prazo.</strong> A comparação atual ainda está incompleta. Complete as pendências antes de comparar a posição de ${r.year} com o cenário estrutural de 2033.</p>`:`<p><strong>Visão de longo prazo.</strong> ${same2033?`A alternativa recomendada em ${r.year} permanece a mesma em 2033, reforçando a consistência do resultado ao longo da transição.`:`A recomendação muda na visão estrutural de 2033 para ${srec?.title||'outro modelo'}. Isso exige comparar a decisão imediata com a estratégia de longo prazo.`}${pending.length?` ${pending.map(m=>m.name).join(' e ')} ${pending.length>1?'não entraram':'não entrou'} no ranking atual por impedimento ou não aplicabilidade identificada.`:''}</p>`;
  box.innerHTML=p1+p2+economic+transition;
 }

 function renderActionsExecutive(r){
  const actions=[],pending=pendingModels(r);
  pending.forEach(m=>{if(m.validationMessage)actions.push(`${m.name}: ${m.validationMessage}`)});
  try{if(cnaeSuggestion?.factorR)actions.push(`Confirmar o Fator R e o Anexo indicado pelas premissas antes da decisão.`)}catch(_){}
  const b2b=Number(el('b2bPct')?.value)||0;if(b2b>=40)actions.push('Validar com os principais clientes PJ se o crédito de IBS/CBS influencia preço, homologação ou retenção.');
  const impact=window.lastEconomicImpact;if(impact?.known&&impact.taxDelta>0&&impact.transferRate<1)actions.push(`Revisar preços e contratos: ${money(impact.unabsorbedDelta)} da variação tributária anual permanece absorvida pela empresa.`);else if(!impact?.known)actions.push('Informar a carga atual dos tributos sobre consumo para medir o impacto em preço e margem.');
  actions.push('Confirmar a composição das receitas por tratamento de IBS/CBS e substituir estimativas por dados efetivos sempre que possível.');
  actions.push('Validar aquisições que geram crédito e o regime tributário dos principais fornecedores.');
  try{const c=typeof cashMetrics==='function'?cashMetrics(r):null;if(c?.gap>0)actions.push(`Planejar fonte adicional de liquidez para o gap estimado de ${money(c.gap)}.`)}catch(_){}
  actions.push('Validar a decisão final com o contador responsável antes de alterar qualquer regime tributário.');
  const unique=[...new Set(actions)].slice(0,4),list=el('execActions');if(list)list.innerHTML=unique.map(x=>`<li>${x}</li>`).join('');
 }

 function renderExecutiveReport(r,rec,all,srec){
  if(!r)return;const valid=validModels(r),best=valid[0],second=valid[1],gap=best&&second?second.total-best.total:null,incomplete=comparisonIncomplete(r),pendingComparable=comparablePending(r);
  const title=incomplete?`Comparação parcial em ${r.year}`:best?`${best.name} em ${r.year}`:rec.title;safeText('recommendationTitle',title);
  const regularPair=best&&second&&[best.key,second.key].every(k=>k==='real'||k==='presumed');
  const lead=incomplete&&best?`${best.name} apresenta o menor desembolso entre os modelos já validados, mas ${pendingComparable.map(m=>m.name).join(' e ')} ${pendingComparable.length>1?'ainda não possuem':'ainda não possui'} dados suficientes. Complete as pendências antes de decidir.`:best?`${best.name} apresenta o menor desembolso entre os modelos validados${second?`, com diferença de ${money(gap)} para ${second.name}`:''}. ${regularPair?'Os fatores de validação entre Lucro Real e Lucro Presumido aparecem abaixo.':'Os fatores que podem mudar essa decisão aparecem abaixo.'}`:rec.text;
  safeText('recommendationText',lead);
  safeText('yearDecision',incomplete?'Comparação incompleta':best?.name||rec.title);safeText('yearReason',best?`${incomplete?'Menor modelo validado: ':''}${money(best.total)} por ano · ${pct(r.annualRevenue>0?best.total/r.annualRevenue:0)} da receita`:'Dados insuficientes');
  safeText('execSavings',gap==null?'—':money(gap));safeText('execSecond',second?`vs. ${second.name}`:'Sem segundo modelo validado');
  safeText('structuralDecision',srec?.title||'—');safeText('structuralReason',srec?.key==='partial'?'Comparação estrutural ainda incompleta.':srec?.key===rec.key?'Mantém a recomendação no regime pleno.':'A recomendação muda no cenário estrutural.');
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
