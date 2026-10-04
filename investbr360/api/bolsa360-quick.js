const RANGE='1y';
const INTERVAL='1d';

function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
async function json(url,headers={}){
  const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Mozilla/5.0 Bolsa360/1.1',...headers}});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
async function marketUniverse(){
  const q=new URLSearchParams({type:'stock',limit:'2000',sortBy:'volume',sortOrder:'desc'});
  const j=await json('https://brapi.dev/api/quote/list?'+q.toString());
  return j.stocks||[];
}
async function yahooHistory(ticker){
  const symbol=encodeURIComponent(ticker+'.SA');
  const url='https://query1.finance.yahoo.com/v8/finance/chart/'+symbol+'?range='+RANGE+'&interval='+INTERVAL+'&includePrePost=false&events=div%2Csplits';
  const j=await json(url);
  const result=j?.chart?.result?.[0];
  if(!result)throw new Error('Histórico indisponível');
  const ts=result.timestamp||[];
  const quote=result.indicators?.adjclose?.[0]?.adjclose||result.indicators?.quote?.[0]?.close||[];
  const points=[];
  for(let i=0;i<ts.length;i++){
    const close=n(quote[i]);
    if(close!==null&&ts[i])points.push({t:ts[i],close});
  }
  const meta=result.meta||{};
  return {points,meta:{currency:meta.currency||'BRL',exchange:meta.exchangeName||null,regularMarketPrice:n(meta.regularMarketPrice),previousClose:n(meta.chartPreviousClose)}};
}
async function brapiHistory(ticker){
  const j=await json('https://brapi.dev/api/quote/'+encodeURIComponent(ticker)+'?range=3mo&interval=1d');
  const q=j.results?.[0]||{};
  const points=(q.historicalDataPrice||[]).map(p=>({t:n(p.date),close:n(p.adjustedClose)??n(p.close)})).filter(p=>p.t&&p.close!==null);
  return {points,meta:{currency:q.currency||'BRL',regularMarketPrice:n(q.regularMarketPrice),previousClose:n(q.regularMarketPreviousClose)}};
}
async function loadHistory(ticker){
  try{
    const h=await yahooHistory(ticker);
    if(h.points.length>=10)return {...h,provider:'Yahoo Finance'};
  }catch(_){}
  try{
    const h=await brapiHistory(ticker);
    if(h.points.length)return {...h,provider:'brapi'};
  }catch(_){}
  return {points:[],meta:{},provider:null};
}

module.exports=async function handler(req,res){
  res.setHeader('X-Robots-Tag','noindex');
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=1800');
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const ticker=String(req.query?.ticker||'').trim().toUpperCase();
  if(!/^[A-Z]{4}\d{1,2}$/.test(ticker))return res.status(400).json({error:'Ticker inválido.'});
  try{
    const [stocks,history]=await Promise.all([marketUniverse(),loadHistory(ticker)]);
    const x=stocks.find(s=>String(s.stock||s.symbol||'').toUpperCase()===ticker);
    if(!x)return res.status(404).json({error:'Ativo não encontrado no universo atual.'});
    const stock={
      ticker,
      name:x.name||ticker,
      close:n(x.close),
      change:n(x.change),
      volume:n(x.volume),
      marketCap:n(x.market_cap??x.marketCap),
      sector:x.sector||null,
      subsector:x.subsector||null,
      type:x.type||null,
      subType:x.subType||null,
      logo:x.logo||x.logourl||null
    };
    return res.status(200).json({
      requestedAt:new Date().toISOString(),
      stock,
      history:history.points,
      historyProvider:history.provider,
      historyMeta:history.meta,
      range:RANGE,
      interval:INTERVAL
    });
  }catch(err){
    return res.status(502).json({error:'Não foi possível carregar a consulta rápida.',detail:err.message});
  }
};