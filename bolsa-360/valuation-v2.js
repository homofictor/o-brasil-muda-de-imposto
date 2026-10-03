/* Bolsa 360 · Valor Intrínseco 360 V2
   Camada metodológica separada do screener e do Valor Justo 360. */
function intrinsicAssumptions(){
  const read=(id,fallback)=>{const el=$(id);const v=el?n(el.value):null;return (v===null?fallback:v)/100};
  return {
    wacc:clamp(read('dcfWacc',12),.07,.25),
    terminalGrowth:clamp(read('terminalGrowth',3.5),0,.07),
    taxRate:clamp(read('taxRate',34),0,.50),
    bankCostEquity:clamp(read('bankCostEquity',14),.08,.25),
    bankPayout:clamp(read('bankPayout',50),.10,.90)
  };
}
function valuationProfile(row,isBank){
  const sector=String(row.sector||''),sub=String(row.subsector||'').toLowerCase(),name=String(row.name||row.cvmName||'').toLowerCase();
  if(isBank)return {kind:'bank',label:'Bancos',mode:'equity',years:5,waccAdj:0,terminalAdj:0};
  if(sector==='Finance'&&(sub.includes('segur')||sub.includes('ressegur')))return {kind:'insurance',label:'Seguros e resseguros',mode:'equity',years:5,waccAdj:.005,terminalAdj:0};
  if(sector==='Finance'&&!sub&&(name.includes('itausa')||name.includes('holding')))return {kind:'holding',label:'Holding',mode:'sotp',years:0,waccAdj:0,terminalAdj:0};
  if(sector==='Finance'&&(sub.includes('incorpora')||sub.includes('imóve')||sub.includes('imove')||sub.includes('shopping')))return {kind:'realestate',label:'Imobiliário',mode:'operating',years:6,waccAdj:.005,terminalAdj:0,applicabilityCap:'Média'};
  if(sector==='Finance'&&(sub.includes('aluguel de carro')||sub.includes('locação')||sub.includes('locacao')))return {kind:'assetheavy',label:'Locação e ativos',mode:'operating',years:7,waccAdj:.005,terminalAdj:0,applicabilityCap:'Média'};
  if(sector==='Finance'&&(sub.includes('dados financeiros')||sub.includes('bolsas')||sub.includes('gestão')||sub.includes('gestao')))return {kind:'finservices',label:'Serviços financeiros',mode:'operating',years:7,waccAdj:-.005,terminalAdj:.005,applicabilityCap:'Média'};
  if(sector==='Utilities')return {kind:'utility',label:'Utilities',mode:'operating',years:7,waccAdj:-.015,terminalAdj:0,applicabilityCap:'Média'};
  if(sector==='Communications')return {kind:'telecom',label:'Telecomunicações',mode:'operating',years:7,waccAdj:-.010,terminalAdj:0};
  if(['Energy Minerals','Non-Energy Minerals'].includes(sector)||sub.includes('siderurg')||sub.includes('minera')||sub.includes('papel')||sub.includes('petro'))return {kind:'cyclical',label:'Cíclica / commodities',mode:'operating',years:7,waccAdj:.005,terminalAdj:-.010,normalizeCycle:true};
  if(['Technology Services','Electronic Technology'].includes(sector))return {kind:'technology',label:'Tecnologia',mode:'operating',years:8,waccAdj:0,terminalAdj:.005};
  if(sector==='Retail Trade')return {kind:'retail',label:'Varejo',mode:'operating',years:6,waccAdj:.010,terminalAdj:0};
  if(['Transportation','Industrial Services'].includes(sector))return {kind:'infra',label:'Infraestrutura e transportes',mode:'operating',years:7,waccAdj:-.005,terminalAdj:0,applicabilityCap:'Média'};
  if(['Health Services','Health Technology'].includes(sector))return {kind:'health',label:'Saúde',mode:'operating',years:7,waccAdj:0,terminalAdj:.005};
  return {kind:'general',label:'Empresa operacional',mode:'operating',years:6,waccAdj:0,terminalAdj:0};
}
function profileAssumptions(row,isBank,a){
  const p=valuationProfile(row,isBank);
  return {...p,wacc:clamp(a.wacc+(p.waccAdj||0),.07,.25),terminalGrowth:clamp(a.terminalGrowth+(p.terminalAdj||0),0,.06),costEquity:clamp(a.bankCostEquity+(p.kind==='insurance'?.005:0),.08,.25)};
}
function normalizedOperatingEbit(row,profile){
  const f=row.fundamentals||{},ttm=n(f.ebit),revenue=n(f.revenue);
  if(!profile.normalizeCycle||revenue===null||revenue<=0)return {value:ttm,source:'EBIT TTM',normalized:false};
  const margins=(row.growth?.history||[]).filter(x=>typeof x.year==='number').map(x=>n(x.ebitMargin)).filter(v=>v!==null&&v>-.20&&v<.80);
  const margin=median(margins);
  if(margin===null)return {value:ttm,source:'EBIT TTM',normalized:false};
  const normalized=revenue*margin;
  if(normalized<=0)return {value:ttm,source:'EBIT TTM',normalized:false};
  const value=ttm!==null&&ttm>0?.40*ttm+.60*normalized:normalized;
  return {value,source:'EBIT normalizado pelo ciclo',normalized:true,medianMargin:margin,ttmEbit:ttm};
}
function operatingDcfScenario(row,{wacc,terminalGrowth,taxRate,baseGrowth,years,profile}){
  const f=row.fundamentals||{},close=n(row.close),marketCap=n(row.marketCap),equity=n(f.equity),netDebt=n(f.netDebt);
  if(close===null||close<=0)return {ok:false,code:'price',reason:'Preço de fechamento indisponível.'};
  if(marketCap===null||marketCap<=0)return {ok:false,code:'marketcap',reason:'Valor de mercado indisponível para converter o valor econômico em preço por ação.'};
  const ebitBase=normalizedOperatingEbit(row,profile),ebit=n(ebitBase.value);
  if(ebit===null||ebit<=0)return {ok:false,code:'ebit',reason:profile.normalizeCycle?'Não foi possível obter EBIT positivo nem uma base cíclica normalizada confiável.':'EBIT TTM não positivo; um DCF sem hipótese explícita de turnaround não é calculado.'};
  if(equity===null||equity<=0)return {ok:false,code:'equity',reason:'Patrimônio líquido não positivo; o DCF padronizado perde comparabilidade.'};
  if(netDebt===null)return {ok:false,code:'netdebt',reason:'Dívida líquida não identificada com segurança na base atual.'};
  if(wacc<=terminalGrowth+.015)return {ok:false,code:'spread',reason:'WACC e crescimento terminal geram um spread insuficiente para um valor terminal robusto.'};
  const nopat0=ebit*(1-taxRate),investedCapital=equity+netDebt;
  if(nopat0<=0||investedCapital<=0)return {ok:false,code:'capital',reason:'Capital investido não positivo sob a aproximação atual.'};
  const roic=clamp(nopat0/investedCapital,.03,.50);
  let horizon=years;
  if(roic>wacc+.05&&baseGrowth>.08)horizon=Math.max(horizon,10);
  else if(roic>wacc+.03&&baseGrowth>.06)horizon=Math.max(horizon,8);
  let nopat=nopat0,pv=0;
  for(let t=1;t<=horizon;t++){
    const mix=horizon===1?1:(t-1)/(horizon-1),g=baseGrowth+(terminalGrowth-baseGrowth)*mix;
    nopat*=1+g;
    const reinvest=g>0?clamp(g/roic,0,.70):0,fcff=nopat*(1-reinvest);
    pv+=fcff/Math.pow(1+wacc,t);
  }
  const terminalRoic=clamp(roic,Math.max(terminalGrowth+.025,.07),.30);
  const terminalReinvest=terminalGrowth>0?clamp(terminalGrowth/terminalRoic,0,.65):0;
  const terminalFcff=nopat*(1+terminalGrowth)*(1-terminalReinvest),terminalValue=terminalFcff/(wacc-terminalGrowth);
  const enterpriseValue=pv+terminalValue/Math.pow(1+wacc,horizon),equityValue=enterpriseValue-netDebt;
  if(!Number.isFinite(equityValue)||equityValue<=0)return {ok:false,code:'negative_equity_value',reason:'O valor operacional estimado não cobre a dívida líquida sob as premissas centrais.',enterpriseValue,netDebt,roic,baseGrowth,wacc,terminalGrowth,horizon,ebitSource:ebitBase.source};
  return {ok:true,price:close*(equityValue/marketCap),equityValue,enterpriseValue,roic,baseGrowth,wacc,terminalGrowth,taxRate,terminalRoic,horizon,ebitSource:ebitBase.source,normalized:ebitBase.normalized,medianMargin:ebitBase.medianMargin};
}
function bankEquityScenario(row,{costEquity,terminalGrowth,baseGrowth,years,payoutAssumption}){
  const f=row.fundamentals||{},close=n(row.close),marketCap=n(row.marketCap),book0=n(f.equity),income0=n(f.netIncome);
  if(close===null||close<=0)return {ok:false,reason:'Preço de fechamento indisponível.'};
  if(marketCap===null||marketCap<=0)return {ok:false,reason:'Valor de mercado indisponível para converter o valor econômico em preço por ação.'};
  if(book0===null||book0<=0)return {ok:false,reason:'Patrimônio líquido não positivo ou indisponível.'};
  if(income0===null||income0<=0)return {ok:false,reason:'Lucro TTM não positivo; o modelo de lucro residual não é calculado sem hipótese de recuperação.'};
  if(costEquity<=terminalGrowth+.015)return {ok:false,reason:'Custo de capital e crescimento terminal geram spread insuficiente.'};
  let book=book0,income=income0,pvResidual=0,pvDividends=0,lastPayout=.5;
  for(let t=1;t<=years;t++){
    const mix=years===1?1:(t-1)/(years-1),g=baseGrowth+(terminalGrowth-baseGrowth)*mix;
    income*=1+g;
    const roe=income/book,retention=roe>0?clamp(g/roe,0,.85):0,payout=1-retention;
    const residual=income-costEquity*book,dividend=income*payoutAssumption,disc=Math.pow(1+costEquity,t);
    pvResidual+=residual/disc;pvDividends+=dividend/disc;book+=income*retention;lastPayout=payout;
  }
  const income6=income*(1+terminalGrowth),residual6=income6-costEquity*book,dividend6=income6*payoutAssumption;
  const residualTerminal=residual6/(costEquity-terminalGrowth),dividendTerminal=dividend6/(costEquity-terminalGrowth);
  const riValue=book0+pvResidual+residualTerminal/Math.pow(1+costEquity,years),ddmValue=pvDividends+dividendTerminal/Math.pow(1+costEquity,years);
  const validRi=Number.isFinite(riValue)&&riValue>0?riValue:null,validDdm=Number.isFinite(ddmValue)&&ddmValue>0?ddmValue:null;
  if(validRi===null&&validDdm===null)return {ok:false,reason:'Lucro residual e dividendos não produziram valor econômico positivo.'};
  const equityValue=validRi!==null&&validDdm!==null?.70*validRi+.30*validDdm:(validRi??validDdm);
  return {ok:true,price:close*(equityValue/marketCap),equityValue,riPrice:validRi!==null?close*(validRi/marketCap):null,ddmPrice:validDdm!==null?close*(validDdm/marketCap):null,costEquity,terminalGrowth,baseGrowth,payout:lastPayout,ddmPayout:payoutAssumption,roe:n(f.returnOnEquity),horizon:years};
}
function reportedCashFlowCheck(row,profile,a,baseGrowth){
  if(profile.mode!=='operating')return null;
  const f=row.fundamentals||{},fcf=n(f.fcf),cfo=n(f.cfo),revenue=n(f.revenue),ebit=n(f.ebit),close=n(row.close),marketCap=n(row.marketCap);
  if(!(fcf>0)||!(cfo>0)||!(revenue>0)||!(close>0)||!(marketCap>0))return null;
  if(fcf>cfo*1.15||fcf/revenue>.60)return null;
  if(ebit!==null&&ebit>0&&cfo>Math.max(ebit*3,revenue*.35))return null;
  const rate=clamp(profile.wacc+.025,.09,.27),terminal=profile.terminalGrowth;
  if(rate<=terminal+.02)return null;
  const years=Math.min(Math.max(profile.years,5),8),g0=clamp(baseGrowth,-.02,.10);
  let cf=fcf,pv=0;
  for(let t=1;t<=years;t++){const mix=years===1?1:(t-1)/(years-1),g=g0+(terminal-g0)*mix;cf*=1+g;pv+=cf/Math.pow(1+rate,t)}
  const terminalCf=cf*(1+terminal),equityValue=pv+terminalCf/(rate-terminal)/Math.pow(1+rate,years);
  if(!Number.isFinite(equityValue)||equityValue<=0)return null;
  return {price:close*(equityValue/marketCap),rate,terminalGrowth:terminal,fcf,note:'CFO menos CAPEX, tratado como aproximação de caixa ao acionista. Não compõe o Valor Intrínseco central.'};
}
function capConfidence(confidence,cap){
  const rank={'Baixa':0,'Média':1,'Alta':2};
  if(!cap||rank[confidence]<=rank[cap])return confidence;
  return cap;
}
function intrinsicValueFor(row,isBank){
  const a=intrinsicAssumptions(),close=n(row.close),profile=profileAssumptions(row,isBank,a);
  const base={available:false,profile:profile.label,kind:profile.kind};
  if(close===null||close<=0)return {...base,model:'Valor Intrínseco 360',reason:'Preço de fechamento indisponível.'};
  if(profile.mode==='sotp')return {...base,model:'Soma das Partes (SOTP)',reason:'Holding de participações: o DCF operacional genérico foi desativado. O valor intrínseco exige avaliação das investidas e da dívida da holding.'};
  let baseGrowth,conservative,central,optimistic,model;
  if(profile.mode==='equity'){
    baseGrowth=bankHistoricalGrowth(row);
    model=profile.kind==='insurance'?'Lucro residual + dividendos · Seguradora':'Lucro residual + dividendos · Banco';
    conservative=bankEquityScenario(row,{costEquity:clamp(profile.costEquity+.02,.08,.30),terminalGrowth:clamp(profile.terminalGrowth-.01,0,.05),baseGrowth:clamp(baseGrowth-.02,0,.10),years:profile.years,payoutAssumption:a.bankPayout});
    central=bankEquityScenario(row,{costEquity:profile.costEquity,terminalGrowth:Math.min(profile.terminalGrowth,profile.costEquity-.02),baseGrowth,years:profile.years,payoutAssumption:a.bankPayout});
    optimistic=bankEquityScenario(row,{costEquity:clamp(profile.costEquity-.015,.08,.25),terminalGrowth:clamp(profile.terminalGrowth+.01,0,.06),baseGrowth:clamp(baseGrowth+.02,0,.14),years:profile.years,payoutAssumption:a.bankPayout});
  }else{
    baseGrowth=historicalGrowth(row);
    if(profile.kind==='cyclical')baseGrowth=clamp(baseGrowth,-.01,.05);
    if(['utility','telecom','infra'].includes(profile.kind))baseGrowth=clamp(baseGrowth,0,.07);
    model=(profile.normalizeCycle?'DCF FCFF com EBIT normalizado · ':'DCF FCFF por NOPAT/ROIC · ')+profile.label;
    const params={taxRate:a.taxRate,years:profile.years,profile};
    conservative=operatingDcfScenario(row,{...params,wacc:clamp(profile.wacc+.02,.08,.28),terminalGrowth:clamp(profile.terminalGrowth-.01,0,.05),baseGrowth:clamp(baseGrowth-.02,-.03,.09)});
    central=operatingDcfScenario(row,{...params,wacc:profile.wacc,terminalGrowth:Math.min(profile.terminalGrowth,profile.wacc-.02),baseGrowth});
    optimistic=operatingDcfScenario(row,{...params,wacc:clamp(profile.wacc-.015,.07,.24),terminalGrowth:clamp(profile.terminalGrowth+.01,0,.06),baseGrowth:clamp(baseGrowth+.02,-.02,.13)});
  }
  if(!central||central.ok!==true||n(central.price)===null||central.price<=0)return {...base,model,reason:central?.reason||'O modelo não produziu valor econômico positivo sob as premissas centrais.',details:central||null,baseGrowth};
  const values=[conservative,central,optimistic].filter(x=>x?.ok===true).map(x=>n(x.price)).filter(v=>v!==null&&v>0);
  const low=Math.min(...values),high=Math.max(...values);
  const historyInputs=profile.mode==='equity'?[row.growth?.profitCagr3,row.growth?.revenueCagr3]:[row.growth?.ebitCagr3,row.growth?.revenueCagr3];
  const historyCount=historyInputs.map(n).filter(v=>v!==null).length,spread=low>0?high/low:null;
  let confidence=historyCount>=2&&spread!==null&&spread<=2?'Alta':historyCount>=1&&spread!==null&&spread<=3?'Média':'Baixa';
  if(central.normalized&&confidence==='Alta')confidence='Média';
  confidence=capConfidence(confidence,profile.applicabilityCap);
  const cashCheck=reportedCashFlowCheck(row,profile,a,baseGrowth);
  return {available:true,model,profile:profile.label,low,central:central.price,high,distance:central.price/close-1,confidence,baseGrowth,assumptions:a,details:central,cashCheck};
}
function attachIntrinsicValues(rows,isBank){return rows.map(r=>({...r,intrinsicValue:intrinsicValueFor(r,isBank)}))}

