function renderActions(r,rec){
 const acts=[];const fr=factorRValue();
 if(r.simpleEligible){
  if(cnaeSuggestion?.factorR)acts.push(`Confirmar o Fator R. A estimativa atual é ${pct1(fr)} e aponta para Anexo ${fr>=.28?'III':'V'}.`);
  else acts.push(`Confirmar o Anexo ${r.annex} e a segregação correta das receitas antes de formalizar qualquer opção.`);
 }else if(r.eligibility.status==='over_limit'){
  acts.push(`Registrar que o RBT12 de ${brl2.format(r.rbt12)} supera o teto de R$ 4,8 milhões e excluir Simples Nacional e Simples híbrido da decisão prospectiva.`);
 }else{
  acts.push('Confirmar a elegibilidade ao Simples antes de incluir esse regime em qualquer decisão. O simulador não o tratou como alternativa disponível.');
 }
 if(num('b2bPct')>=40)acts.push('Mapear os principais clientes PJ e medir se o crédito efetivamente destacado influencia preço, homologação de fornecedor ou permanência na cadeia.');
 else acts.push('Como a participação B2B estimada é menor, priorizar carga própria, margem, caixa e simplicidade operacional.');
 acts.push('Validar a composição das receitas por cClassTrib e substituir as estimativas setoriais pelos tratamentos efetivamente aplicáveis às operações.');
 acts.push('Separar fornecedores por regime tributário e validar quais compras realmente geram crédito de IBS/CBS.');
 const fm=financialMetrics();if(fm.annualRate==null&&$('financeRateMode')?.value==='auto')acts.push('Completar no BP/DRE os juros e encargos da dívida e os saldos de empréstimos/financiamentos para calcular o custo financeiro automaticamente.');
 const c=cashMetrics(r);if(c.gap>0)acts.push(`Planejar aproximadamente ${brl.format(c.gap)} de fonte adicional de liquidez para o cenário de split payment informado.`);else acts.push('A reserva financeira calculada cobre a necessidade adicional de capital de giro estimada neste cenário.');
 if(selectedYear===2027&&r.simpleEligible)acts.push('Se a empresa quiser IBS/CBS no regime regular no primeiro semestre de 2027, observar o prazo oficial de setembro de 2026 e as regras de cancelamento.');
 acts.push(`Validar a recomendação “${rec.title}” com contador responsável, considerando contratos, benefícios, créditos específicos, estado/município e particularidades da atividade.`);
 $('actionList').innerHTML=acts.map(x=>`<li>${x}</li>`).join('');
}

