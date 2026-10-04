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



const BOLSA360_FAVORITES_KEY='bolsa360.favorites.v01';
function bolsa360FavoriteSet(){
  try{
    const raw=JSON.parse(localStorage.getItem(BOLSA360_FAVORITES_KEY)||'[]');
    return new Set(Array.isArray(raw)?raw.map(x=>String(x).toUpperCase()):[]);
  }catch(_){return new Set()}
}
function bolsa360IsFavorite(ticker){return bolsa360FavoriteSet().has(String(ticker||'').toUpperCase())}
function bolsa360ToggleFavorite(ticker){
  const t=String(ticker||'').toUpperCase(); if(!t)return false;
  const set=bolsa360FavoriteSet();
  if(set.has(t))set.delete(t);else set.add(t);
  try{localStorage.setItem(BOLSA360_FAVORITES_KEY,JSON.stringify([...set]))}catch(_){}
  return set.has(t);
}
function bolsa360CompositeScore(row){
  const vals=[row?.valuationScore,row?.qualityScore,row?.solidityScore,row?.growthScore].map(n).filter(v=>v!==null);
  return vals.length>=2?Math.round(vals.reduce((s,v)=>s+v,0)/vals.length):null;
}
function bolsa360Median(values){
  const a=values.map(n).filter(v=>v!==null).sort((x,y)=>x-y);
  if(!a.length)return null;
  const m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function bolsa360PeerRows(asset){
  const blocks=state.sectorData||[];
  const block=blocks.find(b=>(asset?.peerLabel&&b.label===asset.peerLabel)||(asset?.sector&&b.sector===asset.sector));
  return block?.scored||block?.stocks||[];
}
function bolsa360MetricStatus(value,median,direction){
  const v=n(value),m=n(median); if(v===null||m===null)return {label:'N/D',cls:'na'};
  const diff=m===0?v-m:(v-m)/Math.abs(m);
  const favorable=direction==='lower'?diff<=-.05:diff>=.05;
  const unfavorable=direction==='lower'?diff>=.05:diff<=-.05;
  return favorable?{label:'Melhor que pares',cls:'good'}:unfavorable?{label:'Abaixo dos pares',cls:'bad'}:{label:'Em linha',cls:'mid'};
}
function renderPeerBenchmark360(a){
  const peers=bolsa360PeerRows(a).filter(x=>x?.ticker!==a?.ticker);
  if(!peers.length)return '';
  const defs=[
    {label:'P/L',get:r=>r?.fundamentals?.trailingPE,fmt:mult,dir:'lower'},
    {label:'P/VP',get:r=>r?.fundamentals?.priceToBook,fmt:mult,dir:'lower'},
    {label:'ROE',get:r=>r?.fundamentals?.returnOnEquity,fmt:pct,dir:'higher'},
    {label:'Margem EBIT',get:r=>r?.fundamentals?.ebitMargin,fmt:pct,dir:'higher'},
    {label:'Dívida líquida / EBIT',get:r=>r?.fundamentals?.netDebtToEbit,fmt:mult,dir:'lower'},
    {label:'Cresc. receita 3a',get:r=>r?.growth?.revenueCagr3,fmt:pct,dir:'higher'}
  ];
  const cards=defs.map(d=>{
    const av=d.get(a),med=bolsa360Median(peers.map(d.get));
    if(n(av)===null||n(med)===null)return '';
    const st=bolsa360MetricStatus(av,med,d.dir);
    return '<div class="peer360-item"><span>'+esc(d.label)+'</span><strong>'+d.fmt(av)+'</strong><small>Mediana dos pares '+d.fmt(med)+'</small><b class="'+st.cls+'">'+st.label+'</b></div>';
  }).filter(Boolean).join('');
  if(!cards)return '';
  return '<section class="peer360-box"><div class="peer360-head"><div><p class="eyebrow">PARES 360</p><h3>Como este ativo se posiciona no próprio grupo?</h3></div><small>'+peers.length+' pares comparáveis</small></div><div class="peer360-grid">'+cards+'</div></section>';
}
function renderChecklist360(a){
  const f=a?.fundamentals||{},g=a?.growth||{};
  const tests=[
    {label:'Valuation relativo atrativo',value:n(a?.valuationScore),ok:v=>v>=60,show:v=>v+'/100'},
    {label:'Qualidade dos fundamentos',value:n(a?.qualityScore),ok:v=>v>=60,show:v=>v+'/100'},
    {label:'Solidez financeira',value:n(a?.solidityScore),ok:v=>v>=60,show:v=>v+'/100'},
    {label:'Crescimento consistente',value:n(a?.growthScore),ok:v=>v>=55,show:v=>v+'/100'},
    {label:'ROE positivo e relevante',value:n(f.returnOnEquity),ok:v=>v>=.10,show:pct},
    {label:'Dívida líquida / EBIT controlada',value:n(f.netDebtToEbit),ok:v=>v<=3,show:mult},
    {label:'Receita crescendo em 3 anos',value:n(g.revenueCagr3),ok:v=>v>0,show:pct},
    {label:'Lucro crescendo em 3 anos',value:n(g.profitCagr3),ok:v=>v>0,show:pct}
  ];
  const available=tests.filter(t=>t.value!==null);
  const passed=available.filter(t=>t.ok(t.value)).length;
  const rows=tests.map(t=>{
    if(t.value===null)return '<div class="check360-row na"><span>○</span><b>'+esc(t.label)+'</b><small>N/D</small></div>';
    const ok=t.ok(t.value);
    return '<div class="check360-row '+(ok?'ok':'fail')+'"><span>'+(ok?'✓':'×')+'</span><b>'+esc(t.label)+'</b><small>'+esc(t.show(t.value))+'</small></div>';
  }).join('');
  const composite=bolsa360CompositeScore(a);
  return '<section class="check360-box"><div class="check360-head"><div><p class="eyebrow">CHECKLIST 360</p><h3>'+passed+' de '+available.length+' critérios atendidos</h3><small>Leitura objetiva dos fundamentos disponíveis</small></div><div class="check360-score"><span>Nota 360</span><strong>'+(composite===null?'N/D':composite)+'</strong><small>'+(composite===null?'dados insuficientes':'média das quatro dimensões')+'</small></div></div><div class="check360-list">'+rows+'</div><p class="drawer-note">O Checklist 360 é um filtro analítico. Critérios não disponíveis não entram no total e nenhum resultado constitui recomendação de investimento.</p></section>';
}
function renderFavorite360(a){
  const fav=bolsa360IsFavorite(a?.ticker);
  return '<button id="bolsa360FavoriteBtn" class="favorite360-btn '+(fav?'active':'')+'" type="button" aria-pressed="'+(fav?'true':'false')+'">'+(fav?'★ Favorito':'☆ Adicionar aos favoritos')+'</button>';
}


const BOLSA360_FILTERS_KEY='bolsa360.filters.v01';
const BOLSA360_COMPARE_KEY='bolsa360.compare.v01';

state.filter360=state.filter360||{};
state.compare360=state.compare360||new Set();
try{
  const savedFilter=JSON.parse(localStorage.getItem(BOLSA360_FILTERS_KEY)||'{}');
  if(savedFilter&&typeof savedFilter==='object')state.filter360=savedFilter;
  const savedCompare=JSON.parse(localStorage.getItem(BOLSA360_COMPARE_KEY)||'[]');
  if(Array.isArray(savedCompare))state.compare360=new Set(savedCompare.map(x=>String(x).toUpperCase()).slice(0,5));
}catch(_){}

function filterNumber360(id,scale=1){
  const el=document.getElementById(id); if(!el||el.value==='')return null;
  const v=Number(el.value); return Number.isFinite(v)?v*scale:null;
}
function apply360Filters(rows){
  const f=state.filter360||{};
  return (rows||[]).filter(r=>{
    const overall=bolsa360CompositeScore(r),fund=r.fundamentals||{},iv=r.intrinsicValue,ac=r.analystConsensus||{},trend=state.trendMap?.get(r.ticker);
    if(n(f.minOverall)!==null&&(overall===null||overall<n(f.minOverall)))return false;
    if(n(f.minValuation)!==null&&(n(r.valuationScore)===null||n(r.valuationScore)<n(f.minValuation)))return false;
    if(n(f.minQuality)!==null&&(n(r.qualityScore)===null||n(r.qualityScore)<n(f.minQuality)))return false;
    if(n(f.minGrowth)!==null&&(n(r.growthScore)===null||n(r.growthScore)<n(f.minGrowth)))return false;
    if(n(f.maxPE)!==null&&(n(fund.trailingPE)===null||n(fund.trailingPE)>n(f.maxPE)))return false;
    if(n(f.maxDebtEbit)!==null&&(n(fund.netDebtToEbit)===null||n(fund.netDebtToEbit)>n(f.maxDebtEbit)))return false;
    if(n(f.minIntrinsicUpside)!==null&&(iv?.available!==true||n(iv.distance)===null||n(iv.distance)<n(f.minIntrinsicUpside)))return false;
    if(f.recommendation&&f.recommendation!=='all'&&String(ac.recommendation||'').toLowerCase()!==f.recommendation)return false;
    if(f.trend&&f.trend!=='all'&&String(trend?.direction||'').toLowerCase()!==f.trend)return false;
    return true;
  });
}
function saveFilters360(){
  try{localStorage.setItem(BOLSA360_FILTERS_KEY,JSON.stringify(state.filter360||{}))}catch(_){}
}
function readFilters360(){
  state.filter360={
    minOverall:filterNumber360('f360Overall'),
    minValuation:filterNumber360('f360Valuation'),
    minQuality:filterNumber360('f360Quality'),
    minGrowth:filterNumber360('f360Growth'),
    maxPE:filterNumber360('f360PE'),
    maxDebtEbit:filterNumber360('f360Debt'),
    minIntrinsicUpside:filterNumber360('f360Upside',.01),
    recommendation:document.getElementById('f360Recommendation')?.value||'all',
    trend:document.getElementById('f360Trend')?.value||'all'
  };
  saveFilters360();
  renderResults();
}
function clearFilters360(){
  state.filter360={};saveFilters360();
  for(const id of ['f360Overall','f360Valuation','f360Quality','f360Growth','f360PE','f360Debt','f360Upside']){
    const el=document.getElementById(id);if(el)el.value='';
  }
  const rec=document.getElementById('f360Recommendation');if(rec)rec.value='all';
  const tr=document.getElementById('f360Trend');if(tr)tr.value='all';
  renderResults();
}
function createScreener360(){
  if(document.getElementById('screener360'))return;
  const selector=document.querySelector('.selector-panel');
  if(!selector)return;
  const f=state.filter360||{};
  const html='<details id="screener360" class="screener360"><summary><b>Screener 360</b><span>Filtros avançados e salvos neste navegador</span></summary>'+
    '<div class="screener360-grid">'+
    '<label>Nota 360 mínima<input id="f360Overall" type="number" min="0" max="100" value="'+esc(f.minOverall??'')+'" placeholder="Ex.: 60"></label>'+
    '<label>Valuation mínimo<input id="f360Valuation" type="number" min="0" max="100" value="'+esc(f.minValuation??'')+'" placeholder="Ex.: 60"></label>'+
    '<label>Qualidade mínima<input id="f360Quality" type="number" min="0" max="100" value="'+esc(f.minQuality??'')+'" placeholder="Ex.: 60"></label>'+
    '<label>Crescimento mínimo<input id="f360Growth" type="number" min="0" max="100" value="'+esc(f.minGrowth??'')+'" placeholder="Ex.: 50"></label>'+
    '<label>P/L máximo<input id="f360PE" type="number" step="0.1" value="'+esc(f.maxPE??'')+'" placeholder="Ex.: 12"></label>'+
    '<label>Dív. líquida / EBIT máx.<input id="f360Debt" type="number" step="0.1" value="'+esc(f.maxDebtEbit??'')+'" placeholder="Ex.: 3"></label>'+
    '<label>Upside intrínseco mín. (%)<input id="f360Upside" type="number" step="1" value="'+esc(n(f.minIntrinsicUpside)!==null?Math.round(n(f.minIntrinsicUpside)*100):'')+'" placeholder="Ex.: 15"></label>'+
    '<label>Consenso<select id="f360Recommendation"><option value="all">Todos</option><option value="compra">Compra</option><option value="neutro">Neutro</option><option value="venda">Venda</option></select></label>'+
    '<label>Tendência<select id="f360Trend"><option value="all">Todas</option><option value="alta">Alta</option><option value="neutra">Neutra</option><option value="baixa">Baixa</option></select></label>'+
    '</div><div class="screener360-actions"><button id="apply360Filters" type="button">Aplicar filtros</button><button id="clear360Filters" class="secondary" type="button">Limpar</button><small>Os filtros ficam salvos automaticamente neste dispositivo.</small></div></details>';
  selector.insertAdjacentHTML('afterend',html);
  const rec=document.getElementById('f360Recommendation');if(rec)rec.value=f.recommendation||'all';
  const tr=document.getElementById('f360Trend');if(tr)tr.value=f.trend||'all';
  document.getElementById('apply360Filters')?.addEventListener('click',readFilters360);
  document.getElementById('clear360Filters')?.addEventListener('click',clearFilters360);
}

function marketCard360(title,items,valueFn){
  return '<section class="market360-card"><h3>'+esc(title)+'</h3><div class="market360-list">'+items.map((x,i)=>
    '<button type="button" data-market-ticker="'+esc(x.ticker)+'"><span><b>'+(i+1)+'. '+esc(x.ticker)+'</b><small>'+esc(x.name||x.ticker)+'</small></span><strong>'+esc(valueFn(x))+'</strong></button>'
  ).join('')+'</div></section>';
}
function createMarket360(){
  if(document.getElementById('market360'))return;
  const hero=document.querySelector('.hero');
  if(!hero)return;
  hero.insertAdjacentHTML('afterend','<section id="market360" class="market360 panel"><div class="section-head"><div><p class="eyebrow">RADAR 360</p><h2>O que está se destacando no mercado?</h2><p class="muted">Descoberta rápida por movimento, tamanho e favoritos, usando o universo já carregado pelo Bolsa 360.</p></div></div><div id="market360Grid" class="market360-grid"><p class="muted">Carregando radar...</p></div></section>');
  document.getElementById('market360')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-market-ticker]'); if(!btn)return;
    const input=document.getElementById('individualAssetInput');
    if(input){input.value=btn.dataset.marketTicker;document.getElementById('individualAssetAdd')?.click()}
  });
}
function refreshMarket360(){
  const grid=document.getElementById('market360Grid'); if(!grid)return;
  const stocks=(state.universe?.stocks||[]).filter(x=>x?.ticker&&n(x.close)!==null);
  if(!stocks.length){grid.innerHTML='<p class="muted">Radar aguardando o universo de ações.</p>';return}
  const liquid=stocks.filter(x=>n(x.volume)!==null&&n(x.volume)>0);
  const gainers=[...stocks].filter(x=>n(x.change)!==null).sort((a,b)=>n(b.change)-n(a.change)).slice(0,5);
  const losers=[...stocks].filter(x=>n(x.change)!==null).sort((a,b)=>n(a.change)-n(b.change)).slice(0,5);
  const caps=[...stocks].filter(x=>n(x.marketCap)!==null).sort((a,b)=>n(b.marketCap)-n(a.marketCap)).slice(0,5);
  const volumes=[...liquid].sort((a,b)=>n(b.volume)-n(a.volume)).slice(0,5);
  const favs=bolsa360FavoriteSet();
  const favRows=stocks.filter(x=>favs.has(String(x.ticker).toUpperCase())).slice(0,5);
  grid.innerHTML=
    marketCard360('Maiores altas',gainers,x=>(n(x.change)>=0?'+':'')+n(x.change).toFixed(2)+'%')+
    marketCard360('Maiores baixas',losers,x=>n(x.change).toFixed(2)+'%')+
    marketCard360('Maior valor de mercado',caps,x=>compactMoney(x.marketCap))+
    marketCard360('Maior volume',volumes,x=>compactMoney(x.volume))+
    (favRows.length?marketCard360('Meus favoritos',favRows,x=>money(x.close)):'');
}
function waitMarket360(){
  let tries=0;
  const timer=setInterval(()=>{
    tries++;refreshMarket360();
    if(state.universe?.stocks?.length||tries>30)clearInterval(timer);
  },250);
}

