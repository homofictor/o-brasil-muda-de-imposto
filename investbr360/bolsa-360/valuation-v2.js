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



const quick360State={ticker:null,history:[],period:'6m',market:null,cvm:null,request:0};

function quickTicker360(raw){
  const q=String(raw||'').trim();
  const exact=q.toUpperCase().replace(/\s/g,'');
  if(/^[A-Z]{4}\d{1,2}$/.test(exact))return exact;
  const found=typeof findIndividualStock==='function'?findIndividualStock(q):null;
  return found?.ticker?String(found.ticker).toUpperCase():null;
}
function ensureQuick360(){
  if(document.getElementById('quick360Modal'))return;
  document.body.insertAdjacentHTML('beforeend',
    '<div id="quick360Backdrop" class="quick360-backdrop hidden"></div>'+
    '<section id="quick360Modal" class="quick360-modal" aria-hidden="true" aria-label="Consulta Rápida 360">'+
      '<button id="quick360Close" class="quick360-close" type="button" aria-label="Fechar">×</button>'+
      '<div id="quick360Body"></div>'+
    '</section>');
  const close=closeQuick360;
  document.getElementById('quick360Close')?.addEventListener('click',close);
  document.getElementById('quick360Backdrop')?.addEventListener('click',close);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('quick360Modal')?.classList.contains('open'))close()});
}
function closeQuick360(){
  document.getElementById('quick360Backdrop')?.classList.add('hidden');
  document.getElementById('quick360Modal')?.classList.remove('open');
  document.getElementById('quick360Modal')?.setAttribute('aria-hidden','true');
}
function quick360HeadHtml(ticker,stock){
  const name=stock?.name||ticker;
  const close=n(stock?.close);
  const change=n(stock?.change);
  return '<div class="quick360-head">'+
    '<div><p class="eyebrow">CONSULTA RÁPIDA 360</p><div class="quick360-title"><h2>'+esc(ticker)+'</h2><span>'+esc(name)+'</span></div></div>'+
    '<div class="quick360-quote"><strong>'+money(close)+'</strong><b class="'+(change===null?'flat':change>=0?'up':'down')+'">'+(change===null?'':(change>=0?'+':'')+change.toFixed(2)+'%')+'</b></div>'+
    '</div>';
}
function quick360Skeleton(ticker,stock){
  return quick360HeadHtml(ticker,stock)+
    '<div class="quick360-loading"><i></i><span>Carregando gráfico e fundamentos...</span></div>'+
    '<div id="quick360ChartBox" class="quick360-chartbox"></div>'+
    '<div id="quick360Info" class="quick360-info"></div>'+
    '<div id="quick360Actions" class="quick360-actions"></div>';
}
function quick360PeriodPoints(points,period){
  if(!Array.isArray(points)||!points.length)return [];
  const sorted=[...points].filter(p=>n(p.t)&&n(p.close)!==null).sort((a,b)=>n(a.t)-n(b.t));
  if(!sorted.length)return [];
  const last=n(sorted.at(-1).t),days={ '1m':31,'3m':93,'6m':186,'1y':370 }[period]||186;
  const cutoff=last-days*86400;
  return sorted.filter(p=>n(p.t)>=cutoff);
}
function quick360ChartSvg(points){
  if(points.length<2)return '<div class="quick360-emptychart">Histórico de preço ainda não disponível para este ativo.</div>';
  const W=900,H=280,P=24;
  const vals=points.map(p=>n(p.close)).filter(v=>v!==null);
  let lo=Math.min(...vals),hi=Math.max(...vals);
  if(hi===lo){hi+=1;lo-=1}
  const x=i=>P+(W-2*P)*(i/(points.length-1));
  const y=v=>H-P-(H-2*P)*((v-lo)/(hi-lo));
  const path=points.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(n(p.close)).toFixed(1)).join(' ');
  const first=n(points[0].close),last=n(points.at(-1).close),chg=first&&last?(last/first-1):null;
  const area=path+' L '+x(points.length-1).toFixed(1)+' '+(H-P)+' L '+P+' '+(H-P)+' Z';
  return '<div class="quick360-chartmeta"><span>Mín. '+money(lo)+'</span><b class="'+(chg===null?'flat':chg>=0?'up':'down')+'">'+(chg===null?'':(chg>=0?'+':'')+pct(chg))+'</b><span>Máx. '+money(hi)+'</span></div>'+
    '<svg class="quick360-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Histórico de preço">'+
      '<path class="quick360-area" d="'+area+'"></path><path class="quick360-line" d="'+path+'"></path>'+
    '</svg>'+
    '<div class="quick360-chartdates"><span>'+new Date(n(points[0].t)*1000).toLocaleDateString('pt-BR')+'</span><span>'+new Date(n(points.at(-1).t)*1000).toLocaleDateString('pt-BR')+'</span></div>';
}
function renderQuick360Chart(){
  const box=document.getElementById('quick360ChartBox');if(!box)return;
  const periods=[['1m','1M'],['3m','3M'],['6m','6M'],['1y','1A']];
  const pts=quick360PeriodPoints(quick360State.history,quick360State.period);
  box.innerHTML='<div class="quick360-charthead"><div><p class="eyebrow">PREÇO</p><h3>Histórico de negociação</h3></div><div class="quick360-periods">'+periods.map(p=>'<button type="button" data-quick-period="'+p[0]+'" class="'+(quick360State.period===p[0]?'active':'')+'">'+p[1]+'</button>').join('')+'</div></div>'+quick360ChartSvg(pts);
  box.querySelectorAll('[data-quick-period]').forEach(btn=>btn.addEventListener('click',()=>{quick360State.period=btn.dataset.quickPeriod;renderQuick360Chart()}));
}
function quick360Metric(label,value,sub){
  return '<div class="quick360-metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong>'+(sub?'<small>'+esc(sub)+'</small>':'')+'</div>';
}
function renderQuick360Info(){
  const box=document.getElementById('quick360Info');if(!box)return;
  const m=quick360State.market||{},cvm=quick360State.cvm||{},f=cvm.fundamentals||{},ac=cvm.analystConsensus||null;
  const full=state.assetMap?.get(quick360State.ticker)||null;
  const analystTargetValue=n(ac?.targetMeanPrice)??n(ac?.targetMedianPrice);
  const analystUpside=analystTargetValue!==null&&n(m.close)>0?analystTargetValue/n(m.close)-1:null;
  const metrics=[
    quick360Metric('Valor de mercado',compactMoney(m.marketCap)),
    quick360Metric('Volume',compactMoney(m.volume)),
    quick360Metric('Setor',sectorPt(cvm.sector||m.sector)),
    quick360Metric('Subsetor',cvm.subsector||m.subsector||'N/D'),
    quick360Metric('P/L',mult(f.trailingPE)),
    quick360Metric('P/VP',mult(f.priceToBook)),
    quick360Metric('ROE',pct(f.returnOnEquity)),
    quick360Metric('Margem EBIT',pct(f.ebitMargin)),
    quick360Metric('Dív. líquida / EBIT',mult(f.netDebtToEbit)),
    quick360Metric('Liquidez corrente',mult(f.currentRatio)),
    quick360Metric('Receita TTM',compactMoney(f.revenue)),
    quick360Metric('Lucro TTM',compactMoney(f.netIncome))
  ].join('');

  let top='';
  if(full)top=renderDecision360(full);
  else top='<section class="decision360 loading"><div class="decision360-loading"><i></i><div><p class="eyebrow">ANÁLISE 360</p><h3>Calculando Preço-Alvo e Indicação 360...</h3><small>A janela permanece utilizável enquanto o motor compara pares e processa os modelos.</small></div></div></section>';

  let consensus='';
  if(ac){
    consensus='<section class="quick360-consensus"><div><p class="eyebrow">CONSENSO EXTERNO</p><h3>'+esc(ac.recommendation||'N/D')+'</h3><small>Referência independente dos analistas de mercado</small></div><div>'+quick360Metric('Preço-alvo dos analistas',money(analystTargetValue),analystUpside===null?'':pct(analystUpside)+' vs. fechamento')+'</div></section>';
  }
  let fullMetrics='';
  if(full){
    const x=analysis360(full);
    fullMetrics='<section class="quick360-fullscores"><p class="eyebrow">VALOR E QUALIDADE</p><div>'+
      quick360Metric('Valor Justo por Pares',money(full.fairValue?.central),full.fairValue?pct(full.fairValue.distance)+' vs. preço':'')+
      quick360Metric('Valor Intrínseco 360',money(full.intrinsicValue?.central),full.intrinsicValue?.available?pct(full.intrinsicValue.distance)+' vs. preço':'')+
      quick360Metric('Valuation 360',n(full.valuationScore)===null?'N/D':Math.round(n(full.valuationScore))+'/100')+
      quick360Metric('Qualidade',n(full.qualityScore)===null?'N/D':Math.round(n(full.qualityScore))+'/100')+
      quick360Metric('Solidez',n(full.solidityScore)===null?'N/D':Math.round(n(full.solidityScore))+'/100')+
      quick360Metric('Crescimento',n(full.growthScore)===null?'N/D':Math.round(n(full.growthScore))+'/100')+
      '</div></section>'+
      '<section class="quick360-position"><p class="eyebrow">REFERÊNCIAS DE VALOR</p><div>'+
      quick360Metric('Preço atual',money(full.close))+
      quick360Metric('Preço-Alvo 360',x.target?.available?money(x.target.central):'N/D',x.target?.available?'12 meses · '+pct(x.target.upside):'')+
      quick360Metric('Valor intrínseco',money(full.intrinsicValue?.central))+
      quick360Metric('Alvo dos analistas',money(analystTargetValue))+
      '</div></section>';
  }

  box.innerHTML=top+
    '<section class="quick360-fund"><div class="quick360-sectiontitle"><p class="eyebrow">FUNDAMENTOS</p><h3>Visão imediata</h3><small>'+(f.source?esc(f.source):'Base CVM em carregamento')+'</small></div><div class="quick360-metrics">'+metrics+'</div></section>'+
    fullMetrics+consensus;
}
function renderQuick360Actions(){
  const box=document.getElementById('quick360Actions');if(!box)return;
  const ticker=quick360State.ticker,fav=bolsa360IsFavorite(ticker),full=state.assetMap?.get(ticker)||null;
  box.innerHTML='<span class="quick360-auto-status">'+(full?'Análise 360 concluída':'Análise 360 sendo refinada em segundo plano')+'</span>'+
    '<button id="quick360Favorite" type="button" class="secondary">'+(fav?'★ Favorito':'☆ Favoritar')+'</button>'+
    (full?'<button id="quick360Compare" type="button" class="secondary">'+(state.compare360?.has(ticker)?'✓ No comparador':'＋ Comparar')+'</button>':'');
  document.getElementById('quick360Favorite')?.addEventListener('click',()=>{
    const active=bolsa360ToggleFavorite(ticker);
    document.getElementById('quick360Favorite').textContent=active?'★ Favorito':'☆ Favoritar';
    refreshMarket360();
  });
  document.getElementById('quick360Compare')?.addEventListener('click',()=>{
    addCompare360(ticker);
    document.getElementById('quick360Compare').textContent=state.compare360.has(ticker)?'✓ No comparador':'＋ Comparar';
  });
}
async function openQuickAsset360(raw){
  ensureQuick360();
  let ticker=quickTicker360(raw);
  if(!ticker&&state.universe?.stocks?.length){
    const s=typeof findIndividualStock==='function'?findIndividualStock(raw):null;
    ticker=s?.ticker?String(s.ticker).toUpperCase():null;
  }
  if(!ticker){
    const status=document.getElementById('individualAssetStatus');
    if(status)status.textContent='Ticker ou empresa não encontrado.';
    return;
  }
  const local=state.universe?.stocks?.find(s=>String(s.ticker||'').toUpperCase()===ticker)||null;
  quick360State.ticker=ticker;quick360State.period='6m';quick360State.history=[];quick360State.market=local;quick360State.cvm=null;
  const request=++quick360State.request;
  const modal=document.getElementById('quick360Modal'),backdrop=document.getElementById('quick360Backdrop'),body=document.getElementById('quick360Body');
  body.innerHTML=quick360Skeleton(ticker,local);
  backdrop.classList.remove('hidden');modal.classList.add('open');modal.setAttribute('aria-hidden','false');

  const status=document.getElementById('individualAssetStatus');
  if(status)status.textContent='Abrindo '+ticker+' e calculando a Análise 360...';

  const quickPromise=fetch('/api/bolsa360-quick?ticker='+encodeURIComponent(ticker),{headers:{Accept:'application/json'}}).then(async r=>{const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Falha ao carregar ativo.');return j});
  const cvmPromise=state.cvmBase?Promise.resolve(state.cvmBase):fetch('/api/bolsa360-cvm',{headers:{Accept:'application/json'}}).then(r=>r.ok?r.json():null).catch(()=>null);

  try{
    const q=await quickPromise;if(request!==quick360State.request)return;
    quick360State.market=q.stock||local;quick360State.history=q.history||[];
    const head=body.querySelector('.quick360-head');
    if(head)head.outerHTML=quick360HeadHtml(ticker,quick360State.market);
    body.querySelector('.quick360-loading')?.remove();
    renderQuick360Chart();
  }catch(err){
    if(request!==quick360State.request)return;
    const loading=body.querySelector('.quick360-loading');
    if(loading)loading.innerHTML='<span>'+esc(err.message||'Não foi possível carregar a cotação.')+'</span>';
  }

  const base=await cvmPromise;if(request!==quick360State.request)return;
  if(base&&!state.cvmBase)state.cvmBase=base;
  quick360State.cvm=(base?.companies||[]).find(s=>String(s.ticker||'').toUpperCase()===ticker)||null;
  renderQuick360Info();renderQuick360Actions();

  const fullPromise=ensureFullAsset360(ticker,request);
  const trendPromise=ensureTrendTicker360(ticker);
  const [full]=await Promise.all([fullPromise,trendPromise]);
  if(request!==quick360State.request)return;
  if(full){
    renderQuick360Info();
    renderQuick360Actions();
    if(status)status.textContent=ticker+' analisado. Preço-Alvo e Indicação 360 atualizados.';
  }else{
    if(status)status.textContent=ticker+' aberto. Parte da análise avançada está indisponível para este ativo.';
  }
}
function initQuick360Search(){
  ensureQuick360();
  if(!document.documentElement.dataset.quick360TickerCapture){
    document.documentElement.dataset.quick360TickerCapture='1';
    document.addEventListener('click',e=>{
      const btn=e.target.closest('.asset-btn[data-ticker]');
      if(!btn)return;
      e.preventDefault();e.stopImmediatePropagation();
      openQuickAsset360(btn.dataset.ticker);
    },true);
  }
  const btn=document.getElementById('individualAssetAdd'),input=document.getElementById('individualAssetInput');
  if(btn&&!btn.dataset.quick360){
    btn.dataset.quick360='1';
    btn.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();openQuickAsset360(input?.value||'')},true);
  }
  if(input&&!input.dataset.quick360){
    input.dataset.quick360='1';
    input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();openQuickAsset360(input.value)}},true);
    const form=input.closest('.individual-asset-form');
    if(form&&!document.getElementById('quick360Suggest'))form.insertAdjacentHTML('beforeend','<div id="quick360Suggest" class="quick360-suggest hidden"></div>');
    input.addEventListener('input',()=>{
      const box=document.getElementById('quick360Suggest');if(!box)return;
      const q=String(input.value||'').trim().toLowerCase();
      if(!q||!state.universe?.stocks?.length){box.classList.add('hidden');box.innerHTML='';return}
      const norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
      const nq=norm(q);
      const rows=(state.universe.stocks||[]).filter(s=>norm(s.ticker).includes(nq)||norm(s.name).includes(nq)).slice(0,6);
      if(!rows.length){box.classList.add('hidden');box.innerHTML='';return}
      box.innerHTML=rows.map(s=>'<button type="button" data-quick-suggest="'+esc(s.ticker)+'"><b>'+esc(s.ticker)+'</b><span>'+esc(s.name||'')+'</span><strong>'+money(s.close)+'</strong></button>').join('');
      box.classList.remove('hidden');
      box.querySelectorAll('[data-quick-suggest]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.quickSuggest;box.classList.add('hidden');openQuickAsset360(b.dataset.quickSuggest)}));
    });
  }
}
setTimeout(initQuick360Search,0);


