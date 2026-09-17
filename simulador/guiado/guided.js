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
  panel.dataset.guidedStep='2';
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
   const intro=document.createElement('div');intro.className='guidedFinancialIntro';intro.innerHTML='<strong>Prefira importar BP e DRE.</strong><p>O preenchimento manual permanece disponível, mas os documentos reduzem trabalho e aumentam a consistência dos cálculos de lucro, caixa, dívida e custo financeiro.</p>';
   title.insertAdjacentElement('afterend',intro);
   const cards=document.createElement('div');cards.className='guidedFinanceCards';cards.id='guidedFinanceCards';intro.insertAdjacentElement('afterend',cards);
   const d=detailsBox('Revisar ou complementar os dados contábeis');const body=d.querySelector('.guidedReviewDetailsBody');
   [...panel.children].filter(x=>x.classList?.contains('grid4')||x.classList?.contains('advanced')).forEach(x=>body.appendChild(x));
   cards.insertAdjacentElement('afterend',d);
  }
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
  const panel=byId('importPanel'),finance=byId('cashReserve')?.closest('.panel');if(!panel)return false;
  panel.dataset.guidedStep='3';if(finance&&panel.nextElementSibling!==finance)finance.parentNode.insertBefore(panel,finance);return true;
 }

 function refreshAutomation(){
  const card=byId('companyCard'),box=byId('guidedAutomation');if(!box||!card||card.hidden){if(box)box.hidden=true;return}
  const mix=[['mixFull','Integral'],['mix30','Redução de 30%'],['mix40','Redução de 40%'],['mix60','Redução de 60%'],['mixZero','Alíquota zero']].filter(([id])=>numeric(id)>0).map(([id,n])=>`${n}: ${percent(numeric(id))}`).join(' · ');
  box.hidden=false;box.innerHTML=`<div class="guidedAutomationHead"><div><strong>Pré-diagnóstico automático criado pelo CNPJ e CNAE</strong><p>${escapeHtml(byId('companyCnae')?.textContent||value('activity'))}</p></div><span>REVISÁVEL</span></div><div class="guidedAutomationGrid"><div class="guidedAutoItem"><span>Vendas para empresas</span><b>${percent(numeric('b2bPct'))}</b></div><div class="guidedAutoItem"><span>Compras com tributos na nota</span><b>${percent(numeric('purchasesPct'))}</b></div><div class="guidedAutoItem"><span>Compras potencialmente creditáveis</span><b>${percent(numeric('eligibleCreditPct'))}</b></div><div class="guidedAutoItem"><span>Fornecedores no regime regular</span><b>${percent(numeric('regularSuppliersPct'))}</b></div><div class="guidedAutoItem"><span>Tratamento sugerido</span><b>${escapeHtml(mix||'A revisar')}</b></div><div class="guidedAutoItem"><span>Simples Nacional</span><b>${escapeHtml(byId('simpleStatus')?.selectedOptions?.[0]?.textContent||'Não confirmado')}</b></div><div class="guidedAutoItem"><span>Anexo sugerido</span><b>${escapeHtml(value('annex')||'Não aplicável')}</b></div><div class="guidedAutoItem"><span>Atividade</span><b>${escapeHtml((value('activity')||'Não identificada').slice(0,55))}</b></div></div>`;
 }

 function refreshFinance(){
  const box=byId('guidedFinanceCards');if(!box)return;
  const rate=value('financeRate');box.innerHTML=`<div><span>Reserva financeira</span><b>${numeric('cashReserve')?money.format(numeric('cashReserve')):'Aguardando BP'}</b></div><div><span>Capital de giro líquido</span><b>${value('workingCapitalNet')!==''?money.format(numeric('workingCapitalNet')):'Aguardando BP'}</b></div><div><span>Dívida financeira média</span><b>${numeric('debtAverage')?money.format(numeric('debtAverage')):'Aguardando BP'}</b></div><div><span>Custo financeiro anual</span><b>${rate!==''?percent(rate):'Aguardando BP e DRE'}</b></div>`;
 }

 function refreshReview(){
  const grid=byId('guidedReviewGrid'),warnings=byId('guidedReviewWarnings');if(!grid||!warnings)return;
  const cards=[['Empresa',byId('companyName')?.textContent||value('activity')||'Não identificada'],['Faturamento anual',numeric('rbt12')?money.format(numeric('rbt12')):'Não informado'],['Regime atual',byId('simpleStatus')?.selectedOptions?.[0]?.textContent||'Não confirmado'],['Vendas para empresas',percent(numeric('b2bPct'))],['Compras com tributos na nota',percent(numeric('purchasesPct'))],['Crédito possível nas compras',percent(numeric('eligibleCreditPct'))],['Reserva financeira',numeric('cashReserve')?money.format(numeric('cashReserve')):'Não informada'],['Lucro contábil',numeric('realAccountingProfitAnnual')?money.format(numeric('realAccountingProfitAnnual')):'Não informado'],['Carga atual de consumo',numeric('currentConsumptionTaxAnnual')?money.format(numeric('currentConsumptionTaxAnnual')):'A calcular']];
  grid.innerHTML=cards.map(([a,b])=>`<div><span>${escapeHtml(a)}</span><b>${escapeHtml(b)}</b></div>`).join('');
  const notes=[];if(!numeric('rbt12'))notes.push('Informe o faturamento anual para liberar o diagnóstico.');if(value('simpleStatus')==='unknown')notes.push('Confirme se a empresa está ou não no Simples Nacional.');if(!numeric('cashReserve'))notes.push('Sem BP, a análise de caixa ficará menos precisa.');if(!numeric('realAccountingProfitAnnual'))notes.push('Sem lucro contábil, o Lucro Real não entrará no ranking completo.');if(!numeric('currentConsumptionTaxAnnual')&&value('simpleStatus')!=='yes')notes.push('Informe ou importe a carga atual dos tributos sobre consumo para medir preço e margem.');
  warnings.innerHTML=notes.length?notes.map(x=>`<div>${escapeHtml(x)}</div>`).join(''):'<div class="ok">Os dados essenciais estão preenchidos. O diagnóstico pode ser gerado.</div>';
 }

 function refreshAll(){refreshAutomation();refreshFinance();refreshReview()}

 function showStep(step,scroll=true){
  currentStep=Math.max(1,Math.min(4,Number(step)||1));document.body.classList.add('guidedReady');
  setup.querySelectorAll('[data-guided-step]').forEach(x=>x.classList.toggle('guidedStepActive',Number(x.dataset.guidedStep)===currentStep));
  document.querySelectorAll('[data-guided-nav]').forEach(b=>{const n=Number(b.dataset.guidedNav);b.classList.toggle('active',n===currentStep);b.classList.toggle('done',n<currentStep)});
  byId('guidedBack').hidden=currentStep===1;byId('guidedNext').hidden=currentStep===4;byId('guidedStepText').textContent=`Etapa ${currentStep} de 4`;refreshAll();if(scroll)byId('guidedNav')?.scrollIntoView({behavior:'smooth',block:'start'});
 }

 function init(){
  const panels=[...setup.querySelectorAll(':scope > .panel')].filter(x=>!x.id);
  if(panels.length<4)return;
  prepareCompanyStep(panels[0]);prepareOperationStep(panels[1]);prepareFinanceStep(panels[2]);prepareEconomicStep(panels[3]);createReviewPanel();attachImportPanel();
  document.querySelectorAll('[data-guided-nav]').forEach(b=>b.addEventListener('click',()=>showStep(b.dataset.guidedNav)));
  byId('guidedBack').addEventListener('click',()=>showStep(currentStep-1));byId('guidedNext').addEventListener('click',()=>showStep(currentStep+1));
  document.addEventListener('input',refreshAll);document.addEventListener('change',refreshAll);
  const status=byId('lookupStatus');if(status)new MutationObserver(()=>setTimeout(refreshAll,50)).observe(status,{childList:true,subtree:true,characterData:true});
  const observer=new MutationObserver(()=>{if(attachImportPanel()){observer.disconnect();showStep(currentStep,false)}});observer.observe(setup,{childList:true});
  relabel('monthlyRevenue','Faturamento médio mensal','Informe um valor aproximado. O total dos últimos 12 meses será sincronizado.');
  relabel('rbt12','Faturamento dos últimos 12 meses','Valor usado para testar enquadramento e comparar os regimes aplicáveis.');
  showStep(1,false);setTimeout(refreshAll,600);
 }

 setTimeout(init,0);
})();