function opportunityCard360(title,items,metric){
  return '<div class="opp360-card"><h4>'+esc(title)+'</h4>'+items.map((r,i)=>
    '<button type="button" data-opp-ticker="'+esc(r.ticker)+'"><span><b>'+(i+1)+'. '+esc(r.ticker)+'</b><small>'+esc(r.cvmName||r.name||'')+'</small></span><strong>'+esc(metric(r))+'</strong></button>'
  ).join('')+'</div>';
}
function renderOpportunities360(){
  const sec=document.getElementById('resultsSection');if(!sec)return;
  let box=document.getElementById('opportunities360');
  if(!box){
    sec.insertAdjacentHTML('afterbegin','<section id="opportunities360" class="panel opportunities360"><div class="section-head"><div><p class="eyebrow">OPORTUNIDADES 360</p><h2>Destaques dentro do universo analisado</h2><p class="muted">Rankings transparentes por Nota 360, valor intrínseco, qualidade e crescimento.</p></div></div><div id="opp360Grid" class="opp360-grid"></div></section>');
    box=document.getElementById('opportunities360');
    box?.addEventListener('click',e=>{
      const btn=e.target.closest('[data-opp-ticker]');if(!btn)return;
      const a=state.assetMap.get(btn.dataset.oppTicker);if(a)openDrawer(a);
    });
  }
  const rows=[...state.assetMap.values()];
  const byOverall=[...rows].filter(r=>bolsa360CompositeScore(r)!==null).sort((a,b)=>bolsa360CompositeScore(b)-bolsa360CompositeScore(a)).slice(0,5);
  const byIntrinsic=[...rows].filter(r=>r.intrinsicValue?.available===true&&n(r.intrinsicValue.distance)!==null).sort((a,b)=>n(b.intrinsicValue.distance)-n(a.intrinsicValue.distance)).slice(0,5);
  const byQuality=[...rows].filter(r=>n(r.qualityScore)!==null).sort((a,b)=>n(b.qualityScore)-n(a.qualityScore)).slice(0,5);
  const byGrowth=[...rows].filter(r=>n(r.growthScore)!==null).sort((a,b)=>n(b.growthScore)-n(a.growthScore)).slice(0,5);
  const byRevenue=[...rows].filter(r=>n(r.fundamentals?.revenue)>0).sort((a,b)=>n(b.fundamentals.revenue)-n(a.fundamentals.revenue)).slice(0,5);
  const byMarketCap=[...rows].filter(r=>n(r.marketCap)>0).sort((a,b)=>n(b.marketCap)-n(a.marketCap)).slice(0,5);
  const byRoe=[...rows].filter(r=>n(r.fundamentals?.returnOnEquity)!==null).sort((a,b)=>n(b.fundamentals.returnOnEquity)-n(a.fundamentals.returnOnEquity)).slice(0,5);
  const byPE=[...rows].filter(r=>n(r.fundamentals?.trailingPE)>0).sort((a,b)=>n(a.fundamentals.trailingPE)-n(b.fundamentals.trailingPE)).slice(0,5);
  const grid=document.getElementById('opp360Grid');if(!grid)return;
  grid.innerHTML=
    opportunityCard360('Maior Nota 360',byOverall,r=>bolsa360CompositeScore(r)+'/100')+
    opportunityCard360('Maior upside intrínseco',byIntrinsic,r=>pct(r.intrinsicValue.distance))+
    opportunityCard360('Maior qualidade',byQuality,r=>Math.round(n(r.qualityScore))+'/100')+
    opportunityCard360('Maior crescimento',byGrowth,r=>Math.round(n(r.growthScore))+'/100')+
    opportunityCard360('Maiores receitas TTM',byRevenue,r=>compactMoney(r.fundamentals.revenue))+
    opportunityCard360('Maior valor de mercado',byMarketCap,r=>compactMoney(r.marketCap))+
    opportunityCard360('Maior ROE',byRoe,r=>pct(r.fundamentals.returnOnEquity))+
    opportunityCard360('Menor P/L positivo',byPE,r=>mult(r.fundamentals.trailingPE));
}

