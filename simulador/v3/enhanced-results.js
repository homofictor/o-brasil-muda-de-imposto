function moneyPct(amount,revenue){
  const p=revenue>0?amount/revenue:0;
  return `<strong>${brl2.format(amount)}</strong><small>${pct1(p)}</small>`;
}
function currentReference(r){
  const sr=simplesRate(r.annex,num('rbt12'),2033),das=r.annualRevenue*sr.effective,s=splitShares[r.annex],i=sr.idx;
  const cbs=das*(s.cbs33[i]||0)/100,ibs=das*(s.ibs33[i]||0)/100;
  return{cbs,ibs,gross:cbs+ibs,net:cbs+ibs,das,sr};
}
function renderReferenceComparison(all){
  const y27=all.find(x=>x.year===2027),y33=all.find(x=>x.year===2033),cur=currentReference(y27);
  const c27=y27.annualRevenue*y27.rr.cbs*y27.factor,i27=y27.annualRevenue*y27.rr.ibs*y27.factor;
  const c33=y33.annualRevenue*y33.rr.cbs*y33.factor,i33=y33.annualRevenue*y33.rr.ibs*y33.factor;
  const set=(id,html)=>{const e=$(id);if(e)e.innerHTML=html};
  set('cmpCurrentCbs',moneyPct(cur.cbs,y27.annualRevenue));set('cmpCurrentIbs',moneyPct(cur.ibs,y27.annualRevenue));set('cmpCurrentGross',moneyPct(cur.gross,y27.annualRevenue));set('cmpCurrentNet',moneyPct(cur.net,y27.annualRevenue));
  set('cmp2027Cbs',moneyPct(c27,y27.annualRevenue));set('cmp2027Ibs',moneyPct(i27,y27.annualRevenue));set('cmp2027Gross',moneyPct(y27.grossVat,y27.annualRevenue));set('cmp2027Credit',moneyPct(y27.inputCredit,y27.annualRevenue));set('cmp2027Net',moneyPct(y27.netVat,y27.annualRevenue));
  set('cmp2033Cbs',moneyPct(c33,y33.annualRevenue));set('cmp2033Ibs',moneyPct(i33,y33.annualRevenue));set('cmp2033Gross',moneyPct(y33.grossVat,y33.annualRevenue));set('cmp2033Credit',moneyPct(y33.inputCredit,y33.annualRevenue));set('cmp2033Net',moneyPct(y33.netVat,y33.annualRevenue));
}
function renderModels(r,rec){
  const info={
    pure:{sub:'Tudo na guia única do Simples (DAS)',pros:['Guia única e menor complexidade','Sem apuração mensal separada de IBS/CBS','Tende a ser mais simples para vendas a consumidor final'],cons:['Crédito do cliente PJ limitado à parcela de IBS/CBS devida no Simples','Pode perder competitividade em cadeias B2B']},
    hybrid:{sub:'Simples + IBS/CBS pelo regime regular',pros:['Crédito integral de IBS/CBS para clientes B2B','Aproveita créditos elegíveis das aquisições','Pode preservar competitividade em cadeias empresariais'],cons:['Exige apuração mensal adicional','Aumenta controles fiscais e custo operacional']},
    presumed:{sub:'Migração total · Lucro Presumido',pros:['Crédito integral de IBS/CBS ao B2B','Sem teto de faturamento do Simples','Pode ser competitivo em certas margens e atividades'],cons:['IRPJ, CSLL e CPP fora do DAS','Exige validar presunções e efeitos da transição']},
    real:{sub:'Migração total · Lucro Real',pros:['Crédito integral de IBS/CBS ao B2B','Tributação de IRPJ/CSLL ligada ao lucro efetivo estimado','Pode ganhar relevância com margens menores'],cons:['Maior complexidade contábil e fiscal','Ajustes do lucro real e particularidades setoriais não estão totalmente modelados']}
  };
  $('modelCards').innerHTML=r.models.map(m=>{
    const e=r.annualRevenue>0?m.total/r.annualRevenue:0,rows=[];
    if(m.key==='pure')rows.push(['DAS',r.das],['IBS/CBS por fora',0],['Parcela de IBS/CBS no DAS',r.embedded]);
    if(m.key==='hybrid')rows.push(['DAS sem IBS/CBS',r.dasWithout],['IBS/CBS líquido por fora',r.netVat],['Custo operacional informado',r.hybridCompliance]);
    if(m.key==='presumed')rows.push(['IBS/CBS líquido',r.netVat],['IRPJ + CSLL',r.irpj+r.csll],['CPP estimada',r.cpp],['ICMS/ISS residual estimado',r.legacy],['Custo operacional informado',r.fullCompliance]);
    if(m.key==='real')rows.push(['IBS/CBS líquido',r.netVat],['IRPJ + CSLL',r.realIrpj+r.realCsll],['CPP estimada',r.cpp],['ICMS/ISS residual estimado',r.legacy],['Custo operacional informado',r.fullCompliance]);
    const credit=m.key==='pure'?r.pureClientCredit:r.hybridClientCredit;
    return `<article class="modelCard ${rec.key===m.key?'recommended':''}">${rec.key===m.key?'<span class="badge">★ RECOMENDADO</span>':''}<h3>${m.name}</h3><div class="sub">${info[m.key].sub}</div>${m.key!=='pure'?`<div class="scenarioTag">Cenário ${r.year}</div>`:''}<div class="labelMoney">Saída anual estimada</div><div class="bigMoney">${brl2.format(m.total)}</div><div class="eff">Alíquota efetiva ampliada: ${pct1(e)}</div><div class="modelRows">${rows.map(x=>`<div><span>${x[0]}</span><b>${brl2.format(x[1])}</b></div>`).join('')}</div><div class="creditBlock"><span>Crédito repassável ao B2B</span><strong>${brl2.format(credit)}</strong><small>${m.key==='pure'?'Crédito limitado à parcela de IBS/CBS devida no Simples':'100% do IBS/CBS destacado nas operações B2B, antes de particularidades do caso'}</small></div><div class="prosBox"><strong>✓ Vantagens</strong><ul>${info[m.key].pros.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="consBox"><strong>! Atenção</strong><ul>${info[m.key].cons.map(x=>`<li>${x}</li>`).join('')}</ul></div></article>`;
  }).join('');
}
function renderCompetition(r){
  const risk=riskScore(r),marker=$('riskMeter');$('riskNumber').textContent=`${risk.score}/100`;$('riskLabel').textContent=`Risco ${risk.label.toLowerCase()}`;
  if(marker)marker.style.left=`calc(${risk.score}% - 3px)`;
  $('riskDrivers').innerHTML=risk.drivers.map(x=>`<li>${x}</li>`).join('');
  const advice=$('riskAdvice');if(advice){
    advice.className='riskAdvice '+(risk.score>=67?'high':risk.score>=34?'medium':'low');
    advice.textContent=risk.score>=67?'A permanência no Simples 100% merece atenção: a limitação do crédito pode afetar preço, homologação ou retenção de clientes PJ.':risk.score>=34?'Há risco comercial relevante, mas ele depende do peso do B2B e da diferença efetiva de crédito percebida pelos clientes.':'O risco competitivo estimado é baixo nas premissas atuais; a simplicidade e a carga própria tendem a pesar mais na decisão.';
  }
  $('pureClientCredit').textContent=brl.format(r.pureClientCredit);$('hybridClientCredit').textContent=brl.format(r.hybridClientCredit);$('extraClientCredit').textContent=brl.format(r.extraClientCredit);$('breakEvenCapture').textContent=Number.isFinite(r.breakEvenCapture)?pct1(r.breakEvenCapture):'Não aplicável';
  if(r.extraHybridCost<=0)$('competitionInsight').textContent='O híbrido já apresenta saída tributária estimada igual ou menor que o Simples puro. O ganho de crédito B2B reforça a vantagem sem depender de monetização comercial adicional.';
  else if(!Number.isFinite(r.breakEvenCapture))$('competitionInsight').textContent='Sem vendas B2B informadas, o crédito repassado ao cliente não cria argumento comercial relevante para justificar a carga adicional do regime híbrido.';
  else $('competitionInsight').innerHTML=`O híbrido custa <strong>${brl.format(r.extraHybridCost)}</strong> a mais por ano, mas entrega <strong>${brl.format(r.extraClientCredit)}</strong> adicionais de crédito aos clientes PJ. Para compensar apenas pela relação comercial, seria necessário capturar pelo menos <strong>${pct1(r.breakEvenCapture)}</strong> das vendas B2B em preço, margem, retenção ou volume. A captura comercial informada é ${pct1(r.capture)}.`;
}
function initEnhancedResults(){
  const yr=$('yearRange');if(yr){yr.value=selectedYear;yr.addEventListener('input',e=>{selectedYear=Number(e.target.value);calculate()})}
  const reset=$('resetBtn');if(reset)reset.addEventListener('click',()=>{try{localStorage.removeItem('brmi_v3')}catch(_){}location.reload()});
}
