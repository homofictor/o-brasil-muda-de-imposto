function renderYearButtons(){
 $('yearButtons').innerHTML=years.map(y=>`<button type="button" data-year="${y}" class="${y===selectedYear?'active':''}">${y}</button>`).join('');
 $('yearButtons').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selectedYear=Number(b.dataset.year);calculate()}));
}
function renderTimeline(all){
 $('timelineBody').innerHTML=all.map(r=>{
  const rec=recommendation(r);
  if(r.isMei)return`<tr class="${r.year===selectedYear?'selected':''}"><td><b>${r.year}</b></td><td colspan="6">Cálculo dos Anexos I a V não aplicável ao DAS-MEI</td><td class="best">${rec.title}</td></tr>`;
  const embedded=r.simpleEligible?brl.format(r.embedded):'N/A';
  return`<tr class="${r.year===selectedYear?'selected':''}"><td><b>${r.year}</b></td><td>${pct1(r.rr.cbs*r.factor)}</td><td>${pct1(r.rr.ibs*r.factor)}</td><td>${brl.format(r.grossVat)}</td><td>${brl.format(r.inputCredit)}</td><td>${brl.format(r.netVat)}</td><td>${embedded}</td><td class="best">${rec.title}</td></tr>`
 }).join('');
}
function renderVatSummary(r){
 if(r.isMei){$('vatSummary').innerHTML='<div><span>MEI</span><strong>Regra específica</strong><small>O V3.2 não aplica as faixas dos Anexos I a V ao DAS-MEI.</small></div><div><span>Regime híbrido</span><strong>Não disponível</strong><small>O MEI não pode optar pelo recolhimento regular de IBS/CBS.</small></div><div><span>Próximo passo</span><strong>Validar SIMEI</strong><small>Confirme limite, atividade e regras específicas do MEI.</small></div>';return}
 const full=r.rr.cbs+r.rr.ibs,special=r.share.special&&r.simpleEligible?' A 5ª faixa usa a fórmula especial do teto efetivo do ISS.':'';
 $('vatSummary').innerHTML=`<div><span>Alíquota regular ponderada</span><strong>${pct1(r.grossRegularRate)}</strong><small>Referência cheia do ano: ${pct1(full)} · fator médio da composição: ${pct1(r.factor)}</small></div><div><span>Débito bruto anual</span><strong>${brl.format(r.grossVat)}</strong><small>Valor antes dos créditos de compras.</small></div><div><span>Carga líquida anual de IBS/CBS</span><strong>${brl.format(r.netVat)}</strong><small>Créditos estimados: ${brl.format(r.inputCredit)}.${special}</small></div>`;
}
function renderCash(r){
 const c=cashMetrics(r);if(c.notApplicable){$('workingCapital').textContent='Não aplicável';$('workingCapitalText').textContent='O cenário de split do regime regular não é calculado para MEI.';['grossSplit','floatReplacement','temporaryExcess','financingGap','financingCost'].forEach(id=>$(id).textContent='—');$('cashPer100').textContent='—';return}
 $('workingCapital').textContent=brl.format(c.working);$('workingCapitalText').textContent=`Reposição do float e eventual retenção temporária excedente. Reserva financeira considerada: ${brl.format(num('cashReserve'))}.`;$('grossSplit').textContent=brl.format(c.grossMonthly);$('floatReplacement').textContent=brl.format(c.floatReplacement);$('temporaryExcess').textContent=brl.format(c.temporaryExcess);$('financingGap').textContent=brl.format(c.gap);$('financingCost').textContent=brl.format(c.cost);$('cashPer100').textContent=brl2.format(c.cash100);
}