function saveCompare360(){try{localStorage.setItem(BOLSA360_COMPARE_KEY,JSON.stringify([...state.compare360]))}catch(_){}}
function addCompare360(ticker){
  const t=String(ticker||'').toUpperCase();if(!t)return;
  if(state.compare360.has(t))state.compare360.delete(t);
  else{
    if(state.compare360.size>=5)return;
    state.compare360.add(t);
  }
  saveCompare360();renderCompareDock360();
}
function compareMetric360(label,get,fmt,rows){
  return '<tr><th>'+esc(label)+'</th>'+rows.map(r=>'<td>'+esc(fmt(get(r)))+'</td>').join('')+'</tr>';
}
function renderCompare360(){
  const tickers=[...state.compare360];
  const rows=tickers.map(t=>state.assetMap.get(t)).filter(Boolean);
  const body=document.getElementById('compare360Body');if(!body)return;
  if(rows.length<2){body.innerHTML='<p class="muted">Selecione pelo menos dois ativos já analisados para comparar.</p>';return}
  const trendLabel=r=>{const t=state.trendMap?.get(r.ticker);return t?.available?(t.strength||t.direction):'N/D'};
  const target=r=>analystTarget(r);
  const fmtScore=v=>n(v)===null?'N/D':Math.round(n(v))+'/100';
  body.innerHTML='<div class="compare360-table-wrap"><table class="compare360-table"><thead><tr><th>Indicador</th>'+rows.map(r=>'<th>'+esc(r.ticker)+'</th>').join('')+'</tr></thead><tbody>'+
    compareMetric360('Preço',r=>r.close,money,rows)+
    compareMetric360('Nota 360',bolsa360CompositeScore,fmtScore,rows)+
    compareMetric360('Tendência',trendLabel,x=>x,rows)+
    compareMetric360('Valor justo',r=>r.fairValue?.central,money,rows)+
    compareMetric360('Valor intrínseco',r=>r.intrinsicValue?.central,money,rows)+
    compareMetric360('Upside intrínseco',r=>r.intrinsicValue?.distance,pct,rows)+
    compareMetric360('Preço-alvo',target,money,rows)+
    compareMetric360('P/L',r=>r.fundamentals?.trailingPE,mult,rows)+
    compareMetric360('P/VP',r=>r.fundamentals?.priceToBook,mult,rows)+
    compareMetric360('ROE',r=>r.fundamentals?.returnOnEquity,pct,rows)+
    compareMetric360('Margem EBIT',r=>r.fundamentals?.ebitMargin,pct,rows)+
    compareMetric360('Dív. líquida / EBIT',r=>r.fundamentals?.netDebtToEbit,mult,rows)+
    compareMetric360('Cresc. receita 3a',r=>r.growth?.revenueCagr3,pct,rows)+
    compareMetric360('Cresc. lucro 3a',r=>r.growth?.profitCagr3,pct,rows)+
    '</tbody></table></div>';
}
function ensureCompareModal360(){
  if(document.getElementById('compare360Modal'))return;
  document.body.insertAdjacentHTML('beforeend','<div id="compare360Backdrop" class="drawer-backdrop hidden"></div><aside id="compare360Modal" class="compare360-modal" aria-hidden="true"><button id="closeCompare360" class="drawer-close" type="button">×</button><p class="eyebrow">COMPARADOR 360</p><h2>Compare até 5 ativos lado a lado.</h2><p class="muted">Fundamentos, valuation, tendência, preço-alvo e crescimento em uma única visão.</p><div id="compare360Body"></div></aside><div id="compare360Dock" class="compare360-dock hidden"></div>');
  const close=()=>{document.getElementById('compare360Backdrop')?.classList.add('hidden');document.getElementById('compare360Modal')?.classList.remove('open');document.getElementById('compare360Modal')?.setAttribute('aria-hidden','true')};
  document.getElementById('closeCompare360')?.addEventListener('click',close);
  document.getElementById('compare360Backdrop')?.addEventListener('click',close);
}
function openCompare360(){
  ensureCompareModal360();renderCompare360();
  document.getElementById('compare360Backdrop')?.classList.remove('hidden');
  document.getElementById('compare360Modal')?.classList.add('open');
  document.getElementById('compare360Modal')?.setAttribute('aria-hidden','false');
}
function renderCompareDock360(){
  ensureCompareModal360();
  const d=document.getElementById('compare360Dock');if(!d)return;
  const nsel=state.compare360.size;
  d.classList.toggle('hidden',nsel===0);
  d.innerHTML='<span><b>Comparador 360</b><small>'+nsel+'/5 ativos</small></span><button id="openCompare360" type="button" '+(nsel<2?'disabled':'')+'>Comparar</button>';
  document.getElementById('openCompare360')?.addEventListener('click',openCompare360);
}

