const DEMO=new Set(['PETR4','VALE3','ITUB4','MGLU3']);

function num(v){const x=Number(v);return Number.isFinite(x)?x:null}
function mean(a){return a.length?a.reduce((s,x)=>s+x,0)/a.length:null}
function std(a){
  if(a.length<2)return null;
  const m=mean(a);return Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1));
}
function sma(a,n){return a.length>=n?mean(a.slice(-n)):null}
function emaSeries(a,n){
  if(!a.length)return [];
  const k=2/(n+1),out=[a[0]];
  for(let i=1;i<a.length;i++)out.push(a[i]*k+out[i-1]*(1-k));
  return out;
}
function rsi(a,n=14){
  if(a.length<n+1)return null;
  const ch=[];
  for(let i=a.length-n;i<a.length;i++)ch.push(a[i]-a[i-1]);
  const gains=ch.map(x=>Math.max(x,0)),losses=ch.map(x=>Math.max(-x,0));
  const ag=mean(gains),al=mean(losses);
  if(al===0)return 100;
  const rs=ag/al;return 100-(100/(1+rs));
}
function trendFromHistory(points){
  const clean=(points||[])
    .map(p=>({date:num(p.date),close:num(p.adjustedClose)??num(p.close),volume:num(p.volume)}))
    .filter(p=>p.date&&p.close&&p.close>0)
    .sort((a,b)=>a.date-b.date);
  const seen=new Set(),rows=[];
  for(const p of clean){if(!seen.has(p.date)){seen.add(p.date);rows.push(p)}}
  const closes=rows.map(x=>x.close);
  if(closes.length<26)return {available:false,reason:'Histórico insuficiente para calcular a tendência com segurança.',observations:closes.length};

  const last=closes.at(-1),ma20=sma(closes,20),ma50=sma(closes,50);
  const ma20Prev=closes.length>=25?mean(closes.slice(-25,-5)):null;
  const slope20=ma20!==null&&ma20Prev!==null&&ma20Prev!==0?ma20/ma20Prev-1:null;
  const mom20=closes.length>=21?last/closes.at(-21)-1:null;
  const mom60=closes.length>=61?last/closes.at(-61)-1:null;
  const rsi14=rsi(closes,14);

  const e12=emaSeries(closes,12),e26=emaSeries(closes,26);
  const macd=e12.map((v,i)=>v-e26[i]);
  const signal=emaSeries(macd,9);
  const macdValue=macd.at(-1),signalValue=signal.at(-1),macdHist=macdValue-signalValue;

  const returns=[];
  for(let i=Math.max(1,closes.length-20);i<closes.length;i++)returns.push(closes[i]/closes[i-1]-1);
  const vol20=std(returns);
  const annVol=vol20!==null?vol20*Math.sqrt(252):null;

  let score=0,signals=[];
  if(ma20!==null){const s=last>=ma20?1:-1;score+=s;signals.push({name:'Preço vs MM20',value:s})}
  if(ma20!==null&&ma50!==null){const s=ma20>=ma50?1:-1;score+=s;signals.push({name:'MM20 vs MM50',value:s})}
  if(slope20!==null){const s=slope20>0.004?1:slope20<-.004?-1:0;score+=s;signals.push({name:'Inclinação MM20',value:s})}
  if(mom20!==null){const s=mom20>0.015?1:mom20<-.015?-1:0;score+=s;signals.push({name:'Momentum 20d',value:s})}
  if(mom60!==null){const s=mom60>0.03?1:mom60<-.03?-1:0;score+=s;signals.push({name:'Momentum 60d',value:s})}
  if(macdHist!==null){const s=macdHist>0?1:macdHist<0?-1:0;score+=s;signals.push({name:'MACD',value:s})}
  if(rsi14!==null){
    const s=rsi14>=55&&rsi14<=72?1:rsi14<=45&&rsi14>=28?-1:0;
    score+=s;signals.push({name:'RSI 14',value:s});
  }

  const maxScore=signals.reduce((s,x)=>s+Math.abs(x.value||0),0)||1;
  let direction='Neutra',strength='Lateral';
  if(score>=4){direction='Alta';strength='Alta forte'}
  else if(score>=2){direction='Alta';strength='Alta moderada'}
  else if(score<=-4){direction='Baixa';strength='Baixa forte'}
  else if(score<=-2){direction='Baixa';strength='Baixa moderada'}

  const agreement=Math.abs(score)/Math.max(1,signals.length);
  const confidence=closes.length>=50&&agreement>=.55?'Alta':closes.length>=35&&agreement>=.30?'Média':'Baixa';

  return {
    available:true,
    direction,strength,score,
    observations:closes.length,
    lastClose:last,
    sma20:ma20,sma50:ma50,slope20,
    momentum20:mom20,momentum60:mom60,
    rsi14,macd:macdValue,macdSignal:signalValue,macdHistogram:macdHist,
    annualizedVolatility20:annVol,
    firstDate:new Date(rows[0].date*1000).toISOString(),
    lastDate:new Date(rows.at(-1).date*1000).toISOString(),
    confidence,signals
  };
}

