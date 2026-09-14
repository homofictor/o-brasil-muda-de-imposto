function renderYearButtons(){
  $('yearButtons').innerHTML=years.map(y=>`<button type="button" data-year="${y}" class="${y===selectedYear?'active':''}">${y}</button>`).join('');
  $('yearButtons').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selectedYear=Number(b.dataset.year);calculate()}));
}
function renderTimeline(all){
  $('timelineBody').innerHTML=all.map(r=>{
    const rec=recommendation(r);
    return `<tr class="${r.year===selectedYear?'selected':''}"><td><b>${r.year}</b></td><td>${pct1(r.rr.cbs*r.factor)}</td><td>${pct1(r.rr.ibs*r.factor)}</td><td>${brl.format(r.grossVat)}</td><td>${brl.format(r.inputCredit)}</td><td>${brl.format(r.netVat)}</td><td>${brl.format(r.embedded)}</td><td class="best">${rec.title}</td></tr>`;
  }).join('');
}
function renderVatSummary(r){
  const full=r.rr.cbs+r.rr.ibs;
  $('vatSummary').innerHTML=`<div><span>Alíquota regular ponderada</span><strong>${pct1(r.grossRegularRate)}</strong><small>Referência cheia do ano: ${pct1(full)} · fator médio da composição: ${pct1(r.factor)}</small></div><div><span>Débito bruto anual</span><strong>${brl.format(r.grossVat)}</strong><small>Valor antes dos créditos de compras.</small></div><div><span>Carga líquida anual de IBS/CBS</span><strong>${brl.format(r.netVat)}</strong><small>Créditos estimados: ${brl.format(r.inputCredit)}.</small></div>`;
}
function renderModels(r,rec){
  const map={pure:{sub:'Tudo na guia do Simples',pros:'Guia única e menor complexidade',cons:'Crédito do cliente limitado ao IBS/CBS devido no Simples'},hybrid:{sub:'Simples + IBS/CBS no regime regular',pros:'Crédito integral de IBS/CBS para B2B e créditos de insumos',cons:'Apuração adicional, controles e custo operacional'},presumed:{sub:'Fora do Simples, cenário preliminar',pros:'Pode ser competitivo conforme atividade e margem',cons:'IRPJ, CSLL, CPP e tributos de transição exigem validação'},real:{sub:'Fora do Simples, lucro efetivo estimado',pros:'Tributa o lucro estimado e aproveita créditos do regime regular',cons:'Maior complexidade, ajustes fiscais e controles contábeis'}};
  $('modelCards').innerHTML=r.models.map(m=>{
    const e=r.annualRevenue>0?m.total/r.annualRevenue:0;const rows=[];
    if(m.key==='pure')rows.push(['DAS',r.das],['IBS/CBS embutido no DAS',r.embedded],['Crédito potencial ao B2B',r.pureClientCredit]);
    if(m.key==='hybrid')rows.push(['DAS sem IBS/CBS',r.dasWithout],['IBS/CBS líquido por fora',r.netVat],['Custo operacional informado',r.hybridCompliance],['Crédito potencial ao B2B',r.hybridClientCredit]);
    if(m.key==='presumed')rows.push(['IBS/CBS líquido',r.netVat],['IRPJ + CSLL',r.irpj+r.csll],['CPP estimada',r.cpp],['ICMS/ISS residual estimado',r.legacy],['Custo operacional informado',r.fullCompliance]);
    if(m.key==='real')rows.push(['IBS/CBS líquido',r.netVat],['IRPJ + CSLL',r.realIrpj+r.realCsll],['CPP estimada',r.cpp],['ICMS/ISS residual estimado',r.legacy],['Custo operacional informado',r.fullCompliance]);
    return `<article class="modelCard ${rec.key===m.key?'recommended':''}">${rec.key===m.key?'<span class="badge">★ RECOMENDADO</span>':''}<h3>${m.name}</h3><div class="sub">${map[m.key].sub}</div><div class="bigMoney">${brl.format(m.total)}</div><div class="eff">Saída anual estimada · ${pct1(e)} do faturamento</div><div class="modelRows">${rows.map(x=>`<div><span>${x[0]}</span><b>${brl.format(x[1])}</b></div>`).join('')}</div><div class="proscons"><p class="pros">✓ ${map[m.key].pros}</p><p class="cons">! ${map[m.key].cons}</p></div></article>`;
  }).join('');
}
function renderCompetition(r){
  const risk=riskScore(r);$('riskNumber').textContent=`${risk.score}/100`;$('riskLabel').textContent=`Risco ${risk.label.toLowerCase()}`;$('riskMeter').style.width=`${risk.score}%`;$('riskDrivers').innerHTML=risk.drivers.map(x=>`<li>${x}</li>`).join('');
  $('pureClientCredit').textContent=brl.format(r.pureClientCredit);$('hybridClientCredit').textContent=brl.format(r.hybridClientCredit);$('extraClientCredit').textContent=brl.format(r.extraClientCredit);$('breakEvenCapture').textContent=Number.isFinite(r.breakEvenCapture)?pct1(r.breakEvenCapture):'Não aplicável';
  if(r.extraHybridCost<=0)$('competitionInsight').textContent='O híbrido já apresenta saída tributária estimada igual ou menor que o Simples puro. Nesse caso, o ganho de crédito B2B reforça a vantagem, sem depender de monetização comercial adicional.';
  else if(!Number.isFinite(r.breakEvenCapture))$('competitionInsight').textContent='Sem vendas B2B informadas, o crédito repassado ao cliente não cria argumento comercial relevante para justificar a carga adicional do regime híbrido.';
  else $('competitionInsight').innerHTML=`O híbrido custa <strong>${brl.format(r.extraHybridCost)}</strong> a mais por ano, mas entrega <strong>${brl.format(r.extraClientCredit)}</strong> adicionais de crédito aos clientes PJ. Para compensar apenas pela relação comercial, a empresa precisaria capturar pelo menos <strong>${pct1(r.breakEvenCapture)}</strong> das vendas B2B em preço, margem, retenção ou volume. A captura comercial informada é ${pct1(r.capture)}.`;
}
function renderCash(r){
  const c=cashMetrics(r);$('workingCapital').textContent=brl.format(c.working);$('workingCapitalText').textContent='Reposição do float atual mais eventual retenção temporária excedente, nas premissas informadas.';$('grossSplit').textContent=brl.format(c.grossMonthly);$('floatReplacement').textContent=brl.format(c.floatReplacement);$('temporaryExcess').textContent=brl.format(c.temporaryExcess);$('financingGap').textContent=brl.format(c.gap);$('financingCost').textContent=brl.format(c.cost);$('cashPer100').textContent=brl2.format(c.cash100);
}