function renderIntrinsicValue(iv){
  if(!iv||iv.available===false){
    const reason=iv?.reason||'O modelo intrínseco exige fundamentos positivos e dados históricos mínimos.';
    return '<div class="intrinsic-box unavailable"><p class="eyebrow">VALOR INTRÍNSECO 360</p><h3>Não calculado</h3><p><b>'+esc(iv?.profile||iv?.model||'Modelo')+':</b> '+esc(reason)+'</p></div>';
  }
  const d=iv.details||{},cash=iv.cashCheck;
  let detail='';
  if(iv.model.startsWith('DCF')){
    detail='<div class="intrinsic-model-grid"><div><span>Perfil</span><strong>'+esc(iv.profile||'Operacional')+'</strong></div><div><span>ROIC estimado</span><strong>'+pct(d.roic)+'</strong></div><div><span>WACC aplicado</span><strong>'+pct(d.wacc)+'</strong></div><div><span>Horizonte explícito</span><strong>'+esc(d.horizon||'—')+' anos</strong></div><div><span>Crescimento-base</span><strong>'+pct(iv.baseGrowth)+'</strong></div><div><span>Crescimento terminal</span><strong>'+pct(d.terminalGrowth)+'</strong></div><div><span>Base operacional</span><strong>'+esc(d.ebitSource||'EBIT TTM')+'</strong></div><div><span>Checagem por caixa</span><strong>'+(cash?money(cash.price):'N/D')+'</strong></div></div>';
    if(cash)detail+='<p class="drawer-note">'+esc(cash.note)+'</p>';
  }else{
    detail='<div class="intrinsic-model-grid"><div><span>Perfil</span><strong>'+esc(iv.profile||'Financeiro')+'</strong></div><div><span>Lucro residual</span><strong>'+money(d.riPrice)+'</strong></div><div><span>Dividendos</span><strong>'+money(d.ddmPrice)+'</strong></div><div><span>Custo do capital</span><strong>'+pct(d.costEquity)+'</strong></div><div><span>Payout DDM</span><strong>'+pct(d.ddmPayout)+'</strong></div><div><span>Horizonte explícito</span><strong>'+esc(d.horizon||'—')+' anos</strong></div></div>';
  }
  return '<div class="intrinsic-box"><div class="intrinsic-head"><div><p class="eyebrow">VALOR INTRÍNSECO 360</p><h3>'+money(iv.central)+'</h3><small>'+esc(iv.model)+' · faixa '+money(iv.low)+' a '+money(iv.high)+'</small></div><div class="intrinsic-distance"><span>Distância ao fechamento</span><strong>'+pct(iv.distance)+'</strong><small>Confiança '+esc(iv.confidence)+'</small></div></div>'+detail+'</div>';
}