function renderNarrative(r,rec,structural,srec){
 const box=$('narrativeText');if(!box)return;
 const valid=r.models.filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total),best=valid[0],second=valid[1],pending=r.models.filter(m=>m.valid===false).map(m=>m.name),c=cashMetrics(r),b2b=clamp(num('b2bPct')/100,0,1),parts=[];
 if(best){
  const gap=second?Math.max(0,second.total-best.total):0;
  parts.push(`<p><strong>Conclusão para ${r.year}.</strong> Entre os modelos considerados válidos, <strong>${best.name}</strong> apresenta o menor desembolso tributário anual estimado, de <strong>${brl2.format(best.total)}</strong>.${second?` O segundo colocado é <strong>${second.name}</strong>, com diferença de <strong>${brl2.format(gap)}</strong> por ano.`:''} O ranking considera a carga própria da empresa e os custos adicionais informados, sem descontar o crédito que pertence ao cliente.</p>`);
 }
 if(rec.key==='pure')parts.push(`<p><strong>Leitura tributária.</strong> O Simples Nacional 100% é a alternativa mais econômica nas premissas atuais. A principal vantagem é a menor carga própria e a simplicidade operacional. A principal cautela está nas vendas para pessoas jurídicas, porque o crédito do cliente é limitado à parcela de IBS/CBS devida no Simples.</p>`);
 if(rec.key==='hybrid')parts.push(`<p><strong>Leitura tributária.</strong> O Simples híbrido aparece como a melhor alternativa nas premissas atuais. Isso indica que a combinação entre DAS sem IBS/CBS, créditos das aquisições e tributação regular do consumo compensou a maior complexidade operacional. Antes de qualquer opção, confirme os créditos efetivamente aproveitáveis e o custo adicional de compliance.</p>`);
 if(rec.key==='presumed')parts.push(`<p><strong>Leitura tributária.</strong> O Lucro Presumido aparece como a melhor alternativa validada. A conclusão depende diretamente dos percentuais de presunção corretos para a atividade e da contribuição patronal informada. Despesas operacionais não reduzem as bases presumidas de IRPJ e CSLL.</p>`);
 if(rec.key==='real')parts.push(`<p><strong>Leitura tributária.</strong> O Lucro Real aparece como a melhor alternativa validada. Essa conclusão só é confiável porque parte do lucro contábil informado ou importado e dos ajustes fiscais lançados. A qualidade da DRE e a conferência das adições, exclusões e compensações são decisivas.</p>`);
 if(r.simpleEligible&&b2b>0){
  if(r.extraClientCredit>0)parts.push(`<p><strong>Competitividade B2B.</strong> O regime regular de IBS/CBS entrega aproximadamente <strong>${brl2.format(r.extraClientCredit)}</strong> a mais de crédito anual aos clientes PJ em relação ao Simples puro. Esse valor não reduz o imposto da empresa. Ele só cria valor para o vendedor se for convertido em preço, margem, retenção de clientes ou volume. A participação B2B informada é de <strong>${pct1(b2b)}</strong>.</p>`);
  else parts.push(`<p><strong>Competitividade B2B.</strong> Nas premissas atuais, a diferença de crédito entregue aos clientes PJ não altera de forma relevante a comparação. O foco deve permanecer na carga própria, margem, caixa e simplicidade operacional.</p>`);
 }
 if(c&&!c.notApplicable){
  if(c.gap>0)parts.push(`<p><strong>Caixa.</strong> O cenário de split payment gera necessidade adicional de liquidez e, depois da reserva considerada, permanece um gap estimado de <strong>${brl2.format(c.gap)}</strong>. Esse valor deve ser tratado como necessidade financeira, e não como novo imposto.</p>`);
  else parts.push(`<p><strong>Caixa.</strong> A reserva financeira considerada cobre a necessidade adicional de liquidez estimada para o cenário de split payment informado. Ainda assim, prazo de recebimento, concentração de clientes e cronograma efetivo do split devem ser monitorados.</p>`);
 }
 if(srec&&srec.key!==rec.key)parts.push(`<p><strong>Transição.</strong> A recomendação para ${r.year} não é a mesma da visão estrutural de 2033, quando o simulador aponta <strong>${srec.title}</strong>. Isso significa que uma decisão eficiente no curto prazo pode precisar ser revista conforme ICMS e ISS desaparecem e o IBS ganha peso.</p>`);
 else if(srec)parts.push(`<p><strong>Transição.</strong> A alternativa recomendada em ${r.year} permanece a mesma na visão estrutural de 2033. Isso reforça a consistência do resultado, embora as diferenças de valor entre os regimes possam mudar ao longo da transição.</p>`);
 if(pending.length)parts.push(`<p><strong>Limitações do ranking.</strong> ${pending.join(' e ')} ${pending.length>1?'não entraram':'não entrou'} no ranking por falta de dados suficientes ou por impedimento identificado. A ausência desses modelos do ranking não deve ser interpretada como prova de que seriam necessariamente piores.</p>`);
 parts.push(`<p><strong>Recomendação prática.</strong> Use este resultado como filtro de decisão. Antes de qualquer mudança de regime, confirme enquadramento, tratamentos específicos de IBS/CBS, créditos efetivos, contribuição patronal, contratos relevantes e os dados contábeis utilizados. Se a diferença entre os primeiros colocados for pequena, simplicidade operacional, risco de erro e efeito comercial podem ser mais importantes do que a diferença tributária isolada.</p>`);
 box.innerHTML=parts.join('');
}