function renderPortfolioHealth360(){
  if(!(state?.selection instanceof Map)||typeof allocationRows!=='function')return;
  const summary=document.getElementById('portfolioSummary');if(!summary)return;
  let box=document.getElementById('portfolioHealth360');
  if(!box){summary.insertAdjacentHTML('afterend','<div id="portfolioHealth360" class="portfolio-health360"></div>');box=document.getElementById('portfolioHealth360')}
  const x=allocationRows();if(!x.rows.length){box.innerHTML='';return}
  const sectorWeights=new Map();
  let weightedScore=0,scoreWeight=0;
  for(const r of x.rows){
    const w=n(r.weight)||0,sector=sectorPt(r.sector||'Outros');
    sectorWeights.set(sector,(sectorWeights.get(sector)||0)+w);
    const asset=state.assetMap.get(r.ticker)||state.selection.get(r.ticker)||r;
    const s=bolsa360CompositeScore(asset);
    if(s!==null){weightedScore+=s*w;scoreWeight+=w}
  }
  const sectors=[...sectorWeights.entries()].sort((a,b)=>b[1]-a[1]);
  const alerts=[];
  const top=x.rows.slice().sort((a,b)=>b.weight-a.weight)[0];
  if(top?.weight>35)alerts.push('Concentração elevada em '+top.ticker+' ('+top.weight.toFixed(1)+'%).');
  if(sectors[0]?.[1]>50)alerts.push('Mais de metade da carteira está em '+sectors[0][0]+'.');
  if(x.rows.length<4)alerts.push('Carteira com poucos ativos para diversificação ampla.');
  const score=scoreWeight?Math.round(weightedScore/scoreWeight):null;
  if(score!==null&&score<50)alerts.push('Nota 360 ponderada da carteira está abaixo de 50.');
  box.innerHTML='<div class="portfolio-health-head"><div><p class="eyebrow">SAÚDE DA CARTEIRA 360</p><h3>'+(score===null?'N/D':score+'/100')+'</h3><small>Nota 360 ponderada pelos pesos</small></div><div><b>'+x.rows.length+'</b><span>ativos</span></div><div><b>'+sectors.length+'</b><span>setores</span></div></div>'+
    '<div class="portfolio-sector-bars">'+sectors.map(([s,w])=>'<div><span>'+esc(s)+'</span><b>'+w.toFixed(1)+'%</b><i style="--w:'+Math.min(100,w)+'%"></i></div>').join('')+'</div>'+
    '<div class="portfolio-alerts360">'+(alerts.length?alerts.map(a=>'<p>• '+esc(a)+'</p>').join(''):'<p>Sem alertas simples de concentração nas regras atuais.</p>')+'</div>';
}