function analystTarget(row){
  const a=row?.analystConsensus||{};
  return n(a.targetMeanPrice)??n(a.targetMedianPrice);
}
function analystRecommendationClass(value){
  const v=String(value||'').toLowerCase();
  return v==='compra'?'buy':v==='venda'?'sell':v==='neutro'?'neutral':'na';
}
function analystRecommendationBadge(value){
  if(!value)return '<span class="analyst-rec na">N/D</span>';
  return '<span class="analyst-rec '+analystRecommendationClass(value)+'">'+esc(value)+'</span>';
}
function renderAnalystConsensus(consensus,close){
  if(!consensus)return '<div class="analyst-box unavailable"><p class="eyebrow">CONSENSO DE MERCADO</p><h3>Sem cobertura disponível</h3><p>Não há preço-alvo ou recomendação agregada disponível na fonte para este ativo.</p></div>';
  const target=n(consensus.targetMeanPrice)??n(consensus.targetMedianPrice);
  const distance=target!==null&&n(close)>0?target/n(close)-1:n(consensus.targetDistance);
  const opinions=n(consensus.numberOfAnalystOpinions);
  return '<div class="analyst-box">'+
    '<div class="analyst-head"><div><p class="eyebrow">CONSENSO DE MERCADO</p><h3>'+(target!==null?money(target):'N/D')+'</h3><small>Preço-alvo médio do consenso</small></div>'+
    '<div class="analyst-call"><span>Indicação agregada</span>'+analystRecommendationBadge(consensus.recommendation)+'<small>'+(opinions!==null?opinions+' opinião'+(opinions===1?'':'ões'):'Número de analistas N/D')+'</small></div></div>'+
    '<div class="intrinsic-model-grid"><div><span>Mediana</span><strong>'+money(consensus.targetMedianPrice)+'</strong></div><div><span>Faixa dos alvos</span><strong>'+money(consensus.targetLowPrice)+' a '+money(consensus.targetHighPrice)+'</strong></div><div><span>Distância ao fechamento</span><strong>'+pct(distance)+'</strong></div><div><span>Recommendation mean</span><strong>'+(n(consensus.recommendationMean)!==null?n(consensus.recommendationMean).toFixed(2):'N/D')+'</strong></div></div>'+
    '<p class="drawer-note">Fonte externa: brapi financialData. O consenso agrega opiniões de analistas e não representa recomendação do Bolsa 360. A fonte não informa, neste campo agregado, a data individual de cada relatório.</p></div>';
}

