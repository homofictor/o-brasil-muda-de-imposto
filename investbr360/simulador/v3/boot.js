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
 const fm=financialMetrics();if($('financeRateMode')?.value==='auto'&&fm.needsReview)acts.push(`Confirmar a composição das despesas financeiras e o saldo médio da dívida. O simulador usou ${pct1(fm.referenceRate)} a.a. como referência gerencial porque a taxa documental ${fm.rawAnnualRate!=null&&Number.isFinite(fm.rawAnnualRate)?'resultou em '+pct1(fm.rawAnnualRate):'não pôde ser calculada com segurança'}.`);
 const c=cashMetrics(r);if(c.gap==null)acts.push('Informar caixa e aplicações disponíveis para calcular o gap de financiamento do cenário de split payment.');else if(c.gap>0)acts.push(`Planejar aproximadamente ${brl.format(c.gap)} de fonte adicional de liquidez para o cenário de split payment informado.`);else acts.push('A reserva financeira calculada cobre a necessidade adicional de capital de giro estimada neste cenário.');
 const economic=window.lastEconomicImpact;if(economic?.known){if(economic.taxDelta>0&&economic.transferRate<1)acts.push(`Revisar preços, contratos e margens: ${brl.format(economic.unabsorbedDelta)} da variação anual dos tributos sobre consumo permanece absorvida pela empresa no cenário informado.`);else if(economic.taxDelta<0)acts.push('Definir quanto da redução estimada da carga de consumo será preservada na margem e quanto será convertido em preço ou competitividade.')}else acts.push('Informar a carga líquida atual dos tributos sobre consumo para medir o efeito sobre preço, margem e resultado.');
 if(selectedYear===2027&&r.simpleEligible)acts.push('Se a empresa quiser IBS/CBS no regime regular no primeiro semestre de 2027, observar o prazo oficial de setembro de 2026 e as regras de cancelamento.');
 const regularPartial=(rec.key==='real'||rec.key==='presumed')&&!r.cppBaseKnown;
 if(rec.key==='sensitive')acts.push('Construir com o contador uma projeção de lucro tributável para 2027 e confrontá-la com o ponto de indiferença entre Lucro Real e Lucro Presumido.');
 else acts.push(rec.key==='partial'||rec.key==='pending'?'Completar as pendências e validar a comparação com o contador responsável antes de qualquer decisão.':regularPartial?`Validar com o contador o resultado comparativo que coloca “${rec.title}” à frente, completando a contribuição patronal e conferindo contratos, benefícios, créditos específicos e particularidades da atividade.`:`Validar a recomendação “${rec.title}” com contador responsável, considerando contratos, benefícios, créditos específicos, estado/município e particularidades da atividade.`);
 $('actionList').innerHTML=acts.map(x=>`<li>${x}</li>`).join('');
}

