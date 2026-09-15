window.diagnosisGenerated=false;
window.diagnosisDirty=true;
window.diagnosisRunning=false;

function diagnosisDelay(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

function openDiagnosisReport(){
 const modal=$('reportModal'),mount=$('resultsMount');
 if(!modal||!mount||mount.hidden)return;
 modal.hidden=false;document.body.classList.add('reportOpen');modal.scrollTop=0;
 setTimeout(()=>$('reportCloseBtn')?.focus(),50);
}
function closeDiagnosisReport(){
 const modal=$('reportModal');if(!modal)return;modal.hidden=true;document.body.classList.remove('reportOpen');
}
function printDiagnosisReport(){
 if(!window.diagnosisGenerated)return;
 openDiagnosisReport();
 document.body.classList.add('printingReport');
 requestAnimationFrame(()=>window.print());
}
window.openDiagnosisReport=openDiagnosisReport;
window.closeDiagnosisReport=closeDiagnosisReport;
window.printDiagnosisReport=printDiagnosisReport;

function diagnosisMarkup(){
 return `<section class="panel diagnosisGate" id="diagnosisGate">
  <div class="diagnosisIntro">
   <div><span class="diagnosisEyebrow">Etapa final</span><h2>Pronto para gerar o diagnóstico?</h2><p>Vamos cruzar enquadramento, regimes aplicáveis, carga tributária, créditos, competitividade e caixa antes de revelar o resultado.</p></div>
   <div class="diagnosisChecks"><span>Regimes aplicáveis</span><span>2027 a 2033</span><span>Crédito B2B</span><span>Split e caixa</span></div>
  </div>
  <div id="diagnosisValidation" class="diagnosisValidation" hidden role="alert"></div>
  <button id="generateDiagnosisBtn" class="diagnosisButton" type="button"><span>Gerar diagnóstico</span><small>Processar cenários e recomendações</small></button>
  <div id="diagnosisWork" class="diagnosisWork" hidden aria-live="polite" aria-busy="true">
   <div class="diagnosisWorkHead"><span class="diagHourglass" aria-hidden="true">⌛</span><div><strong id="diagnosisWorkTitle">Preparando análise...</strong><small id="diagnosisWorkText">Organizando as premissas informadas.</small></div><b id="diagnosisProgressText">0%</b></div>
   <div class="diagnosisProgress"><i id="diagnosisProgressBar"></i></div>
   <ol id="diagnosisSteps" class="diagnosisSteps"></ol>
  </div>
  <div id="diagnosisDone" class="diagnosisDone" hidden></div>
 </section>`;
}

function diagnosisStages(){
 const e=simpleEligibility();
 const regimes=e.confirmed?'Simples puro, híbrido, Presumido e Real':'regimes fora do Simples confirmados para o caso';
 return[
  ['Validando enquadramento e premissas','Conferindo faturamento, elegibilidade, composição das receitas e parâmetros informados.'],
  ['Comparando regimes aplicáveis',`Calculando ${regimes}, sem exibir alternativas incompatíveis com o enquadramento informado.`],
  ['Calculando créditos e competitividade B2B','Estimando créditos das aquisições, crédito do cliente e efeito comercial conforme o tratamento das operações.'],
  ['Projetando 2027 a 2033','Aplicando a transição anual e comparando a decisão de curto e longo prazo.'],
  ['Estimando impacto no caixa','Calculando split payment, perda de float, reserva financeira, capital de giro e custo da dívida.'],
  ['Consolidando recomendação','Organizando o diagnóstico executivo e os próximos passos.']
 ];
}

function validateDiagnosisInputs(){
 const errors=[];
 if(num('monthlyRevenue')<=0)errors.push('Informe um faturamento médio mensal maior que zero.');
 if(num('rbt12')<=0)errors.push('Informe a receita acumulada em 12 meses (RBT12).');
 const mix=['mixFull','mix30','mix40','mix60','mixZero'].reduce((s,id)=>s+num(id),0);
 if(Math.abs(mix-100)>.01)errors.push(`A composição do faturamento precisa somar 100%. No momento soma ${mix.toLocaleString('pt-BR',{maximumFractionDigits:1})}%.`);
 return errors;
}

function renderDiagnosisSteps(activeIndex=-1,completeThrough=-1){
 const list=$('diagnosisSteps');if(!list)return;const stages=diagnosisStages();
 list.innerHTML=stages.map((stage,i)=>{
  const state=i<=completeThrough?'done':i===activeIndex?'active':'pending';
  const icon=state==='done'?'✓':state==='active'?'⌛':String(i+1).padStart(2,'0');
  return `<li class="${state}"><span>${icon}</span><div><strong>${stage[0]}</strong><small>${stage[1]}</small></div></li>`;
 }).join('');
}

function setDiagnosisProgress(index){
 const stages=diagnosisStages(),pctValue=Math.round(((index+1)/stages.length)*100);
 if($('diagnosisProgressBar'))$('diagnosisProgressBar').style.width=`${pctValue}%`;
 if($('diagnosisProgressText'))$('diagnosisProgressText').textContent=`${pctValue}%`;
 if($('diagnosisWorkTitle'))$('diagnosisWorkTitle').textContent=stages[index][0];
 if($('diagnosisWorkText'))$('diagnosisWorkText').textContent=stages[index][1];
 renderDiagnosisSteps(index,index-1);
}

function markDiagnosisDirty(reason='input'){
 window.diagnosisDirty=true;
 const mount=$('resultsMount');
 if(window.diagnosisGenerated&&mount)mount.hidden=true;
 if(window.diagnosisGenerated)closeDiagnosisReport();
 const btn=$('generateDiagnosisBtn');
 if(btn&&!window.diagnosisRunning){
  btn.querySelector('span').textContent=window.diagnosisGenerated?'Atualizar diagnóstico':'Gerar diagnóstico';
  btn.querySelector('small').textContent=window.diagnosisGenerated?'As premissas foram alteradas. Reprocesse os cenários.':'Processar cenários e recomendações';
 }
 const done=$('diagnosisDone');
 if(done&&window.diagnosisGenerated){done.hidden=false;done.className='diagnosisDone stale';done.textContent='Premissas alteradas. O resultado anterior foi ocultado para evitar a leitura de números desatualizados.'}
 if(typeof revenueRateFactor==='function')revenueRateFactor();
 if(typeof financialMetrics==='function')financialMetrics();
 if(typeof refreshEligibilityUi==='function')refreshEligibilityUi();
}

async function generateDiagnosis(){
 if(window.diagnosisRunning)return;
 const errors=validateDiagnosisInputs(),validation=$('diagnosisValidation');
 if(errors.length){validation.hidden=false;validation.innerHTML=`<strong>Revise antes de gerar:</strong><ul>${errors.map(x=>`<li>${x}</li>`).join('')}</ul>`;validation.scrollIntoView({behavior:'smooth',block:'center'});return}
 validation.hidden=true;validation.innerHTML='';
 window.diagnosisRunning=true;window.diagnosisDirty=false;
 const btn=$('generateDiagnosisBtn'),work=$('diagnosisWork'),done=$('diagnosisDone'),mount=$('resultsMount'),result=$('resultado'),print=$('printBtn');
 if(btn){btn.disabled=true;btn.classList.add('working');btn.querySelector('span').textContent='Gerando diagnóstico...';btn.querySelector('small').textContent='A análise levará alguns segundos para consolidar os cenários aplicáveis';}
 closeDiagnosisReport();if(mount)mount.hidden=true;if(result)result.hidden=false;if(print)print.hidden=true;
 if(done)done.hidden=true;if(work)work.hidden=false;
 renderDiagnosisSteps(0,-1);if($('diagnosisProgressBar'))$('diagnosisProgressBar').style.width='0%';if($('diagnosisProgressText'))$('diagnosisProgressText').textContent='0%';
 const durations=[700,850,850,950,950,750];
 try{
  for(let i=0;i<diagnosisStages().length;i++){
   setDiagnosisProgress(i);
   if(i===1||i===3||i===5)calculate();
   await diagnosisDelay(durations[i]);
  }
  renderDiagnosisSteps(-1,diagnosisStages().length-1);
  if($('diagnosisProgressBar'))$('diagnosisProgressBar').style.width='100%';if($('diagnosisProgressText'))$('diagnosisProgressText').textContent='100%';
  calculate();await diagnosisDelay(300);
  window.diagnosisGenerated=true;window.diagnosisDirty=false;
  if(work)work.hidden=true;if(mount)mount.hidden=false;if(result){result.hidden=false;result.classList.remove('diagnosisReveal');void result.offsetWidth;result.classList.add('diagnosisReveal')};if(print)print.hidden=false;
  if(done){const now=new Date();done.hidden=false;done.className='diagnosisDone ready';done.innerHTML=`<span>Diagnóstico gerado às ${now.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}. O relatório foi aberto em uma janela própria para leitura e impressão.</span><button id="reopenReportBtn" type="button">Abrir relatório novamente</button>`;$('reopenReportBtn')?.addEventListener('click',openDiagnosisReport)}
  if(btn){btn.disabled=false;btn.classList.remove('working');btn.querySelector('span').textContent='Atualizar diagnóstico';btn.querySelector('small').textContent='Reprocessar com as premissas atuais';}
  openDiagnosisReport();
 }catch(err){
  console.error(err);if(work)work.hidden=true;validation.hidden=false;validation.textContent='Não foi possível concluir o diagnóstico. Revise os dados e tente novamente.';if(btn){btn.disabled=false;btn.classList.remove('working');btn.querySelector('span').textContent='Tentar novamente';btn.querySelector('small').textContent='Processar cenários e recomendações';}
 }finally{window.diagnosisRunning=false}
}

function initDiagnosisFlow(){
 const setup=$('setupMount');if(!setup||$('diagnosisGate'))return;
 setup.insertAdjacentHTML('beforeend',diagnosisMarkup());
 const mount=$('resultsMount');if(mount)mount.hidden=true;
 const print=$('printBtn');if(print)print.hidden=true;
 renderDiagnosisSteps();
 $('generateDiagnosisBtn')?.addEventListener('click',generateDiagnosis);
 $('reportCloseBtn')?.addEventListener('click',closeDiagnosisReport);
 $('reportPrintBtn')?.addEventListener('click',printDiagnosisReport);
 $('reportModal')?.addEventListener('click',e=>{if(e.target===$('reportModal'))closeDiagnosisReport()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('reportModal')?.hidden)closeDiagnosisReport()});
 window.addEventListener('afterprint',()=>document.body.classList.remove('printingReport'));
}