function renderSector(block){
  const rows=sortRows(block.scored||[]),coverage=block.fundamentalsCoverage||0;
  const beginner=state?.selection instanceof Map;
  return '<section class="sector-block"><div class="sector-block-head"><div><h3>'+esc(block.label||sectorPt(block.sector))+'</h3><small>'+block.total+' ativos · '+coverage+' com fundamentos · TTM até '+formatDate(state.cvmBase?.latestItrReference)+'</small></div><small>Mercado/consenso: brapi · fundamentos: CVM</small></div><div class="table-wrap"><table><thead><tr><th>Ativo</th><th>Fechamento</th><th>Valor justo</th><th>V. intrínseco</th><th>Preço-alvo</th><th>Consenso</th><th>Dist. intrínseca</th><th class="adv-col">P/L</th><th class="adv-col">P/VP</th><th class="adv-col">EV/EBIT</th><th class="adv-col">ROE</th><th>Valuation 360</th><th>Qualidade</th><th>Solidez</th><th>Crescimento</th></tr></thead><tbody>'+
  rows.map(r=>{
    const f=r.fundamentals||{},iv=r.intrinsicValue,available=iv?.available===true,ac=r.analystConsensus||null,target=analystTarget(r);
    const intrinsicSub=available?money(iv.low)+' a '+money(iv.high):esc(iv?.reason||'N/D');
    const opinions=n(ac?.numberOfAnalystOpinions);
    const assetCell=beginner
      ?'<div class="asset-actions"><button class="asset-btn" data-ticker="'+esc(r.ticker)+'">'+esc(r.ticker)+'</button><button class="add-asset-btn '+(state.selection.has(r.ticker)?'selected':'')+'" data-add-ticker="'+esc(r.ticker)+'" type="button">'+(state.selection.has(r.ticker)?'Selecionado':'Adicionar +')+'</button></div><small>Vol. '+compactMoney(r.volume)+'</small>'
      :'<button class="asset-btn" data-ticker="'+esc(r.ticker)+'">'+esc(r.ticker)+'</button><small>Vol. '+compactMoney(r.volume)+'</small>';
    return '<tr><td>'+assetCell+'</td>'+
      '<td><strong>'+money(r.close)+'</strong><small>'+(n(r.change)!==null?(n(r.change)>=0?'+':'')+n(r.change).toFixed(2)+'%':'N/D')+'</small></td>'+
      '<td><strong>'+money(r.fairValue?.central)+'</strong><small>'+(r.fairValue?money(r.fairValue.low)+' a '+money(r.fairValue.high):'N/D')+'</small></td>'+
      '<td><strong>'+money(iv?.central)+'</strong><small>'+intrinsicSub+'</small></td>'+
      '<td><strong>'+money(target)+'</strong><small>'+(target!==null&&n(r.close)>0?pct(target/n(r.close)-1)+' vs. fechamento':'Consenso externo')+'</small></td>'+
      '<td>'+analystRecommendationBadge(ac?.recommendation)+'<small>'+(opinions!==null?opinions+' analista'+(opinions===1?'':'s'):'Cobertura N/D')+'</small></td>'+
      '<td>'+(available?pct(iv.distance):'<span class="na">N/D</span>')+'</td>'+
      '<td class="adv-col">'+mult(f.trailingPE)+'</td><td class="adv-col">'+mult(f.priceToBook)+'</td><td class="adv-col">'+mult(f.enterpriseToEbit)+'</td><td class="adv-col">'+pct(f.returnOnEquity)+'</td>'+
      '<td>'+scoreBadge(r.valuationScore)+'</td><td>'+scoreBadge(r.qualityScore)+'</td><td>'+scoreBadge(r.solidityScore)+'</td><td>'+scoreBadge(r.growthScore)+'</td></tr>';
  }).join('')+'</tbody></table></div></section>';
}

const bolsa360OpenDrawerBase=openDrawer;
openDrawer=function(a){
  bolsa360OpenDrawerBase(a);
  const box=renderAnalystConsensus(a.analystConsensus,a.close);
  const intrinsic=document.querySelector('#drawerBody .intrinsic-box');
  if(intrinsic)intrinsic.insertAdjacentHTML('afterend',box);
  else{
    const price=document.querySelector('#drawerBody .drawer-price');
    if(price)price.insertAdjacentHTML('afterend',box);
  }
};