async function fetchV2(symbols,key){
  const headers={Accept:'application/json','User-Agent':'Bolsa360-HomoFictor/0.9'};
  if(key)headers.Authorization='Bearer '+key;
  const url='https://brapi.dev/api/v2/stocks/historical?symbols='+encodeURIComponent(symbols.join(','))+'&range=3mo&interval=1d&sortOrder=asc';
  const r=await fetch(url,{headers});
  if(!r.ok)throw new Error('BRAPI_V2_'+r.status);
  const j=await r.json();
  const out=new Map();
  for(const item of (j.results||[])){
    const ticker=String(item.symbol||item.requestedSymbol||'').toUpperCase();
    const data=item.data||{};
    if(ticker)out.set(ticker,data.historicalDataPrice||[]);
  }
  return out;
}
async function fetchLegacyDemo(ticker){
  const url='https://brapi.dev/api/quote/'+encodeURIComponent(ticker)+'?range=3mo&interval=1d';
  const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Bolsa360-HomoFictor/0.9'}});
  if(!r.ok)throw new Error('BRAPI_DEMO_'+r.status);
  const j=await r.json();
  return j.results?.[0]?.historicalDataPrice||[];
}

module.exports=async function handler(req,res){
  res.setHeader('X-Robots-Tag','noindex');
  res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=43200');
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const raw=String(req.query?.tickers||'');
  const tickers=[...new Set(raw.split(',').map(x=>x.trim().toUpperCase()).filter(x=>/^[A-Z]{4}\d{1,2}$/.test(x)))].slice(0,20);
  if(!tickers.length)return res.status(400).json({error:'Informe ao menos um ticker válido.'});

  const key=process.env.BRAPI_API_KEY||'';
  const histories=new Map(),errors=new Map();

  if(key){
    // O plano gratuito da brapi aceita 1 ticker por requisição. Consultamos
    // individualmente e deixamos a Vercel fazer cache por 6 horas.
    const tasks=tickers.map(async ticker=>{
      try{
        const m=await fetchV2([ticker],key);
        const rows=m.get(ticker);
        if(rows?.length)histories.set(ticker,rows);
        else errors.set(ticker,'Histórico não retornado pela fonte.');
      }catch(_){
        errors.set(ticker,'Não foi possível consultar o histórico na fonte.');
      }
    });
    await Promise.all(tasks);
  }else{
    for(const t of tickers){
      if(!DEMO.has(t)){
        errors.set(t,'Histórico amplo requer uma chave gratuita da brapi no ambiente.');
        continue;
      }
      try{histories.set(t,await fetchLegacyDemo(t))}
      catch(_){errors.set(t,'Histórico público de demonstração indisponível para este ativo.')}
    }
  }

  const results=tickers.map(ticker=>{
    if(histories.has(ticker)){
      const trend=trendFromHistory(histories.get(ticker));
      return {ticker,...trend,provider:'brapi historical',range:'3mo',interval:'1d'};
    }
    return {ticker,available:false,reason:errors.get(ticker)||'Histórico não retornado pela fonte.',provider:'brapi historical'};
  });
  return res.status(200).json({
    requestedAt:new Date().toISOString(),
    sourceMode:key?'BRAPI_FREE_KEY':'public-demo',
    keyConfigured:Boolean(key),
    range:'3mo',interval:'1d',
    methodology:'Tendência 360 V1',
    results
  });
};
