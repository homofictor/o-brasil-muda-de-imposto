function moneyPct(amount,revenue){
 const p=revenue>0?amount/revenue:0;
 return `<strong>${brl2.format(amount)}</strong><small>${pct1(p)}</small>`;
}
function currentReference(r){
 if(!r.simpleEligible)return null;
 const sr=simplesRate(r.annex,num('rbt12'),2033),das=r.annualRevenue*sr.effective,s=splitShares[r.annex],i=sr.idx;
 const cbs=das*(s.cbs33[i]||0)/100,ibs=das*(s.ibs33[i]||0)/100;
 return{cbs,ibs,gross:cbs+ibs,net:cbs+ibs,das,sr};
}
function renderEligibilityBanner(r){
 const box=$('eligibilityBanner');if(!box)return;
 if(r.isMei){box.hidden=false;box.className='insight';box.innerHTML='<strong>MEI:</strong> o relatório aplica apenas regras compatíveis com o SIMEI e não apresenta Simples híbrido.';return}
 if(r.eligibility.status==='over_limit'){box.hidden=false;box.className='insight';box.innerHTML=`<strong>Simples Nacional não aplicável à análise prospectiva.</strong> O RBT12 informado é ${brl2.format(r.rbt12)}, acima do limite de ${brl2.format(SIMPLES_LIMIT)}. Simples puro e Simples híbrido foram retirados do comparativo.${r.eligibility.historical?' Eventual condição histórica/transitória deve ser analisada separadamente.':''}`;return}
 if(!r.simpleEligible){box.hidden=false;box.className='insight';box.innerHTML='<strong>Elegibilidade ao Simples não confirmada.</strong> O relatório não trata Simples puro nem híbrido como alternativa disponível. Eventual opção futura depende das demais condições legais.';return}
 box.hidden=true;box.innerHTML='';
}
function renderReferenceComparison(all){
 const y27=all.find(x=>x.year===2027),y33=all.find(x=>x.year===2033),cur=currentReference(y27);
 const c27=y27.annualRevenue*y27.rr.cbs*y27.factor,i27=y27.annualRevenue*y27.rr.ibs*y27.factor;
 const c33=y33.annualRevenue*y33.rr.cbs*y33.factor,i33=y33.annualRevenue*y33.rr.ibs*y33.factor;
 const set=(id,html)=>{const e=$(id);if(e)e.innerHTML=html};
 const na='<strong>N/A</strong><small>Simples não aplicável</small>';
 if(cur){
  set('cmpCurrentCbs',moneyPct(cur.cbs,y27.annualRevenue));set('cmpCurrentIbs',moneyPct(cur.ibs,y27.annualRevenue));set('cmpCurrentGross',moneyPct(cur.gross,y27.annualRevenue));set('cmpCurrentNet',moneyPct(cur.net,y27.annualRevenue));
 }else{
  ['cmpCurrentCbs','cmpCurrentIbs','cmpCurrentGross','cmpCurrentNet'].forEach(id=>set(id,na));
 }
 set('cmp2027Cbs',moneyPct(c27,y27.annualRevenue));set('cmp2027Ibs',moneyPct(i27,y27.annualRevenue));set('cmp2027Gross',moneyPct(y27.grossVat,y27.annualRevenue));set('cmp2027Credit',moneyPct(y27.inputCredit,y27.annualRevenue));set('cmp2027Net',moneyPct(y27.netVat,y27.annualRevenue));
 set('cmp2033Cbs',moneyPct(c33,y33.annualRevenue));set('cmp2033Ibs',moneyPct(i33,y33.annualRevenue));set('cmp2033Gross',moneyPct(y33.grossVat,y33.annualRevenue));set('cmp2033Credit',moneyPct(y33.inputCredit,y33.annualRevenue));set('cmp2033Net',moneyPct(y33.netVat,y33.annualRevenue));
 const title=$('vatCompareTitle');if(title)title.textContent=cur?'IBS/CBS: referência atual × 2027 × 2033':'IBS/CBS no regime regular: 2027 × 2033';
 const curHead=$('currentDasHead');if(curHead)curHead.textContent=cur?'Referência atual no DAS':'Simples / DAS';
 let mobile=$('mobileCompare');
 if(!mobile){mobile=document.createElement('div');mobile.id='mobileCompare';mobile.className='mobileCompare';document.querySelector('.compareWrap')?.after(mobile)}
 const card=(title,subtitle,rows,focus=false)=>`<article class="mobileCompareCard ${focus?'focus':''}"><div class="mobileCompareHead"><strong>${title}</strong><span>${subtitle}</span></div>${rows.map(([label,value])=>`<div class="mobileCompareRow"><span>${label}</span><div>${value}</div></div>`).join('')}</article>`;
 const currentCard=cur?card('Referência atual','Parcela do DAS ligada aos tributos substituídos',[['CBS / federais',moneyPct(cur.cbs,y27.annualRevenue)],['IBS / ICMS-ISS',moneyPct(cur.ibs,y27.annualRevenue)],['Débito bruto',moneyPct(cur.gross,y27.annualRevenue)],['Crédito sobre insumos','—'],['Carga líquida',moneyPct(cur.net,y27.annualRevenue)]])
 :card('Simples / DAS','Não aplicável à análise prospectiva',[['CBS / federais','N/A'],['IBS / ICMS-ISS','N/A'],['Débito bruto','N/A'],['Crédito sobre insumos','N/A'],['Carga líquida','N/A']]);
 mobile.innerHTML=currentCard+card('2027','Início da cobrança regular',[['CBS',moneyPct(c27,y27.annualRevenue)],['IBS',moneyPct(i27,y27.annualRevenue)],['Débito bruto',moneyPct(y27.grossVat,y27.annualRevenue)],['Crédito sobre insumos',moneyPct(y27.inputCredit,y27.annualRevenue)],['Carga líquida',moneyPct(y27.netVat,y27.annualRevenue)]],true)+card('2033','Regime pleno',[['CBS',moneyPct(c33,y33.annualRevenue)],['IBS',moneyPct(i33,y33.annualRevenue)],['Débito bruto',moneyPct(y33.grossVat,y33.annualRevenue)],['Crédito sobre insumos',moneyPct(y33.inputCredit,y33.annualRevenue)],['Carga líquida',moneyPct(y33.netVat,y33.annualRevenue)]]);
}
function renderModels(r,rec){
 const info={
  pure:{sub:'Tudo na guia única do Simples (DAS)',pros:['Guia única e menor complexidade','Sem apuração mensal separada de IBS/CBS','Tende a ser mais simples para vendas a consumidor final'],cons:['Crédito do cliente PJ limitado à parcela de IBS/CBS devida no Simples','Pode perder competitividade em cadeias B2B']},
  hybrid:{sub:'Simples + IBS/CBS pelo regime regular',pros:['Crédito integral de IBS/CBS para clientes B2B','Aproveita créditos elegíveis das aquisições','Pode preservar competitividade em cadeias empresariais'],cons:['Exige apuração mensal adicional','Aumenta controles fiscais e custo operacional']},
  presumed:{sub:'Migração total · Lucro Presumido',pros:['Crédito de IBS/CBS conforme tributação efetivamente incidente','Sem teto de faturamento do Simples','Pode ser competitivo em certas margens e atividades'],cons:['IRPJ, CSLL e CPP fora do DAS','Exige validar presunções e efeitos da transição']},
  real:{sub:'Migração total · Lucro Real',pros:['Crédito de IBS/CBS conforme tributação efetivamente incidente','Tributação de IRPJ/CSLL ligada ao lucro efetivo estimado','Pode ganhar relevância com margens menores'],cons:['Maior complexidade contábil e fiscal','Ajustes do lucro real e particularidades setoriais não estão totalmente modelados']}
 };
 const sectionText=$('modelSectionText');if(sectionText)sectionText.textContent=r.simpleEligible?'O ranking tributário considera impostos estimados e custo operacional informado. A análise comercial aparece separadamente.':'Somente regimes compatíveis com o enquadramento confirmado são exibidos. Simples puro e híbrido não entram no ranking quando a elegibilidade não está confirmada.';
 $('modelCards').innerHTML=r.models.map(m=>{
  const e=r.annualRevenue>0?m.total/r.annualRevenue:0,rows=[];
  if(m.key==='pure')rows.push(['DAS',r.das],['IBS/CBS por fora',0],['Parcela de IBS/CBS no DAS',r.embedded]);
  if(m.key==='hybrid')rows.push(['DAS sem IBS/CBS',r.dasWithout],['IBS/CBS líquido por fora',r.netVat],['Custo operacional informado',r.hybridCompliance]);
  if(m.key==='presumed')rows.push(['IBS/CBS líquido',r.netVat],['IRPJ + CSLL',r.irpj+r.csll],['CPP estimada',r.cpp],['ICMS/ISS residual estimado',r.legacy],['Custo operacional informado',r.fullCompliance]);
  if(m.key==='real')rows.push(['IBS/CBS líquido',r.netVat],['IRPJ + CSLL',r.realIrpj+r.realCsll],['CPP estimada',r.cpp],['ICMS/ISS residual estimado',r.legacy],['Custo operacional informado',r.fullCompliance]);
  const credit=m.key==='pure'?r.pureClientCredit:r.regularClientCredit;
  return `<article class="modelCard ${rec.key===m.key?'recommended':''}">${rec.key===m.key?'<span class="badge">★ RECOMENDADO</span>':''}<h3>${m.name}</h3><div class="sub">${info[m.key].sub}</div>${m.key!=='pure'?`<div class="scenarioTag">Cenário ${r.year}</div>`:''}<div class="labelMoney">Saída anual estimada</div><div class="bigMoney">${brl2.format(m.total)}</div><div class="eff">Alíquota efetiva ampliada: ${pct1(e)}</div><div class="modelRows">${rows.map(x=>`<div><span>${x[0]}</span><b>${brl2.format(x[1])}</b></div>`).join('')}</div><div class="creditBlock"><span>Crédito potencial nas vendas B2B</span><strong>${brl2.format(credit)}</strong><small>${m.key==='pure'?'Limitado à parcela de IBS/CBS devida no Simples':'Calculado com a alíquota efetivamente incidente após a composição dos tratamentos tributários'}</small></div><div class="prosBox"><strong>✓ Vantagens</strong><ul>${info[m.key].pros.map(x=>`<li>${x}</li>`).join('')}</ul></div><div class="consBox"><strong>! Atenção</strong><ul>${info[m.key].cons.map(x=>`<li>${x}</li>`).join('')}</ul></div></article>`;
 }).join('');
}
function renderCompetition(r){
 const risk=riskScore(r),marker=$('riskMeter'),title=$('competitionTitle'),desc=$('competitionDescription');
 if(!r.simpleEligible){
  if(title)title.textContent='Perfil comercial e crédito B2B';if(desc)desc.textContent='Como o Simples não é uma alternativa confirmada, esta seção mostra a exposição B2B e o crédito potencial no regime regular, sem criar comparação artificial com Simples puro.';
  $('riskNumber').textContent='N/A';$('riskLabel').textContent='Simples não aplicável';if(marker)marker.style.left='0%';$('riskDrivers').innerHTML=risk.drivers.map(x=>`<li>${x}</li>`).join('');
  const advice=$('riskAdvice');if(advice){advice.className='riskAdvice low';advice.textContent='A decisão deve se concentrar no regime regular, na estrutura de créditos, margens, contratos e caixa.'}
  if($('creditLabel1'))$('creditLabel1').textContent='Crédito anual ao cliente no Simples';if($('creditLabel2'))$('creditLabel2').textContent='Crédito anual estimado no regime regular';if($('creditLabel3'))$('creditLabel3').textContent='Crédito B2B estimado no regime regular';if($('creditLabel4'))$('creditLabel4').textContent='Participação estimada de vendas B2B';
  $('pureClientCredit').textContent='Não aplicável';$('hybridClientCredit').textContent=brl.format(r.regularClientCredit);$('extraClientCredit').textContent=brl.format(r.regularClientCredit);$('breakEvenCapture').textContent=pct1(clamp(num('b2bPct')/100,0,1));
  $('competitionInsight').innerHTML=`Nas premissas atuais, o regime regular pode destacar cerca de <strong>${brl.format(r.regularClientCredit)}</strong> por ano de IBS/CBS nas vendas B2B, considerando a composição tributária informada. Esse valor não é benefício adicional automático: representa crédito potencial do cliente, sujeito às regras da operação.`;
  return;
 }
 if(title)title.textContent='Risco de perda de competitividade';if(desc)desc.textContent='O índice considera dependência de clientes PJ, diferença de crédito entregue, perfil das aquisições e potencial de aproveitamento de créditos.';
 $('riskNumber').textContent=`${risk.score}/100`;$('riskLabel').textContent=`Risco ${risk.label.toLowerCase()}`;if(marker)marker.style.left=`calc(${risk.score}% - 3px)`;$('riskDrivers').innerHTML=risk.drivers.map(x=>`<li>${x}</li>`).join('');
 const advice=$('riskAdvice');if(advice){advice.className='riskAdvice '+(risk.score>=67?'high':risk.score>=34?'medium':'low');advice.textContent=risk.score>=67?'A permanência no Simples 100% merece atenção: a limitação do crédito pode afetar preço, homologação ou retenção de clientes PJ.':risk.score>=34?'Há risco comercial relevante, mas ele depende do peso do B2B e da diferença efetiva de crédito percebida pelos clientes.':'O risco competitivo estimado é baixo nas premissas atuais; a simplicidade e a carga própria tendem a pesar mais na decisão.'}
 if($('creditLabel1'))$('creditLabel1').textContent='Crédito anual ao cliente no Simples puro';if($('creditLabel2'))$('creditLabel2').textContent='Crédito anual ao cliente no híbrido';if($('creditLabel3'))$('creditLabel3').textContent='Crédito adicional entregue ao B2B';if($('creditLabel4'))$('creditLabel4').textContent='Captura mínima necessária nas vendas B2B';
 $('pureClientCredit').textContent=brl.format(r.pureClientCredit);$('hybridClientCredit').textContent=brl.format(r.hybridClientCredit);$('extraClientCredit').textContent=brl.format(r.extraClientCredit);$('breakEvenCapture').textContent=Number.isFinite(r.breakEvenCapture)?pct1(r.breakEvenCapture):'Não aplicável';
 if(r.extraHybridCost<=0)$('competitionInsight').textContent='O híbrido já apresenta saída tributária estimada igual ou menor que o Simples puro. O ganho de crédito B2B reforça a vantagem sem depender de monetização comercial adicional.';
 else if(!Number.isFinite(r.breakEvenCapture))$('competitionInsight').textContent='Sem vendas B2B informadas, o crédito repassado ao cliente não cria argumento comercial relevante para justificar a carga adicional do regime híbrido.';
 else $('competitionInsight').innerHTML=`O híbrido custa <strong>${brl.format(r.extraHybridCost)}</strong> a mais por ano, mas entrega <strong>${brl.format(r.extraClientCredit)}</strong> adicionais de crédito aos clientes PJ. Para compensar apenas pela relação comercial, seria necessário capturar pelo menos <strong>${pct1(r.breakEvenCapture)}</strong> das vendas B2B em preço, margem, retenção ou volume. A captura comercial informada é ${pct1(r.capture)}.`;
}
function initEnhancedResults(){
 const yr=$('yearRange');if(yr){yr.value=selectedYear;yr.addEventListener('input',e=>{selectedYear=Number(e.target.value);calculate()})}
 const reset=$('resetBtn');if(reset)reset.addEventListener('click',()=>{try{localStorage.removeItem('brmi_v3')}catch(_){}location.reload()});
}
