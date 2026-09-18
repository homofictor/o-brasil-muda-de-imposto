(function(){
 const byId=id=>document.getElementById(id);
 const setup=byId('setupMount');
 if(!setup)return;
 let currentStep=1;
 const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2});
 const percent=v=>`${Number(v||0).toLocaleString('pt-BR',{maximumFractionDigits:1})}%`;
 const value=id=>byId(id)?.value??'';
 const numeric=id=>typeof parseMoneyValue==='function'?parseMoneyValue(value(id)):(Number(String(value(id)).replace(/\./g,'').replace(',','.'))||0);
 const escapeHtml=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

 function relabel(id,title,help){
  const input=byId(id),field=input?.closest('.field');if(!field)return;
  const label=[...field.children].find(x=>x.tagName==='SPAN');if(label)label.textContent=title;
  if(help){let small=field.querySelector('small');if(!small){small=document.createElement('small');field.appendChild(small)}small.textContent=help}
 }

 function detailsBox(title){
  const details=document.createElement('details');details.className='guidedReviewDetails';
  details.innerHTML=`<summary>${title}</summary><div class="guidedReviewDetailsBody"></div>`;
  return details;
 }

 function prepareCompanyStep(panel){
  panel.dataset.guidedStep='1';
  const firstGrid=byId('activity')?.closest('.grid4'),revenueGrid=byId('monthlyRevenue')?.closest('.grid4'),companyCard=byId('companyCard');
  if(revenueGrid&&!panel.querySelector('.guidedRevenueBlock')){
   const block=document.createElement('div');block.className='guidedRevenueBlock';
   ['monthlyRevenue','rbt12'].forEach(id=>{const field=byId(id)?.closest('.field');if(field)block.appendChild(field)});
   (companyCard||panel.querySelector('.sectionTitle')).insertAdjacentElement('afterend',block);
   const review=detailsBox('Revisar enquadramento, folha e Fator R');
   const body=review.querySelector('.guidedReviewDetailsBody');if(firstGrid)body.appendChild(firstGrid);if(revenueGrid&&revenueGrid.children.length)body.appendChild(revenueGrid);
   block.insertAdjacentElement('afterend',review);
  }
 }

 function prepareOperationStep(panel){
  panel.dataset.guidedStep='2';panel.classList.add('guidedOperationPanel');
  relabel('b2bPct','Vendas para outras empresas','Percentual do faturamento destinado a clientes com CNPJ. O perfil inicial é estimado pelo CNAE.');
  relabel('purchasesPct','Compras e despesas com tributos na nota','Matérias-primas, mercadorias, ativos e serviços adquiridos com tributos destacados ou embutidos no valor da operação.');
  relabel('eligibleCreditPct','Quanto dessas compras pode gerar crédito','Estimativa da parcela que atende às condições para aproveitamento de créditos de IBS/CBS.');
  relabel('regularSuppliersPct','Compras de fornecedores que destacam IBS/CBS','Percentual estimado de fornecedores no regime regular, capazes de gerar crédito conforme a operação.');
  const mix=panel.querySelector('.mixbox');if(mix&&!mix.closest('.guidedReviewDetails')){const d=detailsBox('Revisar reduções e tratamentos específicos do IBS/CBS');mix.insertAdjacentElement('beforebegin',d);d.querySelector('.guidedReviewDetailsBody').appendChild(mix)}
 }

 function prepareFinanceStep(panel){
  panel.dataset.guidedStep='3';
  const title=panel.querySelector('.sectionTitle');
  if(!panel.querySelector('.guidedFinancialIntro')){
   const intro=document.createElement('div');intro.className='guidedFinancialIntro';intro.innerHTML='<strong>Revise os dados financeiros encontrados e complete somente o que faltar.</strong><p>Os documentos enviados na primeira etapa já alimentaram esta área. Corrija qualquer valor quando possuir uma informação mais precisa e preencha manualmente apenas as pendências relevantes.</p>';
   title.insertAdjacentElement('afterend',intro);
   const cards=document.createElement('div');cards.className='guidedFinanceCards';cards.id='guidedFinanceCards';intro.insertAdjacentElement('afterend',cards);
   const d=detailsBox('Preencher ou corrigir os dados manualmente');d.id='guidedManualFields';const body=d.querySelector('.guidedReviewDetailsBody');
   const moved=[...panel.children].filter(x=>x.classList?.contains('grid4')||x.classList?.contains('advanced'));
   moved.forEach(x=>body.appendChild(x));
   const groups=[
    ['Premissas tributárias e indicadores','Alíquotas de referência e indicadores calculados automaticamente pelo sistema.'],
    ['Folha, contribuição patronal e lucro','Dados necessários para comparar corretamente os regimes fora do Simples.'],
    ['Lucro Presumido','Percentuais de presunção de IRPJ e CSLL aplicáveis à atividade e regras de elegibilidade.'],
    ['Caixa e capital de giro','Caixa, bancos, aplicações e saldos circulantes usados na análise financeira.'],
    ['Dívida financeira','Obrigações financeiras do início e do fim do período e despesas financeiras associadas.'],
    ['Custo financeiro e período','Cálculo do custo financeiro e período coberto pela DRE.']
   ];
   [...body.querySelectorAll(':scope > .grid4')].forEach((grid,i)=>{
    grid.classList.add('guidedManualGrid');
    const meta=groups[i];if(!meta)return;
    const band=document.createElement('div');band.className='guidedManualGroupTitle';
    band.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><div><b>${meta[0]}</b><small>${meta[1]}</small></div>`;
    grid.insertAdjacentElement('beforebegin',band);
   });
   const advanced=body.querySelector(':scope > .advanced');if(advanced)advanced.classList.add('guidedManualAdvanced');
   cards.insertAdjacentElement('afterend',d);
  }
 }

 function createDataChoice(){
  if(byId('guidedDataChoice'))return byId('guidedDataChoice');
  const finance=byId('cashReserve')?.closest('.panel');if(!finance)return null;
  const panel=document.createElement('section');panel.className='panel guidedDataChoice';panel.id='guidedDataChoice';panel.dataset.guidedStep='3';
  panel.innerHTML='<div class="guidedDataChoiceHead"><span>ETAPA DE PRECISÃO</span><h2>Como deseja informar os dados financeiros?</h2><p>As duas opções alimentam o mesmo motor e podem ser combinadas.</p></div><div class="guidedDataChoiceGrid"><button type="button" id="guidedImportPath"><b>Importar BP, DRE ou relatórios</b><small>O simulador procura os valores e apresenta sugestões para confirmação.</small><strong>Escolher importação</strong></button><button type="button" id="guidedManualPath"><b>Preencher os dados manualmente</b><small>Digite diretamente os valores disponíveis e deixe em branco o que não souber.</small><strong>Abrir formulário manual</strong></button></div><div class="guidedDataChoiceNote" id="guidedDataChoiceNote">Você também poderá corrigir manualmente qualquer valor importado.</div>';
  finance.parentNode.insertBefore(panel,finance);
  const select=mode=>{panel.dataset.mode=mode;byId('guidedImportPath').classList.toggle('active',mode==='import');byId('guidedManualPath').classList.toggle('active',mode==='manual');if(mode==='import'){byId('guidedDataChoiceNote').textContent='Após a leitura, confirme as sugestões encontradas. Os campos manuais continuarão disponíveis para ajustes.';byId('importPanel')?.scrollIntoView({behavior:'smooth',block:'start'})}else{byId('guidedDataChoiceNote').textContent='Informe somente os dados que conhece. O relatório mostrará quais análises ficaram pendentes por falta de informação.';const d=byId('guidedManualFields');if(d)d.open=true;finance.scrollIntoView({behavior:'smooth',block:'start'})}};
  byId('guidedImportPath').addEventListener('click',()=>select('import'));byId('guidedManualPath').addEventListener('click',()=>select('manual'));
  return panel;
 }

 function prepareEconomicStep(panel){
  panel.dataset.guidedStep='3';
  const h=panel.querySelector('.sectionTitle h2');if(h)h.textContent='Preço, margem e capacidade de repasse';
  const p=panel.querySelector('.sectionTitle p');if(p)p.textContent='Confirme como a empresa absorveria ou repassaria uma eventual mudança da carga tributária.';
 }

 function createReviewPanel(){
  if(byId('guidedReviewPanel'))return byId('guidedReviewPanel');
  const gate=byId('diagnosisGate');if(!gate)return null;
  const panel=document.createElement('section');panel.className='panel guidedReviewPanel';panel.id='guidedReviewPanel';panel.dataset.guidedStep='4';
  panel.innerHTML='<h2>Confira o que será levado ao diagnóstico</h2><p>O simulador usará todas as premissas, inclusive as preenchidas automaticamente ou importadas.</p><div class="guidedReviewGrid" id="guidedReviewGrid"></div><div class="guidedReviewWarnings" id="guidedReviewWarnings"></div>';
  gate.parentNode.insertBefore(panel,gate);gate.dataset.guidedStep='4';return panel;
 }

 function attachImportPanel(){
  const panel=byId('importPanel'),company=byId('cnpj')?.closest('.panel'),companyCard=byId('companyCard');if(!panel||!company)return false;
  panel.removeAttribute('data-guided-step');panel.classList.add('guidedImportOnboarding');
  const step=panel.querySelector('.sectionTitle>div>span');if(step)step.textContent='02';
  const tag=panel.querySelector('.importTitleTag');if(tag)tag.textContent='Documentos · opcional, mas recomendado';
  const h=panel.querySelector('.sectionTitle h2');if(h)h.textContent='Envie o que você já possui';
  const p=panel.querySelector('.sectionTitle p');if(p)p.textContent='BP, DRE, balancete ou relatórios podem reduzir bastante o preenchimento manual. Você pode continuar apenas com o CNPJ se preferir.';
  const anchor=companyCard||company.querySelector('.cnpjrow');
  if(anchor&&anchor.nextElementSibling!==panel)anchor.insertAdjacentElement('afterend',panel);
  createAutomationModePanel();
  return true;
 }

 function createAutomationModePanel(){
  if(byId('guidedAutomationMode'))return byId('guidedAutomationMode');
  const importPanel=byId('importPanel'),company=byId('cnpj')?.closest('.panel');if(!company)return null;
  const panel=document.createElement('section');panel.className='guidedAutomationMode';panel.id='guidedAutomationMode';panel.hidden=true;
  panel.innerHTML=`<div class="guidedAutomationModeHead"><span>03</span><div><small>NÍVEL DE AUTOMAÇÃO</small><h2>Quanto o simulador pode preencher por você?</h2><p>Você escolhe até onde o sistema pode usar cálculos e estimativas. A origem e o nível de confiança continuam visíveis.</p></div></div>
  <div class="guidedAutomationModeGrid">
   <button type="button" data-automation-mode="rigorous"><b>Mais rigor</b><small>Preenche automaticamente somente informações de alta confiança.</small><strong>Mais confirmação manual</strong></button>
   <button type="button" data-automation-mode="recommended"><span>RECOMENDADO</span><b>Equilibrado</b><small>Usa dados confirmados e cálculos consistentes. Estimativas frágeis permanecem para revisão.</small><strong>Bom equilíbrio entre rapidez e precisão</strong></button>
   <button type="button" data-automation-mode="maximum"><b>Máxima automação</b><small>Também aplica estimativas de média ou baixa confiança quando não houver conflito.</small><strong>Mais completo, exige revisão</strong></button>
  </div>
  <div class="guidedConfidenceBox" id="guidedConfidenceBox"></div>`;
  (importPanel||company).insertAdjacentElement('afterend',panel);
  panel.querySelectorAll('[data-automation-mode]').forEach(btn=>btn.addEventListener('click',()=>{
   const mode=btn.dataset.automationMode;
   if(typeof window.setBrmiAutomationMode==='function')window.setBrmiAutomationMode(mode);
   else localStorage.setItem('brmi_automation_mode',mode);
   refreshAutomationMode();
  }));
  return panel;
 }

 function confidenceSnapshot(){
  const items=window.brmiImport?.candidates||[],best=new Map(),score={high:3,medium:2,low:1};
  items.forEach(x=>{if(!x?.field||x.field==='cnpj')return;const prev=best.get(x.field);if(!prev||(score[x.confidence]||0)>(score[prev.confidence]||0))best.set(x.field,x)});
  const counts={high:0,medium:0,low:0};best.forEach(x=>{if(counts[x.confidence]!=null)counts[x.confidence]++});
  const total=counts.high+counts.medium+counts.low,weighted=total?Math.round((counts.high+counts.medium*.7+counts.low*.4)/total*100):null;
  return{...counts,total,weighted};
 }

 function refreshAutomationMode(){
  const panel=createAutomationModePanel();if(!panel)return;
  const identified=!byId('companyCard')?.hidden,docs=(window.brmiImport?.docs||[]).length>0;
  panel.hidden=!(identified||docs);
  const mode=typeof window.getBrmiAutomationMode==='function'?window.getBrmiAutomationMode():(localStorage.getItem('brmi_automation_mode')||'recommended');
  panel.querySelectorAll('[data-automation-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.automationMode===mode));
  const q=confidenceSnapshot(),box=byId('guidedConfidenceBox');if(!box)return;
  if(!q.total){
   box.innerHTML='<div><b>Base automática inicial</b><span>Envie documentos ou consulte o CNPJ para ampliar os dados disponíveis.</span></div>';
   return;
  }
  const level=q.weighted>=85?'forte':q.weighted>=65?'intermediária':'exploratória';
  box.innerHTML=`<div class="guidedConfidenceScore"><span>Índice dos dados automáticos</span><b>${q.weighted}%</b><small>Base ${level}</small></div><div class="guidedConfidenceStats"><div><b>${q.high}</b><span>alta confiança</span></div><div><b>${q.medium}</b><span>calculados / média</span></div><div><b>${q.low}</b><span>estimados / baixa</span></div></div><p>Indicador operacional da qualidade das entradas automáticas. Não representa garantia do resultado tributário.</p>`;
 }

 function refreshAutomation(){
  const card=byId('companyCard'),box=byId('guidedAutomation'),context=byId('erpCompanyContext');if(!box||!card||card.hidden){if(box)box.hidden=true;if(context)context.textContent='Novo diagnóstico';if(byId('deadlineBanner'))byId('deadlineBanner').hidden=true;return}
  if(context)context.textContent=byId('companyName')?.textContent||value('activity')||'Empresa identificada';
  const mix=[['mixFull','Integral'],['mix30','Redução de 30%'],['mix40','Redução de 40%'],['mix60','Redução de 60%'],['mixZero','Alíquota zero']].filter(([id])=>numeric(id)>0).map(([id,n])=>`${n}: ${percent(numeric(id))}`).join(' · ');
  const sector=typeof sectorSuggestion!=='undefined'?sectorSuggestion:null,treatment=sector?.treatmentReview?'Revisar NCM/cClassTrib':(mix||'A revisar');
  box.hidden=false;box.innerHTML=`<div class="guidedAutomationHead"><div><strong>Pré-diagnóstico automático criado pelo CNPJ e CNAE</strong><p>${escapeHtml(byId('companyCnae')?.textContent||value('activity'))}</p></div><span>REVISÁVEL</span></div><div class="guidedAutomationGrid"><div class="guidedAutoItem"><span>Vendas para empresas</span><b>${percent(numeric('b2bPct'))}</b></div><div class="guidedAutoItem"><span>Compras com tributos na nota</span><b>${percent(numeric('purchasesPct'))}</b></div><div class="guidedAutoItem"><span>Compras potencialmente creditáveis</span><b>${percent(numeric('eligibleCreditPct'))}</b></div><div class="guidedAutoItem"><span>Fornecedores no regime regular</span><b>${percent(numeric('regularSuppliersPct'))}</b></div><div class="guidedAutoItem"><span>Tratamento sugerido</span><b>${escapeHtml(treatment)}</b></div><div class="guidedAutoItem"><span>Simples Nacional</span><b>${escapeHtml(byId('simpleStatus')?.selectedOptions?.[0]?.textContent||'Não confirmado')}</b></div><div class="guidedAutoItem"><span>Anexo sugerido</span><b>${escapeHtml(value('annex')||'Não aplicável')}</b></div><div class="guidedAutoItem"><span>Atividade</span><b>${escapeHtml((value('activity')||'Não identificada').slice(0,55))}</b></div></div>`;
 }

 function refreshFinance(){
  const box=byId('guidedFinanceCards');if(!box)return;
  const rate=value('financeRate'),cclKnown=value('currentAssets')!==''&&value('currentLiabilities')!=='';box.innerHTML=`<div><span>Reserva financeira</span><b>${numeric('cashReserve')?money.format(numeric('cashReserve')):'Aguardando dados'}</b></div><div><span>Capital de giro líquido</span><b>${cclKnown?money.format(numeric('workingCapitalNet')):'Aguardando dados'}</b></div><div><span>Dívida financeira média</span><b>${numeric('debtAverage')?money.format(numeric('debtAverage')):'Aguardando dados'}</b></div><div><span>Custo financeiro anual</span><b>${rate!==''?percent(rate):'Aguardando dados'}</b></div>`;
 }

 function syncVerifiedProfitIntoGuided(){
  const el=byId('realAccountingProfitAnnual'),verified=window.brmiImport?.verifiedAccountingProfit;
  if(!el||!verified||!Number.isFinite(verified.value)||el.dataset.userEdited==='1')return;
  const currentText=String(el.value||'').trim(),currentValue=numeric('realAccountingProfitAnnual'),alreadyImported=el.dataset.importVerified==='1';
  if(currentText&&!alreadyImported&&Math.abs(currentValue)>.000001)return;
  if(typeof setMoneyInputValue==='function')setMoneyInputValue(el,verified.value);else el.value=Math.round(verified.value*100)/100;
  el.dataset.importVerified='1';el.dataset.importSource=verified.source||'DRE importada';
  if(typeof markFieldAuto==='function')markFieldAuto('realAccountingProfitAnnual','IMPORTADO');
 }
 function refreshReview(){
  syncVerifiedProfitIntoGuided();
  const grid=byId('guidedReviewGrid'),warnings=byId('guidedReviewWarnings');if(!grid||!warnings)return;
  const provided=id=>String(value(id)).trim()!=='';
  const revenueQuality=window.brmiImport?.revenueQuality,taxCandidates=(window.brmiImport?.candidates||[]).filter(x=>x?.field==='currentConsumptionTaxAnnual');
  const taxStatus=provided('currentConsumptionTaxAnnual')?money.format(numeric('currentConsumptionTaxAnnual')):(revenueQuality||window.brmiImport?.docs?.length?'DRE sem abertura suficiente':'A calcular');
  const cards=[['Empresa',byId('companyName')?.textContent||value('activity')||'Não identificada'],['Faturamento anual',provided('rbt12')?money.format(numeric('rbt12')):'Não informado'],['Regime atual',byId('simpleStatus')?.selectedOptions?.[0]?.textContent||'Não confirmado'],['Vendas para empresas',percent(numeric('b2bPct'))],['Compras com tributos na nota',percent(numeric('purchasesPct'))],['Crédito possível nas compras',percent(numeric('eligibleCreditPct'))],['Reserva financeira',provided('cashReserve')?money.format(numeric('cashReserve')):'Não informada'],['Lucro contábil',provided('realAccountingProfitAnnual')?money.format(numeric('realAccountingProfitAnnual')):'Não informado'],['Carga atual de consumo',taxStatus]];
  grid.innerHTML=cards.map(([a,b])=>`<div><span>${escapeHtml(a)}</span><b>${escapeHtml(b)}</b></div>`).join('');
  const notes=[];
  if(!provided('rbt12')||numeric('rbt12')<=0)notes.push('Informe o faturamento bruto anual para liberar o diagnóstico.');
  if(revenueQuality?.status==='net-only'){
   const sameAsNet=provided('rbt12')&&Math.abs(numeric('rbt12')-Number(revenueQuality.net||0))<1;
   notes.push(sameAsNet?'A DRE traz apenas Receita Líquida e esse mesmo valor está no faturamento anual. Confirme o faturamento bruto/RBT12 antes de usar o ranking tributário.':'A DRE traz apenas Receita Líquida. O faturamento bruto/RBT12 precisa ser confirmado separadamente.');
  }
  if(value('simpleStatus')==='unknown')notes.push('Confirme se a empresa está ou não no Simples Nacional.');
  if(!provided('cashReserve'))notes.push('Sem caixa ou aplicações informados, a análise de caixa ficará menos precisa.');
  if(!provided('realAccountingProfitAnnual'))notes.push('Sem lucro contábil antes de IRPJ e CSLL, o Lucro Real não entrará no ranking completo.');
  if(!provided('monthlyCppBase')&&value('simpleStatus')!=='yes')notes.push('Informe a remuneração mensal sujeita à contribuição patronal para comparar corretamente Lucro Presumido e Lucro Real.');
  if(!provided('legacyRate')&&value('simpleStatus')!=='yes')notes.push('Informe a carga efetiva atual de ICMS/ISS para a projeção de 2027 a 2032. Campo em branco não será mais tratado como zero.');
  if((typeof sectorSuggestion!=='undefined'?sectorSuggestion:null)?.treatmentReview)notes.push('O CNAE indica comércio de produtos médico-hospitalares. Confirme o tratamento das receitas por NCM/cClassTrib, pois o CNAE sozinho não define redução ou alíquota zero de IBS/CBS.');
  if(!provided('currentConsumptionTaxAnnual')&&value('simpleStatus')!=='yes')notes.push(taxCandidates.length?'Revise a carga atual de tributos sobre consumo identificada nos documentos.':'A DRE não contém abertura suficiente para calcular a carga atual de consumo. Importe uma DRE detalhada ou relatório fiscal com tributos/deduções sobre vendas.');
  warnings.innerHTML=notes.length?notes.map(x=>`<div>${escapeHtml(x)}</div>`).join(''):'<div class="ok">Os dados essenciais estão preenchidos. O diagnóstico pode ser gerado.</div>';
 }

 function refreshAll(){refreshAutomation();refreshAutomationMode();refreshFinance();refreshReview()}

 function showStep(step,scroll=true){
  currentStep=Math.max(1,Math.min(4,Number(step)||1));document.body.classList.add('guidedReady');
  setup.querySelectorAll('[data-guided-step]').forEach(x=>x.classList.toggle('guidedStepActive',Number(x.dataset.guidedStep)===currentStep));
  document.querySelectorAll('[data-guided-nav]').forEach(b=>{const n=Number(b.dataset.guidedNav);b.classList.toggle('active',n===currentStep);b.classList.toggle('done',n<currentStep)});
  byId('guidedBack').hidden=currentStep===1;byId('guidedNext').hidden=currentStep===4;byId('guidedStepText').textContent=`Etapa ${currentStep} de 4`;if(byId('erpStepMeta'))byId('erpStepMeta').textContent=`Etapa ${currentStep} de 4`;refreshAll();
  if(scroll)requestAnimationFrame(()=>{
   const target=[...setup.querySelectorAll(`[data-guided-step="${currentStep}"]`)].find(x=>x.classList.contains('guidedStepActive'));
   if(!target)return;
   const header=document.querySelector('.erpTopbar,.topbar'),deadline=byId('deadlineBanner');
   const headerH=header?.getBoundingClientRect().height||0,deadlineH=deadline&&!deadline.hidden?(deadline.getBoundingClientRect().height||0):0;
   const top=Math.max(0,target.getBoundingClientRect().top+window.scrollY-headerH-deadlineH-14);
   window.scrollTo({top,behavior:'smooth'});
  });
 }

 function init(){
  const panels=[...setup.querySelectorAll(':scope > .panel')].filter(x=>!x.id);
  if(panels.length<4)return;
  prepareCompanyStep(panels[0]);prepareOperationStep(panels[1]);prepareFinanceStep(panels[2]);prepareEconomicStep(panels[3]);createReviewPanel();attachImportPanel();createAutomationModePanel();
  document.querySelectorAll('[data-guided-nav]').forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.guidedNav)));
  byId('guidedBack').addEventListener('click',()=>showStep(currentStep-1));byId('guidedNext').addEventListener('click',()=>showStep(currentStep+1));
  document.addEventListener('input',refreshAll);document.addEventListener('change',refreshAll);
  const status=byId('lookupStatus');if(status)new MutationObserver(()=>setTimeout(refreshAll,50)).observe(status,{childList:true,subtree:true,characterData:true});
  const observer=new MutationObserver(()=>{if(attachImportPanel()){observer.disconnect();showStep(currentStep,false);refreshAutomationMode()}});observer.observe(setup,{childList:true});
  document.addEventListener('brmi:automation-mode',refreshAutomationMode);document.addEventListener('brmi:automation-applied',refreshAll);
  const importObserver=new MutationObserver(()=>refreshAutomationMode());importObserver.observe(setup,{childList:true,subtree:true,characterData:true});
  relabel('monthlyRevenue','Faturamento médio mensal','Informe se souber. Caso contrário, envie os documentos logo abaixo e deixe o sistema procurar o valor.');
  relabel('rbt12','Faturamento bruto dos últimos 12 meses','Informe se souber. Receita líquida da DRE não será tratada automaticamente como faturamento bruto.');
  if(byId('monthlyRevenue'))byId('monthlyRevenue').placeholder='Informe o valor';
  if(byId('rbt12'))byId('rbt12').placeholder='Informe o valor';
  showStep(1,false);setTimeout(refreshAll,600);
 }

 setTimeout(init,0);
})();
