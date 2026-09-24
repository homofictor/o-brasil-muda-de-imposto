(function(){
 const byId=id=>document.getElementById(id);
 const money=v=>Number.isFinite(v)&&typeof brl2!=='undefined'?brl2.format(v):'—';
 const pct=v=>Number.isFinite(v)&&typeof pct1==='function'?pct1(v):'—';
 function validRegularPair(r){
  const m=(r?.models||[]).filter(x=>x.valid!==false&&Number.isFinite(x.total)&&['real','presumed'].includes(x.key)).sort((a,b)=>a.total-b.total);
  return m.length===2?m:null;
 }
 function renderSetup(r){
  const mode=byId('profitProjectionMode')?.value||'sensitivity',projected=byId('projectedRealProfitAnnual');
  if(projected){
   projected.disabled=mode==='historical';
   projected.closest('.field')?.classList.toggle('projectionDisabled',mode==='historical');
  }
  const be=byId('profitBreakEvenSetup'),status=byId('profitProjectionStatus');
  if(be)be.textContent=r?.breakEven?money(r.breakEven.profit)+' por ano · '+pct(r.breakEven.margin)+' do faturamento':'Ainda não calculável com os dados atuais.';
  if(status){
   if(mode==='manual')status.textContent=r?.projectedProfitKnown?'A comparação prospectiva usa o lucro anual projetado informado para o cenário.':'Informe o lucro anual projetado para o cenário. Até lá, o histórico permanece apenas como referência.';
   else if(mode==='historical')status.textContent='O resultado histórico está sendo usado como hipótese de cenário por escolha do usuário. Isso não o transforma em previsão.';
   else status.textContent=r?.projectedProfitKnown?'A projeção informada passou a substituir o histórico na comparação prospectiva.':'O histórico é apenas referência. O relatório destacará o ponto de indiferença e a sensibilidade à margem futura.';
  }
 }
 function renderReport(r){
  const section=document.querySelector('.profitSensitivitySection');if(!section)return;
  const pair=validRegularPair(r),be=r?.breakEven,mode=r?.projectionMode||'sensitivity';
  section.hidden=!(pair&&be);
  if(section.hidden)return;
  const hist=byId('sensHistoricalProfit'),proj=byId('sensProjectedProfit'),alert=byId('profitSensitivityAlert');
  if(hist)hist.textContent=r.historicalProfitKnown?money(r.historicalAccountingProfit):'Não informado';
  const source=byId('realAccountingProfitAnnual')?.dataset?.importSource||'',yearMatch=String(source).match(/20\d{2}/),sourceYear=yearMatch?yearMatch[0]:'';
  if(byId('sensHistoricalNote'))byId('sensHistoricalNote').textContent=r.historicalProfitKnown?((r.historicalAccountingProfit<0?'Prejuízo histórico':'Resultado histórico')+(sourceYear?' de '+sourceYear:'')+'. Não é projeção automática de 2027.'):'Sem DRE histórica suficiente.';
  if(proj)proj.textContent=r.projectedProfitKnown?money(r.projectedAccountingProfit):'Não informado';
  if(byId('sensProjectedNote'))byId('sensProjectedNote').textContent=r.projectedProfitKnown?'Valor prospectivo informado pelo usuário.':mode==='historical'?'Histórico usado como hipótese por escolha do usuário.':'A análise permanece em modo de sensibilidade.';
  if(byId('sensBreakEvenProfit'))byId('sensBreakEvenProfit').textContent=money(be.profit);
  if(byId('sensBreakEvenMargin'))byId('sensBreakEvenMargin').textContent='aprox. '+pct(be.margin)+' do faturamento anual';
  let decision='Resultado sensível à lucratividade',note='A posição muda quando o lucro tributável atravessa o ponto de indiferença.';
  if(r.projectedProfitKnown){
   decision=r.projectedAccountingProfit<be.profit?'Lucro Real à frente na projeção':r.projectedAccountingProfit>be.profit?'Lucro Presumido à frente na projeção':'Regimes próximos no ponto de indiferença';
   note='Leitura baseada no lucro anual projetado informado para o cenário.';
  }else if(mode==='historical'){
   decision=r.historicalAccountingProfit<be.profit?'Lucro Real à frente no cenário histórico':'Lucro Presumido à frente no cenário histórico';
   note='Este cenário usa o histórico por escolha do usuário e não deve ser tratado como previsão.';
  }
  if(byId('sensDecision'))byId('sensDecision').textContent=decision;
  if(byId('sensDecisionNote'))byId('sensDecisionNote').textContent=note;
  if(alert){
   const profitField=byId('realAccountingProfitAnnual'),fiscalMismatch=profitField?.dataset?.importFiscalMismatch==='1',irpjProv=Number(profitField?.dataset?.importIrpjExpense||0),csllProv=Number(profitField?.dataset?.importCsllExpense||0);
   alert.className='profitSensitivityAlert '+(r.realDecisionSensitive||fiscalMismatch?'warning':'');
   const base=r.realDecisionSensitive?'<strong>Resultado condicionado à lucratividade futura.</strong> A DRE histórica explica a posição atual, mas não basta para afirmar qual regime será mais vantajoso em 2027.':'<strong>Projeção prospectiva disponível.</strong> A comparação usa a projeção informada, mantendo o histórico apenas como referência.';
   const mismatch=fiscalMismatch?'<span><b>Atenção fiscal:</b> a DRE registra resultado contábil negativo e também provisão de IRPJ/CSLL'+((irpjProv+csllProv)>0?' de aproximadamente '+money(irpjProv+csllProv):'')+'. Não assuma base fiscal zero sem conferir adições, exclusões, compensações e o e-Lalur/e-Lacs.</span>':'';
   alert.innerHTML=base+mismatch;
  }
  const tbody=byId('profitSensitivityBody');
  if(tbody)tbody.innerHTML=(r.profitSensitivity||[]).map(s=>'<tr><td><strong>'+s.label+'</strong><small>'+pct(s.margin)+' do faturamento</small></td><td>'+money(s.profit)+'</td><td>'+money(s.realTax)+'</td><td>'+money((r.irpj||0)+(r.csll||0))+'</td><td class="'+s.winner+'">'+(s.winner==='equal'?'Equilíbrio aproximado':s.winner==='real'?'Lucro Real tende a ficar à frente':'Lucro Presumido tende a ficar à frente')+'</td></tr>').join('');
  const foot=byId('profitSensitivityFoot');
  if(foot)foot.textContent='Ponto de indiferença aproximado calculado com faturamento, percentuais de presunção, adições, exclusões e compensações informadas. Prejuízo contábil histórico não é tratado automaticamente como prejuízo fiscal nem como previsão de exercícios futuros.';
 }
 function renderOwner(r){
  const be=r?.breakEven,node=byId('ownerProfitBreakEven'),note=byId('ownerProfitBreakEvenNote');if(!node)return;
  node.textContent=be?money(be.profit):'—';
  note.textContent=be?'aprox. '+pct(be.margin)+' do faturamento anual. Abaixo desse ponto, o Real tende a ganhar; acima, o Presumido pode passar à frente.':'Dados insuficientes para calcular.';
 }
 function render(){
  try{
   if(typeof modelForYear!=='function')return;
   const year=typeof selectedYear!=='undefined'?selectedYear:2027,r=modelForYear(year);
   renderSetup(r);renderReport(r);renderOwner(r);
  }catch(err){console.error('Sensibilidade de lucratividade:',err)}
 }
 window.renderProfitSensitivity=render;
 document.addEventListener('change',e=>{if(['profitProjectionMode','projectedRealProfitAnnual'].includes(e.target?.id)){if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('profit-projection');if(typeof calculate==='function')calculate();setTimeout(render,0)}});
 document.addEventListener('input',e=>{if(e.target?.id==='projectedRealProfitAnnual')setTimeout(render,0)});
 setTimeout(render,0);
})();