function renderSummary360(a){
  const overall=bolsa360CompositeScore(a),iv=a?.intrinsicValue,ac=a?.analystConsensus||{},target=analystTarget(a),trend=state.trendMap?.get(a?.ticker);
  const targetUpside=n(target)!==null&&n(a?.close)>0?target/n(a.close)-1:null;
  return '<section class="summary360-box"><div><span>Nota 360</span><strong>'+(overall===null?'N/D':overall+'/100')+'</strong></div>'+
    '<div><span>Upside intrínseco</span><strong>'+(iv?.available===true?pct(iv.distance):'N/D')+'</strong></div>'+
    '<div><span>Consenso</span><strong>'+esc(ac.recommendation||'N/D')+'</strong></div>'+
    '<div><span>Upside analistas</span><strong>'+(targetUpside===null?'N/D':pct(targetUpside))+'</strong></div>'+
    '<div><span>Tendência</span><strong>'+esc(trend?.available?(trend.strength||trend.direction):'N/D')+'</strong></div></section>';
}


function marketTicker360Format(x){
  const v=n(x?.price);
  if(v===null)return 'N/D';
  if(x.unit==='pts')return Math.round(v).toLocaleString('pt-BR');
  if(x.unit==='% a.a.')return v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
}
function marketTicker360Item(x){
  const change=n(x?.change),cls=change===null?'flat':change>0?'up':change<0?'down':'flat';
  const changeText=change===null?'':(change>0?'+':'')+change.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
  const clickable=x.kind==='stock';
  return '<button class="market-ticker360-item '+cls+'" type="button" '+(clickable?'data-strip-ticker="'+esc(x.symbol)+'"':'disabled')+'>'+
    '<b>'+esc(x.symbol)+'</b><span>'+esc(marketTicker360Format(x))+'</span>'+(changeText?'<strong>'+esc(changeText)+'</strong>':'')+
    '<small>'+esc(x.label||'')+'</small></button>';
}
function createMarketTicker360(){
  if(document.getElementById('marketTicker360'))return;
  const topbar=document.querySelector('.topbar');
  if(!topbar)return;
  topbar.insertAdjacentHTML('afterend','<section id="marketTicker360" class="market-ticker360" aria-label="Indicadores e principais ações do mercado"><div class="market-ticker360-label">Mercado 360</div><div class="market-ticker360-viewport"><div id="marketTicker360Track" class="market-ticker360-track"><span class="market-ticker360-loading">Atualizando mercado...</span></div></div></section>');
  document.getElementById('marketTicker360')?.addEventListener('click',e=>{
    const btn=e.target.closest('[data-strip-ticker]');if(!btn)return;
    const input=document.getElementById('individualAssetInput');
    if(input){input.value=btn.dataset.stripTicker;document.getElementById('individualAssetAdd')?.click()}
  });
  loadMarketTicker360();
}
async function loadMarketTicker360(){
  const track=document.getElementById('marketTicker360Track');if(!track)return;
  try{
    const r=await fetch('/api/bolsa360-market',{headers:{Accept:'application/json'}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||'Falha ao consultar o mercado.');
    const rows=[...(j.indicators||[]),...(j.stocks||[])].filter(x=>x&&x.symbol);
    if(!rows.length)throw new Error('Sem dados de mercado.');
    const once=rows.map(marketTicker360Item).join('');
    track.innerHTML='<div class="market-ticker360-set">'+once+'</div><div class="market-ticker360-set" aria-hidden="true">'+once+'</div>';
    track.classList.add('running');
  }catch(err){
    track.classList.remove('running');
    track.innerHTML='<span class="market-ticker360-loading">Mercado 360 temporariamente indisponível.</span>';
  }
}
function initBenchmarkFeatures360(){
  createMarketTicker360();createMarket360();createScreener360();ensureCompareModal360();renderCompareDock360();waitMarket360();
  if(state?.selection instanceof Map&&typeof renderPortfolioSummary==='function'&&!renderPortfolioSummary.__health360){
    const base=renderPortfolioSummary;
    const wrapped=function(){base();renderPortfolioHealth360()};
    wrapped.__health360=true;
    renderPortfolioSummary=wrapped;
    renderPortfolioHealth360();
  }
}
setTimeout(initBenchmarkFeatures360,0);

const TREND360_CACHE_KEY='bolsa360.trend.v01';
state.trendMap=state.trendMap||new Map();
state.trendAttempted=state.trendAttempted||new Set();
state.activeDrawerTicker=state.activeDrawerTicker||null;

(function loadTrend360Cache(){
  try{
    const cache=JSON.parse(localStorage.getItem(TREND360_CACHE_KEY)||'null');
    if(!cache||Date.now()-Number(cache.savedAt||0)>6*60*60*1000||!Array.isArray(cache.results))return;
    for(const x of cache.results)if(x?.ticker&&x.available)state.trendMap.set(x.ticker,x);
  }catch(_){}
})();
function saveTrend360Cache(){
  try{
    const results=[...state.trendMap.values()].filter(x=>x?.available);
    localStorage.setItem(TREND360_CACHE_KEY,JSON.stringify({savedAt:Date.now(),results}));
  }catch(_){}
}
const bolsa360SortRowsBase=sortRows;
sortRows=function(rows){
  if($('sortBy')?.value==='trend'){
    return [...rows].sort((a,b)=>{
      const ta=state.trendMap.get(a.ticker),tb=state.trendMap.get(b.ticker);
      const sa=ta?.available?n(ta.score):-Infinity,sb=tb?.available?n(tb.score):-Infinity;
      return (sb??-Infinity)-(sa??-Infinity);
    });
  }
  return bolsa360SortRowsBase(rows);
};

function trendClass(t){
  if(!t?.available)return 'na';
  return t.direction==='Alta'?'up':t.direction==='Baixa'?'down':'neutral';
}
function trendBadge(t){
  if(!t?.available)return '<span class="trend-badge na">N/D</span>';
  return '<span class="trend-badge '+trendClass(t)+'">'+esc(t.strength||t.direction)+'</span>';
}
function renderTrend360(t){
  if(!t)return '<div class="trend-box unavailable"><p class="eyebrow">TENDÊNCIA 360</p><h3>Carregando histórico</h3><p>A leitura técnica é calculada separadamente a partir do histórico diário do ativo.</p></div>';
  if(!t.available)return '<div class="trend-box unavailable"><p class="eyebrow">TENDÊNCIA 360</p><h3>Não calculada</h3><p>'+esc(t.reason||'Histórico insuficiente ou indisponível.')+'</p></div>';
  const signalText=(t.signals||[]).map(s=>'<span class="trend-signal '+(s.value>0?'pos':s.value<0?'neg':'flat')+'">'+esc(s.name)+'</span>').join('');
  return '<div class="trend-box"><div class="trend-head"><div><p class="eyebrow">TENDÊNCIA 360</p><h3>'+esc(t.strength)+'</h3><small>Leitura quantitativa · confiança '+esc(t.confidence)+'</small></div><div class="trend-score '+trendClass(t)+'"><span>Score técnico</span><strong>'+(t.score>0?'+':'')+esc(t.score)+'</strong></div></div>'+
    '<div class="intrinsic-model-grid"><div><span>MM20</span><strong>'+money(t.sma20)+'</strong></div><div><span>MM50</span><strong>'+money(t.sma50)+'</strong></div><div><span>Momentum 20d</span><strong>'+pct(t.momentum20)+'</strong></div><div><span>Momentum 60d</span><strong>'+pct(t.momentum60)+'</strong></div><div><span>RSI 14</span><strong>'+(n(t.rsi14)!==null?n(t.rsi14).toFixed(1):'N/D')+'</strong></div><div><span>Volatilidade 20d</span><strong>'+pct(t.annualizedVolatility20)+'</strong></div></div>'+
    '<div class="trend-signals">'+signalText+'</div>'+
    '<p class="drawer-note">Tendência 360 usa preço ajustado, médias móveis, momentum, RSI e MACD. É uma leitura técnica descritiva, não recomendação de compra ou venda.</p></div>';
}
async function loadTrend360ForVisible(){
  const tickers=[...new Set((state.sectorData||[]).flatMap(b=>(b.scored||[]).map(r=>r.ticker)).filter(Boolean))];
  const pending=tickers.filter(t=>!state.trendMap.has(t)&&!state.trendAttempted.has(t));
  if(!pending.length)return;
  for(let i=0;i<pending.length;i+=20){
    const chunk=pending.slice(i,i+20);
    chunk.forEach(t=>state.trendAttempted.add(t));
    try{
      const r=await fetch('/api/bolsa360-trend?tickers='+encodeURIComponent(chunk.join(',')),{headers:{Accept:'application/json'}});
      const j=await r.json().catch(()=>({}));
      if(r.ok){
        for(const x of (j.results||[]))if(x?.ticker)state.trendMap.set(x.ticker,x);
      }else{
        for(const t of chunk)state.trendMap.set(t,{ticker:t,available:false,reason:j.error||'Falha ao consultar histórico.'});
      }
    }catch(_){
      for(const t of chunk)state.trendMap.set(t,{ticker:t,available:false,reason:'Falha de comunicação ao consultar o histórico.'});
    }
  }
  saveTrend360Cache();
  bolsa360RenderResultsBase();
  if(state.activeDrawerTicker){
    const asset=state.assetMap.get(state.activeDrawerTicker);
    if(asset&&document.querySelector('#assetDrawer.open'))openDrawer(asset);
  }
}

function renderSector(block){
  const allRows=sortRows(block.scored||[]),rows=apply360Filters(allRows),coverage=block.fundamentalsCoverage||0;
  const beginner=state?.selection instanceof Map;
  const countText=rows.length===allRows.length?block.total+' ativos':rows.length+' exibidos de '+allRows.length;
  if(beginner){
    return '<section class="sector-block"><div class="sector-block-head"><div><h3>'+esc(block.label||sectorPt(block.sector))+'</h3><small>'+countText+' · '+coverage+' com fundamentos · TTM até '+formatDate(state.cvmBase?.latestItrReference)+'</small></div><small>Mercado/histórico: brapi · fundamentos: CVM</small></div><div class="table-wrap"><table class="beginner360-table"><thead><tr><th>Ativo</th><th>Fechamento</th><th>Nota 360</th><th>Tendência</th><th>V. intrínseco</th><th>Preço-alvo</th><th>Consenso</th></tr></thead><tbody>'+
      rows.map(r=>{
        const iv=r.intrinsicValue,available=iv?.available===true,ac=r.analystConsensus||null,target=analystTarget(r),trend=state.trendMap.get(r.ticker)||null;
        const assetCell='<div class="asset-actions"><button class="asset-btn" data-ticker="'+esc(r.ticker)+'">'+esc(r.ticker)+'</button><button class="add-asset-btn '+(state.selection.has(r.ticker)?'selected':'')+'" data-add-ticker="'+esc(r.ticker)+'" type="button">'+(state.selection.has(r.ticker)?'Selecionado':'Adicionar +')+'</button></div><small>Vol. '+compactMoney(r.volume)+'</small>';
        return '<tr><td>'+assetCell+'</td>'+
          '<td><strong>'+money(r.close)+'</strong><small>'+(n(r.change)!==null?(n(r.change)>=0?'+':'')+n(r.change).toFixed(2)+'%':'N/D')+'</small></td>'+
          '<td>'+scoreBadge(bolsa360CompositeScore(r))+'</td>'+
          '<td>'+trendBadge(trend)+'</td>'+
          '<td><strong>'+money(iv?.central)+'</strong><small>'+(available?pct(iv.distance)+' vs. preço':'N/D')+'</small></td>'+
          '<td><strong>'+money(target)+'</strong><small>'+(target!==null&&n(r.close)>0?pct(target/n(r.close)-1)+' vs. preço':'N/D')+'</small></td>'+
          '<td>'+analystRecommendationBadge(ac?.recommendation)+'</td></tr>';
      }).join('')+'</tbody></table></div></section>';
  }
  return '<section class="sector-block"><div class="sector-block-head"><div><h3>'+esc(block.label||sectorPt(block.sector))+'</h3><small>'+countText+' · '+coverage+' com fundamentos · TTM até '+formatDate(state.cvmBase?.latestItrReference)+'</small></div><small>Mercado/histórico: brapi · fundamentos: CVM</small></div><div class="table-wrap"><table><thead><tr><th>Ativo</th><th>Fechamento</th><th>Tendência 360</th><th>Valor justo</th><th>V. intrínseco</th><th>Preço-alvo</th><th>Consenso</th><th>Dist. intrínseca</th><th>P/L</th><th>P/VP</th><th>EV/EBIT</th><th>ROE</th><th>Nota 360</th><th>Valuation</th><th>Qualidade</th><th>Solidez</th><th>Crescimento</th></tr></thead><tbody>'+
  rows.map(r=>{
    const f=r.fundamentals||{},iv=r.intrinsicValue,available=iv?.available===true,ac=r.analystConsensus||null,target=analystTarget(r),trend=state.trendMap.get(r.ticker)||null;
    const intrinsicSub=available?money(iv.low)+' a '+money(iv.high):esc(iv?.reason||'N/D');
    const opinions=n(ac?.numberOfAnalystOpinions);
    const assetCell='<button class="asset-btn" data-ticker="'+esc(r.ticker)+'">'+esc(r.ticker)+'</button><small>Vol. '+compactMoney(r.volume)+'</small>';
    return '<tr><td>'+assetCell+'</td>'+
      '<td><strong>'+money(r.close)+'</strong><small>'+(n(r.change)!==null?(n(r.change)>=0?'+':'')+n(r.change).toFixed(2)+'%':'N/D')+'</small></td>'+
      '<td>'+trendBadge(trend)+'<small>'+(trend?.available?'20d '+pct(trend.momentum20)+' · RSI '+(n(trend.rsi14)!==null?n(trend.rsi14).toFixed(0):'N/D'):(trend?.reason?'Histórico N/D':'Carregando...'))+'</small></td>'+
      '<td><strong>'+money(r.fairValue?.central)+'</strong><small>'+(r.fairValue?money(r.fairValue.low)+' a '+money(r.fairValue.high):'N/D')+'</small></td>'+
      '<td><strong>'+money(iv?.central)+'</strong><small>'+intrinsicSub+'</small></td>'+
      '<td><strong>'+money(target)+'</strong><small>'+(target!==null&&n(r.close)>0?pct(target/n(r.close)-1)+' vs. fechamento':'Consenso externo')+'</small></td>'+
      '<td>'+analystRecommendationBadge(ac?.recommendation)+'<small>'+(opinions!==null?opinions+' analista'+(opinions===1?'':'s'):'Cobertura N/D')+'</small></td>'+
      '<td>'+(available?pct(iv.distance):'<span class="na">N/D</span>')+'</td>'+
      '<td>'+mult(f.trailingPE)+'</td><td>'+mult(f.priceToBook)+'</td><td>'+mult(f.enterpriseToEbit)+'</td><td>'+pct(f.returnOnEquity)+'</td>'+
      '<td>'+scoreBadge(bolsa360CompositeScore(r))+'</td><td>'+scoreBadge(r.valuationScore)+'</td><td>'+scoreBadge(r.qualityScore)+'</td><td>'+scoreBadge(r.solidityScore)+'</td><td>'+scoreBadge(r.growthScore)+'</td></tr>';
  }).join('')+'</tbody></table></div></section>';
}

const bolsa360OpenDrawerBase=openDrawer;
openDrawer=function(a){
  state.activeDrawerTicker=a?.ticker||null;
  bolsa360OpenDrawerBase(a);
  const title=document.querySelector('#drawerBody .drawer-title');
  if(title){
    title.insertAdjacentHTML('beforeend','<div class="drawer360-actions">'+renderFavorite360(a)+'<button id="bolsa360CompareBtn" class="compare360-add" type="button">'+(state.compare360.has(a.ticker)?'✓ No comparador':'＋ Comparar')+'</button></div>');
    const favBtn=document.getElementById('bolsa360FavoriteBtn');
    if(favBtn)favBtn.addEventListener('click',()=>{
      const active=bolsa360ToggleFavorite(a.ticker);
      favBtn.classList.toggle('active',active);
      favBtn.setAttribute('aria-pressed',active?'true':'false');
      favBtn.textContent=active?'★ Favorito':'☆ Adicionar aos favoritos';
      refreshMarket360();
    });
    const cmp=document.getElementById('bolsa360CompareBtn');
    if(cmp)cmp.addEventListener('click',()=>{
      addCompare360(a.ticker);
      cmp.textContent=state.compare360.has(a.ticker)?'✓ No comparador':'＋ Comparar';
    });
  }

  const price=document.querySelector('#drawerBody .drawer-price');
  if(price)price.insertAdjacentHTML('afterend',renderSummary360(a));

  const trendBox=renderTrend360(state.trendMap.get(a.ticker)||null);
  const summary=document.querySelector('#drawerBody .summary360-box');
  if(summary)summary.insertAdjacentHTML('afterend',trendBox);
  else if(price)price.insertAdjacentHTML('afterend',trendBox);

  const analystBox=renderAnalystConsensus(a.analystConsensus,a.close);
  const intrinsic=document.querySelector('#drawerBody .intrinsic-box');
  if(intrinsic)intrinsic.insertAdjacentHTML('afterend',analystBox);
  else if(price)price.insertAdjacentHTML('afterend',analystBox);

  const history=document.querySelector('#drawerBody .history-box');
  const insertBefore=history||document.querySelector('#drawerBody .drawer-note');
  const extra=renderPeerBenchmark360(a)+renderChecklist360(a);
  if(insertBefore)insertBefore.insertAdjacentHTML('beforebegin',extra);
  else document.querySelector('#drawerBody')?.insertAdjacentHTML('beforeend',extra);
};

const bolsa360RenderResultsBase=renderResults;
renderResults=function(){
  bolsa360RenderResultsBase();
  renderOpportunities360();
  setTimeout(loadTrend360ForVisible,0);
};

(function plataforma360TickerDeepLink(){
  if(location.pathname.includes('/iniciante/'))return;
  const ticker=String(new URLSearchParams(location.search).get('ticker')||'').toUpperCase().trim();
  if(!ticker)return;
  let tries=0;
  const waitUniverse=setInterval(()=>{
    tries++;
    const stocks=state?.universe?.stocks||[];
    const stock=stocks.find(x=>String(x.ticker).toUpperCase()===ticker);
    if(stock){
      clearInterval(waitUniverse);
      const input=[...document.querySelectorAll('#sectorGrid input[type="checkbox"]')].find(x=>x.value===stock.sector);
      if(input&&!input.checked){input.checked=true;state.selected.add(stock.sector)}
      $('runScreen').disabled=false;
      $('universeStatus').textContent='Ativo '+ticker+' identificado. Analisando o setor '+sectorPt(stock.sector)+'...';
      $('runScreen').click();
      let drawTries=0;
      const waitAsset=setInterval(()=>{
        drawTries++;
        const asset=state.assetMap.get(ticker);
        if(asset){clearInterval(waitAsset);openDrawer(asset)}
        else if(drawTries>60)clearInterval(waitAsset);
      },350);
    }else if(tries>50){
      clearInterval(waitUniverse);
      $('universeStatus').textContent='O ticker '+ticker+' não foi encontrado no universo atual.';
    }
  },180);
})();