function renderNarrative(r,rec,structural,srec){
 const box=$('narrativeText');if(!box)return;
 const valid=r.models.filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total),best=valid[0],second=valid[1],pending=r.models.filter(m=>m.valid===false).map(m=>m.name),c=cashMetrics(r),b2b=clamp(num('b2bPct')/100,0,1),parts=[];
 const regularPair=best&&second&&[best.key,second.key].every(k=>k==='real'||k==='presumed'),cppPartial=regularPair&&!r.cppBaseKnown;
 if(best){
  const gap=second?Math.max(0,second.total-best.total):0;
  parts.push(r.realDecisionSensitive&&r.breakEven
   ?`<p><strong>Conclusão para ${r.year}: resultado sensível à lucratividade futura.</strong> A DRE histórica coloca <strong>${best.name}</strong> à frente na referência atual, mas isso não deve ser repetido automaticamente como previsão. O ponto aproximado de indiferença entre Lucro Real e Lucro Presumido é <strong>${brl2.format(r.breakEven.profit)}</strong> de lucro anual, equivalente a <strong>${pct1(r.breakEven.margin)}</strong> do faturamento. Abaixo desse ponto o Lucro Real tende a ficar à frente; acima dele o Lucro Presumido pode passar à frente, mantidas as demais premissas.</p>`
   :cppPartial
   ?`<p><strong>Conclusão para ${r.year}.</strong> Entre os modelos regulares comparáveis, <strong>${best.name}</strong> apresenta a menor <strong>base tributária comparável</strong>, de <strong>${brl2.format(best.total)}</strong>.${second?` O segundo colocado é <strong>${second.name}</strong>, com diferença de <strong>${brl2.format(gap)}</strong> por ano.`:''} A contribuição patronal ainda não está incluída, portanto estes valores não representam a carga tributária total projetada.</p>`
   :`<p><strong>Conclusão para ${r.year}.</strong> Entre os modelos considerados válidos, <strong>${best.name}</strong> apresenta o menor desembolso anual estimado, de <strong>${brl2.format(best.total)}</strong>.${second?` O segundo colocado é <strong>${second.name}</strong>, com diferença de <strong>${brl2.format(gap)}</strong> por ano.`:''} O ranking considera a carga própria da empresa e os custos adicionais informados, sem descontar o crédito que pertence ao cliente.</p>`);
 }
 if(rec.key==='pure')parts.push(`<p><strong>Leitura tributária.</strong> O Simples Nacional 100% é a alternativa mais econômica nas premissas atuais. A principal vantagem é a menor carga própria e a simplicidade operacional. A principal cautela está nas vendas para pessoas jurídicas, porque o crédito do cliente é limitado à parcela de IBS/CBS devida no Simples.</p>`);
 if(rec.key==='hybrid')parts.push(`<p><strong>Leitura tributária.</strong> O Simples híbrido aparece como a melhor alternativa nas premissas atuais. Isso indica que a combinação entre DAS sem IBS/CBS, créditos das aquisições e tributação regular do consumo compensou a maior complexidade operacional. Antes de qualquer opção, confirme os créditos efetivamente aproveitáveis e o custo adicional de compliance.</p>`);
 if(rec.key==='presumed')parts.push(`<p><strong>Leitura tributária.</strong> O Lucro Presumido aparece ${cppPartial?'com a menor base comparável entre os regimes regulares':'como a alternativa de menor desembolso validado nas premissas atuais'}. A conclusão depende diretamente dos percentuais de presunção corretos para a atividade${cppPartial?' e a projeção total só fica completa após informar a contribuição patronal':''}. Despesas operacionais não reduzem as bases presumidas de IRPJ e CSLL.</p>`);
 if(rec.key==='real')parts.push(`<p><strong>Leitura tributária.</strong> O Lucro Real aparece ${cppPartial?'com a menor base comparável entre os regimes regulares':'como a alternativa de menor desembolso validado nas premissas atuais'}. Essa leitura usa a projeção de lucro informada e os ajustes fiscais lançados. A qualidade da DRE, do orçamento e a conferência das adições, exclusões e compensações são decisivas.${cppPartial?' A projeção total só fica completa após informar a contribuição patronal.':''}</p>`);
 if(rec.key==='sensitive'&&r.breakEven)parts.push(`<p><strong>Leitura tributária.</strong> O resultado histórico não é suficiente para escolher o regime futuro. A comparação deve ser feita contra o ponto de indiferença de <strong>${brl2.format(r.breakEven.profit)}</strong> de lucro anual. O histórico serve como referência de comportamento recente; uma decisão para 2027 exige orçamento ou cenário de margem futura.</p>`);
 if(r.simpleEligible&&b2b>0){
  if(r.extraClientCredit>0)parts.push(`<p><strong>Competitividade B2B.</strong> O regime regular de IBS/CBS entrega aproximadamente <strong>${brl2.format(r.extraClientCredit)}</strong> a mais de crédito anual aos clientes PJ em relação ao Simples puro. Esse valor não reduz o imposto da empresa. Ele só cria valor para o vendedor se for convertido em preço, margem, retenção de clientes ou volume. A participação B2B informada é de <strong>${pct1(b2b)}</strong>.</p>`);
  else parts.push(`<p><strong>Competitividade B2B.</strong> Nas premissas atuais, a diferença de crédito entregue aos clientes PJ não altera de forma relevante a comparação. O foco deve permanecer na carga própria, margem, caixa e simplicidade operacional.</p>`);
 }
 if(c&&!c.notApplicable){
  if(c.gap==null)parts.push('<p><strong>Caixa.</strong> A necessidade de liquidez do cenário de split payment foi estimada, mas o gap de financiamento ainda não pode ser concluído porque a reserva financeira disponível não foi informada.</p>');
  else if(c.gap>0)parts.push(`<p><strong>Caixa.</strong> O cenário de split payment gera necessidade adicional de liquidez e, depois da reserva considerada, permanece um gap estimado de <strong>${brl2.format(c.gap)}</strong>. Esse valor deve ser tratado como necessidade financeira, e não como novo imposto.</p>`);
  else parts.push(`<p><strong>Caixa.</strong> A reserva financeira considerada cobre a necessidade adicional de liquidez estimada para o cenário de split payment informado. Ainda assim, prazo de recebimento, concentração de clientes e cronograma efetivo do split devem ser monitorados.</p>`);
 }
 const economic=window.lastEconomicImpact;
 if(economic?.known){
  const taxDirection=economic.taxDelta>0?'aumento':economic.taxDelta<0?'redução':'estabilidade';
  const resultDirection=economic.resultEffect>0?'ganho':economic.resultEffect<0?'perda':'efeito neutro';
  const prefix=economic.confidence==='low'?'<strong>Estimativa preliminar.</strong> ':economic.confidence==='medium'?'<strong>Estimativa de cenário.</strong> ':'';
  const transferCaveat=economic.transferRate>=.999?' O efeito neutro depende do repasse integral da variação tributária ao preço; se o mercado não aceitar esse repasse, parte da variação será absorvida pela margem.':'';
  parts.push(economic.financeCostKnown?`<p><strong>Preço e margem.</strong> ${prefix}A comparação da carga líquida dos tributos sobre consumo indica <strong>${taxDirection} de ${brl2.format(Math.abs(economic.taxDelta))}</strong> por ano. Com ${pct1(economic.transferRate)} da variação transferida ao preço e o custo financeiro estimado, o efeito anual no resultado é de <strong>${resultDirection} de ${brl2.format(Math.abs(economic.resultEffect))}</strong>.${economic.projectedOperatingMargin==null?' Informe a margem operacional atual para projetar a margem futura.':` A margem operacional projetada é de <strong>${pct1(economic.projectedOperatingMargin)}</strong>.`}${transferCaveat}</p>`:`<p><strong>Preço e margem.</strong> ${prefix}A comparação da carga líquida dos tributos sobre consumo indica <strong>${taxDirection} de ${brl2.format(Math.abs(economic.taxDelta))}</strong> por ano. Antes do custo financeiro, o efeito anual no resultado é de <strong>${resultDirection} de ${brl2.format(Math.abs(economic.resultEffect))}</strong>. Informe reserva e taxa financeira para completar essa análise.${transferCaveat}</p>`);
 }
 if(rec.key==='sensitive'||srec?.key==='sensitive')parts.push('<p><strong>Transição.</strong> Não é apropriado projetar automaticamente o resultado histórico até 2033. A trajetória Real x Presumido deve ser revisada quando houver projeções de rentabilidade para os anos futuros.</p>');
 else if(rec.key==='partial'||rec.key==='pending'||srec?.key==='partial'||srec?.key==='pending')parts.push('<p><strong>Transição.</strong> A comparação entre o cenário atual e 2033 permanece parcial enquanto houver regimes aplicáveis sem dados suficientes.</p>');
 else if(srec&&srec.key!==rec.key)parts.push(`<p><strong>Transição.</strong> O cenário que aparece à frente em ${r.year} não é o mesmo da visão estrutural de 2033, quando o simulador aponta <strong>${srec.title}</strong>. Isso significa que uma decisão eficiente no curto prazo pode precisar ser revista ao longo da transição.</p>`);
 else if(srec)parts.push(`<p><strong>Transição.</strong> O cenário que aparece à frente em ${r.year} permanece o mesmo na visão estrutural de 2033. Isso reforça a consistência comparativa do resultado, embora as diferenças de valor entre os regimes possam mudar ao longo da transição.</p>`);
 if(pending.length)parts.push(`<p><strong>Limitações do ranking.</strong> ${pending.join(' e ')} ${pending.length>1?'não entraram':'não entrou'} no ranking por falta de dados suficientes ou por impedimento identificado. A ausência desses modelos do ranking não deve ser interpretada como prova de que seriam necessariamente piores.</p>`);
 parts.push(`<p><strong>Orientação prática.</strong> Use este resultado como filtro de decisão. Antes de qualquer mudança de regime, confirme enquadramento, tratamentos específicos de IBS/CBS, créditos efetivos, contribuição patronal, contratos relevantes e os dados contábeis utilizados. Se a diferença entre os primeiros colocados for pequena, simplicidade operacional, risco de erro e efeito comercial podem ser mais importantes do que a diferença tributária isolada.</p>`);
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
 financialMetrics();refreshEligibilityUi();applyFactorR();if(typeof syncMixFull==='function')syncMixFull(false);revenueRateFactor();renderYearButtons();if($('yearRange'))$('yearRange').value=selectedYear;
 const all=years.map(modelForYear);const r=all.find(x=>x.year===selectedYear);const rec=recommendation(r);const structural=all.find(x=>x.year===2033);const srec=recommendation(structural);
 renderEligibilityBanner(r);deadline(r);
 $('recommendationTitle').textContent=`${rec.title} em ${selectedYear}`;$('recommendationText').textContent=rec.text;
 $('yearDecision').textContent=rec.title;$('yearReason').textContent=rec.text;
 $('structuralDecision').textContent=srec.title;$('structuralReason').textContent=srec.text;
 const fr=factorRValue();$('factorResult').textContent=r.simpleEligible?pct1(fr):'N/A';$('factorResultText').textContent=r.simpleEligible?(cnaeSuggestion?.factorR?(fr>=.28?'Pelas premissas, tende ao Anexo III.':'Pelas premissas, tende ao Anexo V.'):'Exibido como indicador de referência.'):'Fator R não entra na análise prospectiva quando o Simples não é alternativa confirmada.';
 if(typeof renderReferenceComparison==='function')renderReferenceComparison(all);
 renderVatSummary(r);renderTimeline(all);renderModels(r,rec);renderCompetition(r);renderCash(r);if(typeof renderEconomicImpact==='function')renderEconomicImpact(r);renderActions(r,rec);renderNarrative(r,rec,structural,srec);if(typeof renderProfitSensitivity==='function')renderProfitSensitivity();if(typeof renderTaxBridge==='function')renderTaxBridge();if(typeof renderDiagnosisExplanation==='function')renderDiagnosisExplanation();if(typeof refreshMoneyInputs==='function')refreshMoneyInputs();
 try{localStorage.setItem('brmi_v3',JSON.stringify(Object.fromEntries([...document.querySelectorAll('input,select')].filter(el=>el.id&&!['yearRange','cnpj','cashReserve','workingCapitalNet','debtAverage'].includes(el.id)).map(el=>[el.id,el.type==='checkbox'?el.checked:el.value]))))}catch(_){}
}
function restore(){
 try{
  const x=JSON.parse(localStorage.getItem('brmi_v3')||'{}');
  if(Object.prototype.hasOwnProperty.call(x,'cnpj')){
   delete x.cnpj;
   localStorage.setItem('brmi_v3',JSON.stringify(x));
  }
  const legacyDemo={monthlyRevenue:'35000',rbt12:'420000',monthlyPayroll:'11000',b2bPct:'70',purchasesPct:'20',eligibleCreditPct:'90',regularSuppliersPct:'80',cashAndEquivalents:'10000'};
  const isLegacyDemo=Object.entries(legacyDemo).every(([id,value])=>String(x[id]??'')===value);
  if(isLegacyDemo){
   ['simpleStatus','meiStatus','annex','monthlyRevenue','rbt12','monthlyPayroll','b2bPct','purchasesPct','eligibleCreditPct','regularSuppliersPct','cashAndEquivalents','liquidInvestments','currentAssets','currentLiabilities','interestExpense','debtStart','debtEnd','hybridCompliance','fullCompliance','legacyRate','realAdditionsAnnual','realExclusionsAnnual','irpjLossCarryforward','csllNegativeBase'].forEach(id=>delete x[id]);
   localStorage.setItem('brmi_v3',JSON.stringify(x));
  }
  try{
   const key='brmi_price_transfer_default_100_v1';
   if(!localStorage.getItem(key)){
    if(x.priceTransferPct==null||String(x.priceTransferPct)==='0')x.priceTransferPct='100';
    localStorage.setItem(key,'1');
   }
   const taxKey='brmi_current_tax_zero_cleanup_v1';
   if(!localStorage.getItem(taxKey)){
    if(String(x.currentConsumptionTaxAnnual??'')==='0')delete x.currentConsumptionTaxAnnual;
    localStorage.setItem(taxKey,'1');
   }
  }catch(_){}
  Object.entries(x).forEach(([id,v])=>{const el=$(id);if(!el)return;if(el.type==='checkbox')el.checked=Boolean(v);else el.value=v});
  if($('cnpj'))$('cnpj').value='';
 }catch(_){}
}
function guardInitialCnpjBlank(){
 const el=$('cnpj');if(!el)return;
 let userTouched=false;
 const touch=e=>{if(e?.isTrusted)userTouched=true};
 ['keydown','pointerdown','paste','input'].forEach(evt=>el.addEventListener(evt,touch,{passive:true}));
 const clearLateAutofill=()=>{if(userTouched||el.dataset.importVerified==='1'||el.dataset.importAccepted==='1')return;el.value='';delete el.dataset.importSource;delete el.dataset.importConfidence};
 el.value='';
 requestAnimationFrame(clearLateAutofill);
 setTimeout(clearLateAutofill,120);
 setTimeout(clearLateAutofill,650);
 window.addEventListener('pageshow',e=>{if(!e.persisted)return;setTimeout(clearLateAutofill,0)});
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
$('simpleStatus')?.addEventListener('change',()=>{calculate();dirty()});
$('meiStatus')?.addEventListener('change',()=>{calculate();dirty()});
['mix30','mix40','mix60','mixZero'].forEach(id=>$(id)?.addEventListener('input',()=>{if(typeof syncMixFull==='function')syncMixFull(true);revenueRateFactor();dirty()}));
$('printBtn').addEventListener('click',()=>typeof printDiagnosisReport==='function'?printDiagnosisReport():window.print());
$('clearAllBtn')?.addEventListener('click',clearAllSimulatorData);
document.querySelectorAll('#setupMount input,#setupMount select').forEach(el=>{
 if(!['cnpj','yearRange','monthlyRevenue','rbt12','revenueSync'].includes(el.id))el.addEventListener('input',dirty);
 if(!['yearRange','monthlyRevenue','rbt12','revenueSync'].includes(el.id))el.addEventListener('change',dirty)
});
restore();guardInitialCnpjBlank();if(typeof initFieldStates==='function')initFieldStates();if(typeof syncMixFull==='function')syncMixFull(true);if($('revenueSync')?.checked)syncRevenue('monthly',false);financialMetrics();refreshEligibilityUi();if(typeof initEnhancedResults==='function')initEnhancedResults();if(typeof initDiagnosisFlow==='function')initDiagnosisFlow();calculate();
