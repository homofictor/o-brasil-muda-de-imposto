const FREE_TICKERS=new Set(['PETR4','MGLU3','VALE3','ITUB4']);

async function getJson(url,withAuth=false){
  const headers={Accept:'application/json','User-Agent':'Bolsa360-HomoFictor/0.1'};
  const key=process.env.BRAPI_API_KEY;
  if(withAuth&&key)headers.Authorization='Bearer '+key;
  const r=await fetch(url,{headers});
  const text=await r.text();
  let data={};
  try{data=JSON.parse(text)}catch(_){data={error:text}}
  if(!r.ok){
    const err=new Error(data?.message||data?.error||('HTTP '+r.status));
    err.status=r.status;
    throw err;
  }
  return data;
}

function compactStock(x){
  return {
    ticker:x.stock||x.symbol||null,
    name:x.name||x.shortName||null,
    close:Number.isFinite(Number(x.close))?Number(x.close):null,
    change:Number.isFinite(Number(x.change))?Number(x.change):null,
    volume:Number.isFinite(Number(x.volume))?Number(x.volume):null,
    marketCap:Number.isFinite(Number(x.market_cap??x.marketCap))?Number(x.market_cap??x.marketCap):null,
    sector:x.sector||null,
    subsector:x.subsector||null,
    type:x.type||null,
    subType:x.subType||null,
    logo:x.logo||x.logourl||null
  };
}

async function getList(params={}){
  const q=new URLSearchParams({type:'stock',limit:String(params.limit||2000),sortBy:params.sortBy||'volume',sortOrder:params.sortOrder||'desc'});
  if(params.sector)q.set('sector',params.sector);
  if(params.subsector)q.set('subsector',params.subsector);
  const data=await getJson('https://brapi.dev/api/quote/list?'+q.toString(),false);
  let stocks=(data.stocks||[]).map(compactStock).filter(x=>x.ticker&&x.close!==null);
  if(params.sector)stocks=stocks.filter(x=>x.sector===params.sector);
  if(params.subsector)stocks=stocks.filter(x=>x.subsector===params.subsector);
  return {
    stocks,
    sectors:data.availableSectors||[],
    subsectors:data.availableSubsectors||[],
    requestedAt:data.requestedAt||null
  };
}

function unwrap(results){
  const map=new Map();
  for(const item of (results||[])){
    const ticker=item.symbol||item.requestedSymbol;
    if(ticker)map.set(ticker,item.data||{});
  }
  return map;
}

async function getFundamentals(tickers){
  const key=process.env.BRAPI_API_KEY;
  const allowed=key?tickers:tickers.filter(t=>FREE_TICKERS.has(t));
  if(!allowed.length)return {statistics:new Map(),financial:new Map(),coverage:0,authMode:key?'token':'public-demo',errors:[]};

  const symbols=allowed.join(',');
  const base='https://brapi.dev/api/v2/stocks/';
  const headersAuth=true;
  const errors=[];
  let statistics=new Map(),financial=new Map();

  try{
    const stats=await getJson(base+'statistics?symbols='+encodeURIComponent(symbols)+'&mode=current',headersAuth);
    statistics=unwrap(stats.results);
  }catch(e){errors.push('statistics: '+e.message)}

  try{
    const fin=await getJson(base+'financial-data?symbols='+encodeURIComponent(symbols)+'&mode=current',headersAuth);
    financial=unwrap(fin.results);
  }catch(e){errors.push('financial-data: '+e.message)}

  return {
    statistics,
    financial,
    coverage:new Set([...statistics.keys(),...financial.keys()]).size,
    authMode:key?'token':'public-demo',
    errors
  };
}

function num(v){
  const n=Number(v);
  return Number.isFinite(n)?n:null;
}

function merge(stock,stats={},fin={}){
  const freeCashflow=num(fin.freeCashflow);
  const marketCap=num(stats.marketCap??stock.marketCap);
  return {
    ...stock,
    fundamentals:{
      trailingPE:num(stats.trailingPE),
      priceToBook:num(stats.priceToBook),
      enterpriseToEbitda:num(stats.enterpriseToEbitda),
      dividendYield:num(stats.dividendYield),
      bookValue:num(stats.bookValue),
      earningsPerShare:num(stats.earningsPerShare??stats.trailingEps),
      beta:num(stats.beta),
      returnOnEquity:num(fin.returnOnEquity),
      returnOnAssets:num(fin.returnOnAssets),
      ebitdaMargins:num(fin.ebitdaMargins),
      profitMargins:num(fin.profitMargins),
      currentRatio:num(fin.currentRatio),
      debtToEquity:num(fin.debtToEquity),
      totalDebt:num(fin.totalDebt),
      totalCash:num(fin.totalCash),
      ebitda:num(fin.ebitda),
      freeCashflow,
      operatingCashflow:num(fin.operatingCashflow),
      revenueGrowth:num(fin.revenueGrowthAnnual??fin.revenueGrowth),
      earningsGrowth:num(fin.earningsGrowthAnnual??fin.earningsGrowth),
      targetMeanPrice:num(fin.targetMeanPrice)>0?num(fin.targetMeanPrice):null,
      targetLowPrice:num(fin.targetLowPrice)>0?num(fin.targetLowPrice):null,
      targetHighPrice:num(fin.targetHighPrice)>0?num(fin.targetHighPrice):null,
      analystOpinions:num(fin.numberOfAnalystOpinions),
      fcfYield:(freeCashflow!==null&&marketCap&&marketCap>0)?freeCashflow/marketCap:null,
      netDebtToEbitda:(num(fin.totalDebt)!==null&&num(fin.totalCash)!==null&&num(fin.ebitda)&&num(fin.ebitda)!==0)
        ?(num(fin.totalDebt)-num(fin.totalCash))/num(fin.ebitda):null
    }
  };
}

module.exports=async function handler(req,res){
  const op=String(req.query?.op||'universe');

  try{
    if(op==='universe'){
      const list=await getList({limit:2000});
      res.setHeader('Cache-Control','s-maxage=3600, stale-while-revalidate=21600');
      return res.status(200).json({
        provider:'brapi + arquitetura CVM/B3',
        requestedAt:list.requestedAt||new Date().toISOString(),
        sectors:list.sectors,
        subsectors:list.subsectors,
        stocks:list.stocks
      });
    }

    if(op==='sector'){
      const sector=String(req.query?.sector||'').trim();
      if(!sector)return res.status(400).json({error:'Informe o setor.'});
      const limit=Math.max(5,Math.min(40,Number(req.query?.limit)||20));
      const list=await getList({sector,limit});
      const tickers=list.stocks.map(x=>x.ticker);
      const f=await getFundamentals(tickers);
      const stocks=list.stocks.map(s=>merge(s,f.statistics.get(s.ticker),f.financial.get(s.ticker)));

      res.setHeader('Cache-Control','s-maxage=900, stale-while-revalidate=3600');
      return res.status(200).json({
        provider:'brapi',
        sector,
        requestedAt:list.requestedAt||new Date().toISOString(),
        authMode:f.authMode,
        fundamentalsCoverage:f.coverage,
        total:stocks.length,
        errors:f.errors,
        stocks
      });
    }

    return res.status(400).json({error:'Operação inválida.'});
  }catch(e){
    return res.status(e.status||502).json({error:e.message||'Falha ao consultar dados de mercado.'});
  }
};