function deadline(r){
 const banner=$('deadlineBanner');if(!banner)return;
 if(r&&!r.simpleEligible){banner.hidden=true;return}
 const now=new Date();const end=new Date('2026-09-30T23:59:59-03:00');const start=new Date('2026-09-01T00:00:00-03:00');
 if(now>=start&&now<=end){const days=Math.ceil((end-now)/86400000);banner.hidden=false;banner.querySelector('div').innerHTML=`<strong>Decisão para 2027 em andamento.</strong> Restam aproximadamente ${days} dia${days===1?'':'s'} para o prazo de 30/09/2026 para opção pelo regime regular de IBS/CBS no primeiro semestre de 2027.`}
 else banner.hidden=true;
}
function calculate(){
 if(companyData&&!sectorSuggestion){historicalSimpleReported=companyData.opcao_pelo_simples===true;sectorSuggestion=sectorProfile(companyData.cnae_fiscal,companyData.cnae_fiscal_descricao);applySectorProfile(sectorSuggestion);}
 financialMetrics();refreshEligibilityUi();applyFactorR();revenueRateFactor();renderYearButtons();if($('yearRange'))$('yearRange').value=selectedYear;
 const all=years.map(modelForYear);const r=all.find(x=>x.year===selectedYear);const rec=recommendation(r);const structural=all.find(x=>x.year===2033);const srec=recommendation(structural);
 renderEligibilityBanner(r);deadline(r);
 $('recommendationTitle').textContent=`${rec.title} em ${selectedYear}`;$('recommendationText').textContent=rec.text;
 $('yearDecision').textContent=rec.title;$('yearReason').textContent=rec.text;
 $('structuralDecision').textContent=srec.title;$('structuralReason').textContent=srec.text;
 const fr=factorRValue();$('factorResult').textContent=r.simpleEligible?pct1(fr):'N/A';$('factorResultText').textContent=r.simpleEligible?(cnaeSuggestion?.factorR?(fr>=.28?'Pelas premissas, tende ao Anexo III.':'Pelas premissas, tende ao Anexo V.'):'Exibido como indicador de referência.'):'Fator R não entra na análise prospectiva quando o Simples não é alternativa confirmada.';
 if(typeof renderReferenceComparison==='function')renderReferenceComparison(all);
 renderVatSummary(r);renderTimeline(all);renderModels(r,rec);renderCompetition(r);renderCash(r);renderActions(r,rec);renderNarrative(r,rec,structural,srec);
 try{localStorage.setItem('brmi_v3',JSON.stringify(Object.fromEntries([...document.querySelectorAll('input,select')].filter(el=>el.id&&el.id!=='yearRange'&&!['cashReserve','workingCapitalNet','debtAverage'].includes(el.id)).map(el=>[el.id,el.type==='checkbox'?el.checked:el.value]))))}catch(_){}
}
function restore(){
 try{
  const x=JSON.parse(localStorage.getItem('brmi_v3')||'{}');
  const legacyDemo={monthlyRevenue:'35000',rbt12:'420000',monthlyPayroll:'11000',b2bPct:'70',purchasesPct:'20',eligibleCreditPct:'90',regularSuppliersPct:'80',cashAndEquivalents:'10000'};
  const isLegacyDemo=Object.entries(legacyDemo).every(([id,value])=>String(x[id]??'')===value);
  if(isLegacyDemo){
   ['simpleStatus','meiStatus','annex','monthlyRevenue','rbt12','monthlyPayroll','b2bPct','purchasesPct','eligibleCreditPct','regularSuppliersPct','cashAndEquivalents','liquidInvestments','currentAssets','currentLiabilities','interestExpense','debtStart','debtEnd','hybridCompliance','fullCompliance','legacyRate','realAdditionsAnnual','realExclusionsAnnual','irpjLossCarryforward','csllNegativeBase'].forEach(id=>delete x[id]);
   localStorage.setItem('brmi_v3',JSON.stringify(x));
  }
  Object.entries(x).forEach(([id,v])=>{const el=$(id);if(!el)return;if(el.type==='checkbox')el.checked=Boolean(v);else el.value=v});
 }catch(_){}
}
function clearAllSimulatorData(){const confirmed=window.confirm('Limpar todas as informações do simulador?\n\nEssa ação removerá os campos preenchidos, os dados da empresa, os documentos importados e o diagnóstico salvo neste navegador.');if(!confirmed)return;try{localStorage.removeItem('brmi_v3')}catch(_){}window.location.reload()}
let revenueSyncing=false,lastRevenueSource='monthly';
function syncRevenue(source,markDerived=false){
 const toggle=$('revenueSync');if(revenueSyncing||!toggle?.checked)return;
 const sourceId=source==='monthly'?'monthlyRevenue':'rbt12',targetId=source==='monthly'?'rbt12':'monthlyRevenue';
 const sourceEl=$(sourceId),targetEl=$(targetId);
 if(!sourceEl||String(sourceEl.value).trim()===''){if(targetEl)targetEl.value='';return}
 revenueSyncing=true;lastRevenueSource=source;
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
$('financeRateMode')?.addEventListener('change',()=>{if($('financeRateMode').value==='manual'&&$('financeRateSource'))$('financeRateSource').textContent='Premissa manual informada pelo usuário.';dirty()});
$('printBtn').addEventListener('click',()=>typeof printDiagnosisReport==='function'?printDiagnosisReport():window.print());
$('clearAllBtn')?.addEventListener('click',clearAllSimulatorData);
document.querySelectorAll('input,select').forEach(el=>{
 if(!['cnpj','yearRange','monthlyRevenue','rbt12','revenueSync'].includes(el.id))el.addEventListener('input',dirty);
 if(!['yearRange','monthlyRevenue','rbt12','revenueSync'].includes(el.id))el.addEventListener('change',dirty)
});
restore();if(typeof initFieldStates==='function')initFieldStates();if($('revenueSync')?.checked)syncRevenue('monthly',false);financialMetrics();refreshEligibilityUi();if(typeof initEnhancedResults==='function')initEnhancedResults();if(typeof initDiagnosisFlow==='function')initDiagnosisFlow();calculate();
