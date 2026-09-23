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
 const provided=id=>String(value(id)).trim()!=='';
 function originLabel(id){
  const el=byId(id),field=el?.closest('.field');
  if(!el)return '';
  if(el.dataset.userEdited==='1')return 'Informado';
  if(el.dataset.importVerified==='1'){
   if(el.dataset.importConfidence==='low')return 'Estimado';
   if(el.dataset.importConfidence==='medium')return 'Calculado';
   return 'Importado';
  }
  if(field?.classList.contains('state-derived'))return 'Calculado';
  if(field?.classList.contains('state-auto')||field?.classList.contains('state-suggested'))return 'Sugerido';
  return provided(id)?'Informado':'Aguardando';
 }
 function focusGuidedField(id,step){
  showStep(step,false);
  requestAnimationFrame(()=>{
   const el=byId(id);if(!el)return;
   let node=el.parentElement;while(node){if(node.tagName==='DETAILS')node.open=true;node=node.parentElement}
   const field=el.closest('.field')||el;
   field.scrollIntoView({behavior:'smooth',block:'center'});
   setTimeout(()=>{try{el.focus({preventScroll:true})}catch(_){el.focus()}field.classList.add('guidedFieldFocus');setTimeout(()=>field.classList.remove('guidedFieldFocus'),1600)},300);
  });
 }

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
  const mainGrid=byId('b2bPct')?.closest('.grid4');
  if(mainGrid&&!panel.querySelector('#guidedOperationSummary')){
   const summary=document.createElement('div');summary.className='guidedOperationSummary';summary.id='guidedOperationSummary';
   mainGrid.insertAdjacentElement('beforebegin',summary);
   const d=detailsBox('Revisar os percentuais sugeridos');d.id='guidedOperationEditor';mainGrid.insertAdjacentElement('beforebegin',d);d.querySelector('.guidedReviewDetailsBody').appendChild(mainGrid);
  }
  const mix=panel.querySelector('.mixbox');if(mix&&!mix.closest('.guidedReviewDetails')){const d=detailsBox('Tratamentos específicos do IBS/CBS');d.id='guidedTaxTreatmentEditor';mix.insertAdjacentElement('beforebegin',d);d.querySelector('.guidedReviewDetailsBody').appendChild(mix)}
  if(mix&&!byId('acceptTaxTreatmentSuggestion')){
   const head=mix.querySelector('.mixhead');
   const action=document.createElement('div');action.className='guidedTaxTreatmentConfirm';
   action.innerHTML='<button type="button" id="acceptTaxTreatmentSuggestion">Usar sugestão do CNAE/atividade</button><small id="taxTreatmentConfirmStatus">Confirme a sugestão se ela já representa adequadamente suas receitas.</small>';
   head?.insertAdjacentElement('afterend',action);
  }
 }

 function prepareFinanceStep(panel){
  panel.dataset.guidedStep='3';
  const title=panel.querySelector('.sectionTitle');
  if(!panel.querySelector('.guidedFinancialIntro')){
   const intro=document.createElement('div');intro.className='guidedFinancialIntro';intro.innerHTML='<strong>Revise os dados financeiros encontrados e complete somente o que faltar.</strong><p>Os documentos enviados na primeira etapa já alimentaram esta área. Corrija qualquer valor quando possuir uma informação mais precisa e preencha manualmente apenas as pendências relevantes.</p>';
   title.insertAdjacentElement('afterend',intro);
   const cards=document.createElement('div');cards.className='guidedFinanceCards';cards.id='guidedFinanceCards';intro.insertAdjacentElement('afterend',cards);
   const needs=document.createElement('div');needs.className='guidedNeedsPanel';needs.id='guidedNeedsPanel';cards.insertAdjacentElement('afterend',needs);
   const d=detailsBox('Ver ou corrigir dados financeiros');d.id='guidedManualFields';const body=d.querySelector('.guidedReviewDetailsBody');
   const moved=[...panel.children].filter(x=>x.classList?.contains('grid4')||x.classList?.contains('advanced'));
   moved.forEach(x=>body.appendChild(x));
   const groups=[
    ['Premissas tributárias e indicadores','Alíquotas de referência e indicadores calculados automaticamente pelo sistema.'],
    ['Folha, contribuição patronal e lucro','A folha completa a carga total projetada; o lucro contábil é necessário para calcular corretamente o Lucro Real.'],
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
   needs.insertAdjacentElement('afterend',d);
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
  panel.innerHTML='<div class="guidedReviewHead"><span>REVISÃO FINAL</span><h2>O essencial antes do diagnóstico</h2><p>Você não precisa conferir a memória técnica agora. Veja apenas os dados que realmente afetam a leitura final.</p></div><div class="guidedReviewGrid" id="guidedReviewGrid"></div><div class="guidedReviewWarnings" id="guidedReviewWarnings"></div>';
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
  const level=q.total?(q.weighted>=85?'Boa':q.weighted>=65?'Intermediária':'Inicial'):'';
  const signature=[mode,identified?1:0,docs?1:0,q.high,q.medium,q.low,q.weighted||0].join('|');
  if(box.dataset.signature===signature)return;
  box.dataset.signature=signature;
  if(!q.total){
   box.innerHTML='<div><b>Base automática inicial</b><span>Envie documentos ou consulte o CNPJ para ampliar os dados disponíveis.</span></div>';
   return;
  }
  box.innerHTML=`<div class="guidedConfidenceScore"><span>Qualidade dos dados automáticos</span><b>${level}</b><small>${q.weighted}% como indicador interno</small></div><div class="guidedConfidenceStats"><div><b>${q.high}</b><span>confirmados / alta</span></div><div><b>${q.medium}</b><span>calculados / média</span></div><div><b>${q.low}</b><span>estimados / baixa</span></div></div><p>O percentual serve apenas para orientar a revisão dos dados. Não é uma probabilidade de acerto do diagnóstico.</p>`;
 }


 function createOnboardingStatus(){
  if(byId('guidedOnboardingStatus'))return byId('guidedOnboardingStatus');
  const mode=byId('guidedAutomationMode'),company=byId('cnpj')?.closest('.panel');if(!company)return null;
  const box=document.createElement('div');box.className='guidedOnboardingStatus';box.id='guidedOnboardingStatus';box.hidden=true;
  (mode||company).insertAdjacentElement('afterend',box);return box;
 }
 function refreshOnboardingStatus(){
  const box=createOnboardingStatus();if(!box)return;
  const identified=!byId('companyCard')?.hidden,docs=(window.brmiImport?.docs||[]).length,rbt=provided('rbt12')&&numeric('rbt12')>0,simple=value('simpleStatus')!=='unknown';
  if(!identified&&!docs){box.hidden=true;return}
  box.hidden=false;
  const missing=[];if(!rbt)missing.push({id:'rbt12',step:1,label:'faturamento bruto dos últimos 12 meses'});if(!simple)missing.push({id:'simpleStatus',step:1,label:'situação no Simples Nacional'});
  if(!missing.length){
   box.className='guidedOnboardingStatus ready';box.innerHTML=`<div><span>✓</span><p><strong>Base inicial pronta.</strong><small>Já temos o necessário para avançar. Nas próximas etapas, altere apenas o que souber com mais precisão.</small></p></div><button type="button" data-go-step="2">Continuar para a operação</button>`;
  }else{
   box.className='guidedOnboardingStatus pending';box.innerHTML=`<div><span>!</span><p><strong>Falta ${missing.length===1?'uma confirmação importante':'confirmar alguns dados importantes'}.</strong><small>${missing.map(x=>x.label).join(' e ')}.</small></p></div><div class="guidedOnboardingActions">${missing.map(x=>`<button type="button" data-focus-field="${x.id}" data-focus-step="${x.step}">Informar agora</button>`).join('')}</div>`;
  }
 }

 function taxTreatmentConfirmed(){return value('taxTreatmentAccepted')==='yes'}
 function persistTaxTreatmentConfirmation(valueToSave){
  try{const saved=JSON.parse(localStorage.getItem('brmi_v3')||'{}');saved.taxTreatmentAccepted=valueToSave;localStorage.setItem('brmi_v3',JSON.stringify(saved))}catch(_){}
 }
 function confirmTaxTreatment(source='suggestion'){
  const flag=byId('taxTreatmentAccepted');if(flag)flag.value='yes';persistTaxTreatmentConfirmation('yes');
  ['mix30','mix40','mix60','mixZero'].forEach(id=>{if(typeof markFieldComplete==='function')markFieldComplete(id,'CONFIRMADO')});
  if(typeof markFieldDerived==='function')markFieldDerived('mixFull','CALCULADO');
  const hint=byId('mixHint');if(hint)hint.textContent=source==='manual'
   ?'Composição revisada pelo usuário. O sistema usará estes percentuais no diagnóstico.'
   :'Sugestão do CNAE/atividade confirmada pelo usuário. O sistema usará esta composição no diagnóstico.';
  const btn=byId('acceptTaxTreatmentSuggestion');if(btn){btn.textContent='Tratamento confirmado';btn.classList.add('confirmed')}
  const status=byId('taxTreatmentConfirmStatus');if(status)status.textContent='Esta composição não será tratada como pendência enquanto não houver nova alteração cadastral.';
  if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('tax-treatment-confirmed');
  scheduleRefresh();
 }
 function resetTaxTreatmentConfirmation(){
  const flag=byId('taxTreatmentAccepted');if(flag)flag.value='';persistTaxTreatmentConfirmation('');
  const btn=byId('acceptTaxTreatmentSuggestion');if(btn){btn.textContent='Usar sugestão do CNAE/atividade';btn.classList.remove('confirmed')}
  const status=byId('taxTreatmentConfirmStatus');if(status)status.textContent='Confirme a sugestão se ela já representa adequadamente suas receitas.';
 }

 function refreshOperationSummary(){
  const box=byId('guidedOperationSummary');if(!box)return;
  const items=[
   ['b2bPct','Vendas para empresas'],
   ['purchasesPct','Compras e despesas tributadas'],
   ['eligibleCreditPct','Potencial de crédito'],
   ['regularSuppliersPct','Fornecedores no regime regular']
  ];
  box.innerHTML=`<div class="guidedOperationSummaryHead"><div><span>PERFIL ESTIMADO DA OPERAÇÃO</span><strong>Se estes números fizerem sentido, apenas continue.</strong></div><small>Todos podem ser revisados.</small></div><div class="guidedOperationSummaryGrid">${items.map(([id,label])=>`<div><span>${label}</span><b>${percent(numeric(id))}</b><small>${originLabel(id)}</small></div>`).join('')}</div>`;
 }

 function reviewRequirements(){
  const req=[],nonSimple=value('simpleStatus')==='no',simpleConfirmed=value('simpleStatus')==='yes',sector=typeof sectorSuggestion!=='undefined'?sectorSuggestion:null;
  if(!provided('rbt12')||numeric('rbt12')<=0)req.push({level:'required',field:'rbt12',step:1,title:'Confirmar faturamento bruto anual',why:'Sem esse valor o simulador não consegue comparar os regimes.'});
  if(value('simpleStatus')==='unknown')req.push({level:'required',field:'simpleStatus',step:1,title:'Confirmar o regime atual',why:'Precisamos saber se a empresa está ou não no Simples Nacional.'});
  if(simpleConfirmed&&!provided('monthlyCppBase'))req.push({level:'required',field:'monthlyCppBase',step:3,title:'Informar remunerações sujeitas à contribuição patronal',why:'Necessária para comparar o Simples com os regimes regulares em bases completas.'});
  if(nonSimple&&!provided('monthlyCppBase'))req.push({level:'important',field:'monthlyCppBase',step:3,title:'Completar contribuição patronal da projeção',why:'Não impede a comparação entre Lucro Real e Presumido, mas é necessária para apresentar a carga tributária total projetada de 2027 a 2033.'});
  if(nonSimple&&!provided('realAccountingProfitAnnual'))req.push({level:'required',field:'realAccountingProfitAnnual',step:3,title:'Informar ou importar o lucro antes de IRPJ e CSLL',why:'Sem esse dado o Lucro Real fica fora da comparação completa.'});
  if(nonSimple&&!provided('legacyRate'))req.push({level:'required',field:'legacyRate',step:3,title:'Confirmar a carga atual de ICMS/ISS',why:'Necessária para a transição de 2027 a 2032.'});
  if(nonSimple&&!provided('currentConsumptionTaxAnnual'))req.push({level:'important',field:'currentConsumptionTaxAnnual',step:3,title:'Informar a carga atual sobre consumo',why:'Melhora a análise de preço, margem e resultado.'});
  if(!provided('cashReserve'))req.push({level:'optional',field:'cashAndEquivalents',step:3,title:'Completar caixa e aplicações',why:'Permite medir melhor o impacto financeiro do split payment.'});
  if(!provided('currentOperatingMarginPct'))req.push({level:'optional',field:'currentOperatingMarginPct',step:3,title:'Informar margem EBITDA atual',why:'Permite projetar a margem futura.'});
  if(sector?.treatmentReview&&!taxTreatmentConfirmed())req.push({level:'important',field:'mix30',step:2,title:'Revisar tratamento das receitas',why:'O CNAE sozinho pode não definir o tratamento de todos os produtos ou operações. Se a sugestão já atende, confirme-a sem alterar os percentuais.'});
  return req;
 }

 function refreshNeeds(){
  const box=byId('guidedNeedsPanel');if(!box)return;
  const req=reviewRequirements(),needed=req.filter(x=>x.level==='required'||x.level==='important'),optional=req.filter(x=>x.level==='optional');
  if(!needed.length&&!optional.length){box.className='guidedNeedsPanel ready';box.innerHTML='<div><span>✓</span><p><strong>Dados financeiros suficientes para uma análise completa.</strong><small>Você pode continuar. Abra os detalhes somente se quiser conferir ou corrigir algum valor.</small></p></div>';return}
  box.className='guidedNeedsPanel';
  box.innerHTML=`<div class="guidedNeedsHead"><div><span>O SIMULADOR PRECISA DE VOCÊ</span><strong>${needed.length?`${needed.length} ${needed.length===1?'item importante':'itens importantes'} para completar a análise`:'Nenhum item obrigatório pendente'}</strong></div>${optional.length?`<small>+${optional.length} opciona${optional.length>1?'is':'l'} para aumentar a precisão</small>`:''}</div><div class="guidedNeedsList">${needed.slice(0,5).map(x=>`<button type="button" data-focus-field="${x.field}" data-focus-step="${x.step}"><span>${x.level==='required'?'Necessário':'Melhora a análise'}</span><b>${x.title}</b><small>${x.why}</small><i>Preencher →</i></button>`).join('')}</div>`;
 }

 function refreshAutomation(){
  const card=byId('companyCard'),box=byId('guidedAutomation'),context=byId('erpCompanyContext');
  if(box)box.hidden=true;
  if(!card||card.hidden){if(context)context.textContent='Novo diagnóstico';if(byId('deadlineBanner'))byId('deadlineBanner').hidden=true;return}
  if(context)context.textContent=byId('companyName')?.textContent||value('activity')||'Empresa identificada';
 }
 function refreshFinance(){
  const box=byId('guidedFinanceCards');if(!box)return;
  const rate=value('financeRate'),cclKnown=value('currentAssets')!==''&&value('currentLiabilities')!=='';box.innerHTML=`<div><span>Reserva financeira</span><b>${provided('cashReserve')?money.format(numeric('cashReserve')):'Não disponível'}</b><small>${originLabel('cashReserve')}</small></div><div><span>Capital de giro líquido</span><b>${cclKnown?money.format(numeric('workingCapitalNet')):'Não disponível'}</b><small>${cclKnown?'Calculado':'Aguardando'}</small></div><div><span>Dívida financeira média</span><b>${provided('debtAverage')?money.format(numeric('debtAverage')):'Não disponível'}</b><small>${originLabel('debtAverage')}</small></div><div><span>Custo financeiro anual</span><b>${rate!==''?percent(rate):'Não disponível'}</b><small>${originLabel('financeRate')}</small></div>`;
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
  const revenueQuality=window.brmiImport?.revenueQuality;
  const taxStatus=provided('currentConsumptionTaxAnnual')?money.format(numeric('currentConsumptionTaxAnnual')):(revenueQuality||window.brmiImport?.docs?.length?'Não identificado nos documentos':'Não informado');
  const cards=[
   ['Empresa',byId('companyName')?.textContent||value('activity')||'Não identificada',''],
   ['Faturamento bruto anual',provided('rbt12')?money.format(numeric('rbt12')):'Pendente',originLabel('rbt12')],
   ['Regime atual',byId('simpleStatus')?.selectedOptions?.[0]?.textContent||'Não confirmado',originLabel('simpleStatus')],
   ['Perfil de clientes',percent(numeric('b2bPct'))+' para empresas',originLabel('b2bPct')],
   ['Potencial de crédito nas compras',percent(numeric('eligibleCreditPct')),originLabel('eligibleCreditPct')],
   ['Lucro contábil',provided('realAccountingProfitAnnual')?money.format(numeric('realAccountingProfitAnnual')):'Pendente',originLabel('realAccountingProfitAnnual')],
   ['Carga atual de consumo',taxStatus,originLabel('currentConsumptionTaxAnnual')]
  ];
  grid.innerHTML=cards.map(([a,b,o])=>`<div><span>${escapeHtml(a)}</span><b>${escapeHtml(b)}</b>${o?`<small>${escapeHtml(o)}</small>`:''}</div>`).join('');
  const req=reviewRequirements(),important=req.filter(x=>x.level==='required'||x.level==='important'),optional=req.filter(x=>x.level==='optional');
  if(!important.length){
   warnings.innerHTML=`<div class="ok"><span>✓</span><p><strong>Pronto para gerar o diagnóstico.</strong><small>${optional.length?'Alguns dados opcionais ainda podem melhorar preço, margem ou caixa, mas não impedem a análise principal.':'Os dados essenciais estão disponíveis.'}</small></p></div>`;
   return;
  }
  warnings.innerHTML=`<div class="guidedReviewAlert"><div><span>!</span><p><strong>Complete ${important.length} ${important.length===1?'item':'itens'} para uma análise mais completa.</strong><small>Você será levado diretamente ao campo necessário.</small></p></div></div><div class="guidedReviewRequirementList">${important.map(x=>`<button type="button" data-focus-field="${x.field}" data-focus-step="${x.step}"><span>${x.level==='required'?'Necessário':'Recomendado'}</span><b>${x.title}</b><small>${x.why}</small><i>Corrigir →</i></button>`).join('')}</div>`;
 }
 function refreshAll(){refreshAutomation();refreshAutomationMode();refreshOnboardingStatus();refreshOperationSummary();refreshFinance();refreshNeeds();refreshReview()}
 let refreshQueued=false;
 function scheduleRefresh(){
  if(refreshQueued)return;refreshQueued=true;
  requestAnimationFrame(()=>{refreshQueued=false;refreshAll()});
 }

 function showStep(step,scroll=true){
  currentStep=Math.max(1,Math.min(4,Number(step)||1));document.body.classList.add('guidedReady');
  setup.querySelectorAll('[data-guided-step]').forEach(x=>x.classList.toggle('guidedStepActive',Number(x.dataset.guidedStep)===currentStep));
  document.querySelectorAll('[data-guided-nav]').forEach(b=>{const n=Number(b.dataset.guidedNav);b.classList.toggle('active',n===currentStep);b.classList.toggle('done',n<currentStep)});
  byId('guidedBack').hidden=currentStep===1;byId('guidedNext').hidden=currentStep===4;
  const nextLabels={1:'Continuar para operação',2:'Continuar com estas premissas',3:'Revisar diagnóstico'};if(byId('guidedNext'))byId('guidedNext').textContent=nextLabels[currentStep]||'Continuar';
  byId('guidedStepText').textContent=`Etapa ${currentStep} de 4`;if(byId('erpStepMeta'))byId('erpStepMeta').textContent=`Etapa ${currentStep} de 4`;refreshAll();
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
  prepareCompanyStep(panels[0]);prepareOperationStep(panels[1]);prepareFinanceStep(panels[2]);prepareEconomicStep(panels[3]);createReviewPanel();attachImportPanel();createAutomationModePanel();createOnboardingStatus();
  document.querySelectorAll('[data-guided-nav]').forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.guidedNav)));
  byId('guidedBack').addEventListener('click',()=>showStep(currentStep-1));byId('guidedNext').addEventListener('click',()=>showStep(currentStep+1));
  document.addEventListener('click',e=>{const accept=e.target.closest?.('#acceptTaxTreatmentSuggestion');if(accept){e.preventDefault();confirmTaxTreatment('suggestion');return}const focus=e.target.closest?.('[data-focus-field]');if(focus){e.preventDefault();focusGuidedField(focus.dataset.focusField,Number(focus.dataset.focusStep)||1);return}const go=e.target.closest?.('[data-go-step]');if(go){e.preventDefault();showStep(Number(go.dataset.goStep)||1)}});
  document.addEventListener('input',e=>{
   if(['mix30','mix40','mix60','mixZero'].includes(e.target?.id)&&e.isTrusted)confirmTaxTreatment('manual');
   if(e.target?.id==='cnpj'&&e.isTrusted)resetTaxTreatmentConfirmation();
   scheduleRefresh();
  });
  document.addEventListener('change',e=>{
   if(e.target?.id==='professionalReduction30'&&['yes','no'].includes(e.target.value))confirmTaxTreatment('manual');
   scheduleRefresh();
  });
  const status=byId('lookupStatus');if(status)new MutationObserver(()=>setTimeout(refreshAll,50)).observe(status,{childList:true,subtree:true,characterData:true});
  const observer=new MutationObserver(()=>{if(attachImportPanel()){observer.disconnect();showStep(currentStep,false);refreshAutomationMode()}});observer.observe(setup,{childList:true});
  document.addEventListener('brmi:import-ready',()=>{attachImportPanel();showStep(currentStep,false);refreshAutomationMode();refreshAll()});document.addEventListener('brmi:automation-mode',refreshAutomationMode);document.addEventListener('brmi:automation-applied',refreshAll);
  // Atualizações do importador chegam pelos eventos brmi:* acima. Não observar o setup inteiro evita loop de DOM no mobile.
  relabel('monthlyRevenue','Faturamento médio mensal','Informe se souber. Caso contrário, envie os documentos logo abaixo e deixe o sistema procurar o valor.');
  relabel('rbt12','Faturamento bruto dos últimos 12 meses','Informe se souber. Receita líquida da DRE não será tratada automaticamente como faturamento bruto.');
  if(byId('monthlyRevenue'))byId('monthlyRevenue').placeholder='Informe o valor';
  if(byId('rbt12'))byId('rbt12').placeholder='Informe o valor';
  if(byId('taxTreatmentAccepted')?.value==='yes')confirmTaxTreatment('suggestion');
  else if(['yes','no'].includes(value('professionalReduction30')))confirmTaxTreatment('manual');
  showStep(1,false);setTimeout(refreshAll,600);
 }

 setTimeout(init,0);
})();