function clamp360(v,min,max){const x=n(v);return x===null?null:Math.max(min,Math.min(max,x))}
function median360(values){
  const a=(values||[]).map(n).filter(v=>v!==null).sort((x,y)=>x-y);
  if(!a.length)return null;
  const m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function growthEstimate360(a){
  const g=a?.growth||{};
  const raw=median360([g.revenueCagr3,g.ebitCagr3,g.profitCagr3,g.revenueCagrLong]);
  return raw===null?0.03:clamp360(raw,-0.12,0.20);
}
function priceTarget360(a){
  const close=n(a?.close);
  if(close===null||close<=0)return {available:false,reason:'Preço atual indisponível.'};

  const growth=growthEstimate360(a);
  const iv=a?.intrinsicValue||null,fv=a?.fairValue||null;
  const carry=clamp360(0.04+Math.max(-0.02,Math.min(0.08,growth*0.35)),0.02,0.12);
  const growthAnchor=close*(1+growth);
  const components=[];

  if(iv?.available===true&&n(iv.central)>0){
    components.push({
      name:'Valor Intrínseco 360 projetado',
      value:n(iv.central)*(1+carry),
      low:n(iv.low)>0?n(iv.low)*(1+Math.max(0,carry-.03)):null,
      high:n(iv.high)>0?n(iv.high)*(1+Math.min(.15,carry+.03)):null,
      weight:.55
    });
  }
  if(n(fv?.central)>0){
    components.push({
      name:'Pares 360 projetado',
      value:n(fv.central)*(1+clamp360(growth,-.08,.15)),
      low:n(fv.low)>0?n(fv.low)*(1+clamp360(growth-.04,-.12,.10)):null,
      high:n(fv.high)>0?n(fv.high)*(1+clamp360(growth+.04,-.04,.20)):null,
      weight:.30
    });
  }
  components.push({
    name:'Fundamentos 12m',
    value:growthAnchor,
    low:close*(1+clamp360(growth-.08,-.20,.12)),
    high:close*(1+clamp360(growth+.08,-.04,.28)),
    weight:.15
  });

  const valid=components.filter(x=>n(x.value)>0);
  if(!valid.length)return {available:false,reason:'Modelos internos insuficientes.'};
  const w=valid.reduce((s,x)=>s+x.weight,0);
  const central=valid.reduce((s,x)=>s+x.value*x.weight,0)/w;
  const lowVals=valid.map(x=>n(x.low)).filter(x=>x!==null&&x>0);
  const highVals=valid.map(x=>n(x.high)).filter(x=>x!==null&&x>0);
  const low=lowVals.length?Math.min(...lowVals):central*.88;
  const high=highVals.length?Math.max(...highVals):central*1.12;
  const dispersion=Math.max(...valid.map(x=>x.value))/Math.min(...valid.map(x=>x.value))-1;
  const scoreCount=[a?.valuationScore,a?.qualityScore,a?.solidityScore,a?.growthScore].map(n).filter(x=>x!==null).length;
  let confidence='Baixa';
  if(valid.length>=3&&dispersion<=.35&&scoreCount>=3)confidence='Alta';
  else if(valid.length>=2&&dispersion<=.70&&scoreCount>=2)confidence='Média';

  return {
    available:true,
    horizonMonths:12,
    central,low,high,
    upside:central/close-1,
    growthAssumption:growth,
    confidence,
    dispersion,
    components:valid.map(x=>({name:x.name,value:x.value,weight:x.weight/w})),
    methodology:'Combinação independente do Valor Intrínseco 360, valuation por pares e crescimento fundamental projetado. Não utiliza o consenso dos analistas.'
  };
}
function convergence360(a,target){
  const signals=[];
  const add=(name,value)=>{
    const v=n(value);if(v===null)return;
    const s=v>=.10?1:v<=-.10?-1:0;
    signals.push({name,value:v,signal:s});
  };
  add('Preço-Alvo 360',target?.available?target.upside:null);
  add('Valor Intrínseco',a?.intrinsicValue?.available===true?a.intrinsicValue.distance:null);
  add('Valor por pares',a?.fairValue?.distance);
  const trend=state.trendMap?.get(a?.ticker);
  if(trend?.available){
    const s=trend.direction==='Alta'?1:trend.direction==='Baixa'?-1:0;
    signals.push({name:'Tendência 360',value:null,signal:s});
  }
  if(!signals.length)return {label:'N/D',className:'na',score:0,count:0,signals:[]};
  const score=signals.reduce((s,x)=>s+x.signal,0),ratio=score/signals.length;
  let label='Mista',className='mixed';
  if(signals.length>=3&&ratio>=.75){label='Forte positiva';className='strong-positive'}
  else if(ratio>.20){label='Positiva';className='positive'}
  else if(signals.length>=3&&ratio<=-.75){label='Forte negativa';className='strong-negative'}
  else if(ratio<-.20){label='Negativa';className='negative'}
  return {label,className,score,count:signals.length,signals};
}
function indication360(a,target,conv){
  if(!target?.available)return {label:'NEUTRO',className:'neutral',reason:'Dados insuficientes para uma indicação quantitativa robusta.',expectedReturn:null,dividendYield:null};
  const f=a?.fundamentals||{};
  const dy=clamp360(f.dividendYield,0,.25);
  const expectedReturn=target.upside+(dy??0);
  const overall=bolsa360CompositeScore(a);
  const quality=n(a?.qualityScore),solidity=n(a?.solidityScore);
  const confidence=target.confidence;
  const riskGate=(quality!==null&&quality<35)||(solidity!==null&&solidity<35)||confidence==='Baixa';

  let label='NEUTRO',className='neutral',reason='';
  if(expectedReturn<=-.10&&confidence!=='Baixa'){
    label='VENDA';className='sell';
    reason='O retorno esperado em 12 meses é negativo e os modelos internos apresentam confiança suficiente.';
  }else if(expectedReturn>=.15&&!riskGate&&(overall===null||overall>=55)&&(quality===null||quality>=45)&&(solidity===null||solidity>=45)){
    label='COMPRA';className='buy';
    reason='O retorno esperado supera o limiar de 15% e os filtros mínimos de qualidade, solidez e confiança foram atendidos.';
  }else if(expectedReturn>=.15&&riskGate){
    reason='Há potencial de valorização, mas qualidade, solidez ou confiança do modelo impedem uma classificação de compra.';
  }else if(expectedReturn<0&&['Negativa','Forte negativa'].includes(conv?.label)){
    label='VENDA';className='sell';
    reason='O retorno esperado é negativo e os sinais internos apresentam convergência desfavorável.';
  }else{
    reason='O potencial de retorno ou a combinação de fundamentos não é suficiente para classificar o ativo como compra ou venda.';
  }
  return {label,className,reason,expectedReturn,dividendYield:dy};
}
function analysis360(a){
  const target=priceTarget360(a);
  const convergence=convergence360(a,target);
  const indication=indication360(a,target,convergence);
  return {target,convergence,indication};
}
function analysisReason360(a,x){
  const pieces=[];
  if(x.target?.available)pieces.push('Preço-Alvo 360 '+money(x.target.central)+' ('+(x.target.upside>=0?'+':'')+pct(x.target.upside)+')');
  if(a?.intrinsicValue?.available===true)pieces.push('valor intrínseco '+money(a.intrinsicValue.central)+' ('+(n(a.intrinsicValue.distance)>=0?'+':'')+pct(a.intrinsicValue.distance)+')');
  const score=bolsa360CompositeScore(a);if(score!==null)pieces.push('Nota 360 '+score+'/100');
  const trend=state.trendMap?.get(a?.ticker);if(trend?.available)pieces.push('tendência '+String(trend.strength||trend.direction).toLowerCase());
  return pieces.join(' · ');
}
function renderDecision360(a){
  const x=analysis360(a),t=x.target,i=x.indication,c=x.convergence;
  if(!t.available)return '<section class="decision360 unavailable"><p class="eyebrow">DECISÃO 360</p><h3>Em cálculo</h3><p>Os modelos internos ainda não têm dados suficientes para calcular o Preço-Alvo 360.</p></section>';
  return '<section class="decision360 '+i.className+'">'+
    '<div class="decision360-main"><div><p class="eyebrow">INDICAÇÃO 360</p><h2>'+esc(i.label)+'</h2><small>Avaliação quantitativa padronizada, não recomendação individual.</small></div>'+
    '<div class="decision360-target"><span>Preço-Alvo 360 · 12 meses</span><strong>'+money(t.central)+'</strong><b class="'+(t.upside>=0?'up':'down')+'">'+(t.upside>=0?'+':'')+pct(t.upside)+'</b></div></div>'+
    '<div class="decision360-grid">'+
      quick360Metric('Faixa 360',money(t.low)+' a '+money(t.high))+
      quick360Metric('Confiança 360',t.confidence) +
      quick360Metric('Convergência 360',c.label) +
      quick360Metric('Nota 360',(bolsa360CompositeScore(a)??'N/D')+(bolsa360CompositeScore(a)!==null?'/100':''))+
    '</div>'+
    '<p class="decision360-reason"><b>Leitura:</b> '+esc(i.reason)+' '+esc(analysisReason360(a,x))+'</p>'+
    '<details class="decision360-method"><summary>Como o Preço-Alvo 360 foi calculado</summary><p>'+esc(t.methodology)+'</p><div>'+t.components.map(k=>'<span>'+esc(k.name)+' <b>'+Math.round(k.weight*100)+'%</b></span>').join('')+'</div></details>'+
    '</section>';
}
async function ensureTrendTicker360(ticker){
  if(state.trendMap?.has(ticker))return state.trendMap.get(ticker);
  try{
    const r=await fetch('/api/bolsa360-trend?tickers='+encodeURIComponent(ticker),{headers:{Accept:'application/json'}});
    const j=await r.json().catch(()=>({}));
    const x=(j.results||[])[0];
    if(x?.ticker){state.trendMap.set(x.ticker,x);if(typeof saveTrend360Cache==='function')saveTrend360Cache();return x}
  }catch(_){}
  return null;
}
async function ensureFullAsset360(ticker,request){
  const existing=state.assetMap?.get(ticker);if(existing)return existing;
  if(!state.cvmBase){
    try{state.cvmBase=await api('/api/bolsa360-cvm')}catch(_){return null}
  }
  if(request!==quick360State.request)return null;
  const cvm=(state.cvmBase?.companies||[]).find(s=>String(s.ticker||'').toUpperCase()===ticker);
  if(!cvm)return null;
  const sector=sectorKeyForStock(cvm);
  if(!sector)return null;
  state.selected.clear();
  document.querySelectorAll('#sectorGrid input[type=checkbox]').forEach(x=>{x.checked=x.value===sector});
  state.selected.add(sector);
  const run=document.getElementById('runScreen');if(run)run.disabled=false;
  try{await runScreen()}catch(_){return null}
  if(request!==quick360State.request)return null;
  return state.assetMap?.get(ticker)||null;
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
    openQuickAsset360(btn.dataset.marketTicker);
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
      openQuickAsset360(btn.dataset.oppTicker);
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
  const x=analysis360(a),t=x.target,i=x.indication,c=x.convergence,ac=a?.analystConsensus||{},analyst=analystTarget(a);
  const analystUpside=n(analyst)!==null&&n(a?.close)>0?analyst/n(a.close)-1:null;
  return '<section class="summary360-box">'+
    '<div><span>Indicação 360</span><strong class="'+i.className+'">'+esc(i.label)+'</strong></div>'+
    '<div><span>Preço-Alvo 360</span><strong>'+(t.available?money(t.central):'N/D')+'</strong><small>'+(t.available?pct(t.upside)+' · 12 meses':'')+'</small></div>'+
    '<div><span>Nota 360</span><strong>'+(bolsa360CompositeScore(a)===null?'N/D':bolsa360CompositeScore(a)+'/100')+'</strong></div>'+
    '<div><span>Convergência</span><strong>'+esc(c.label)+'</strong></div>'+
    '<div><span>Valor Intrínseco</span><strong>'+money(a?.intrinsicValue?.central)+'</strong></div>'+
    '<div><span>Analistas</span><strong>'+esc(ac.recommendation||'N/D')+'</strong><small>'+(analystUpside===null?'':pct(analystUpside)+' de upside')+'</small></div>'+
    '</section>';
}


function marketTicker360Format(x){
  const v=n(x?.price);
  if(v===null)return 'N/D';
  if(x.unit==='pts')return Math.round(v).toLocaleString('pt-BR');
  if(x.unit==='%')return (v>0?'+':'')+v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
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
    openQuickAsset360(btn.dataset.stripTicker);
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
  const countText=rows.length===allRows.length?block.total+' ativos':rows.length+' exibidos de '+allRows.length;
  return '<section class="sector-block"><div class="sector-block-head"><div><h3>'+esc(block.label||sectorPt(block.sector))+'</h3><small>'+countText+' · '+coverage+' com fundamentos · TTM até '+formatDate(state.cvmBase?.latestItrReference)+'</small></div><small>Clique no ticker para abrir a Análise 360</small></div><div class="table-wrap"><table class="unified360-table"><thead><tr>'+
    '<th>Ativo</th><th>Preço</th><th>Indicação 360</th><th>Preço-Alvo 360</th><th>Potencial 12m</th><th>Nota 360</th><th>Convergência</th><th>Tendência</th><th>Valor intrínseco</th><th>Valor por pares</th><th>Analistas</th><th>P/L</th><th>ROE</th>'+
    '</tr></thead><tbody>'+
    rows.map(r=>{
      const f=r.fundamentals||{},ac=r.analystConsensus||{},trend=state.trendMap.get(r.ticker)||null;
      const x=analysis360(r),t=x.target,i=x.indication,conv=x.convergence;
      return '<tr>'+
        '<td><button class="asset-btn" data-ticker="'+esc(r.ticker)+'">'+esc(r.ticker)+'</button><small>'+esc(r.cvmName||r.name||'')+'</small></td>'+
        '<td><strong>'+money(r.close)+'</strong><small>'+(n(r.change)!==null?(n(r.change)>=0?'+':'')+n(r.change).toFixed(2)+'%':'N/D')+'</small></td>'+
        '<td><span class="indication360-badge '+i.className+'">'+esc(i.label)+'</span></td>'+
        '<td><strong>'+(t.available?money(t.central):'N/D')+'</strong><small>'+(t.available?'Confiança '+esc(t.confidence):'')+'</small></td>'+
        '<td><strong class="'+(t.available&&t.upside>=0?'positive':'negative')+'">'+(t.available?pct(t.upside):'N/D')+'</strong></td>'+
        '<td>'+scoreBadge(bolsa360CompositeScore(r))+'</td>'+
        '<td><span class="convergence360-badge '+conv.className+'">'+esc(conv.label)+'</span></td>'+
        '<td>'+trendBadge(trend)+'</td>'+
        '<td><strong>'+money(r.intrinsicValue?.central)+'</strong><small>'+(r.intrinsicValue?.available?pct(r.intrinsicValue.distance)+' vs. preço':'')+'</small></td>'+
        '<td><strong>'+money(r.fairValue?.central)+'</strong><small>'+(r.fairValue?pct(r.fairValue.distance)+' vs. preço':'')+'</small></td>'+
        '<td>'+analystRecommendationBadge(ac.recommendation)+'</td>'+
        '<td>'+mult(f.trailingPE)+'</td><td>'+pct(f.returnOnEquity)+'</td>'+
      '</tr>';
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