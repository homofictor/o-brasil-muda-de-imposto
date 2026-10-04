const BLUE_CHIPS=['PETR4','VALE3','ITUB4','BBAS3','BBDC4','WEGE3','ELET3','B3SA3','SUZB3','RENT3'];

function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function pctChange(now,prev){return now!==null&&prev!==null&&prev!==0?(now/prev-1)*100:null}
async function json(url,headers={}){
  const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Bolsa360-HomoFictor/1.0',...headers}});
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
function mmddyyyy(d){return String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')+'-'+d.getFullYear()}
async function loadIbov(){
  try{
    const j=await json('https://brapi.dev/api/quote/%5EBVSP');
    const q=j.results?.[0]||{};
    const price=n(q.regularMarketPrice)??n(q.price);
    const change=n(q.regularMarketChangePercent)??n(q.change);
    return price===null?null:{kind:'index',symbol:'IBOV',label:'Ibovespa',price,change,unit:'pts',source:'brapi'};
  }catch(_){return null}
}
async function loadIfix(){
  try{
    const j=await json('https://brapi.dev/api/quote/IFIX.SA');
    const q=j.results?.[0]||{};
    const price=n(q.regularMarketPrice)??n(q.price);
    const change=n(q.regularMarketChangePercent)??n(q.change);
    return price===null?null:{kind:'index',symbol:'IFIX',label:'IFIX',price,change,unit:'pts',source:'brapi'};
  }catch(_){return null}
}
async function loadStocks(){
  const j=await json('https://brapi.dev/api/quote/list?type=stock&limit=2000&sortBy=volume&sortOrder=desc');
  const map=new Map((j.stocks||[]).map(x=>[String(x.stock||x.symbol||'').toUpperCase(),x]));
  return BLUE_CHIPS.map(t=>{
    const x=map.get(t);if(!x)return null;
    const price=n(x.close),change=n(x.change);
    return price===null?null:{kind:'stock',symbol:t,label:x.name||t,price,change,unit:'BRL',marketCap:n(x.market_cap??x.marketCap),volume:n(x.volume),source:'brapi'};
  }).filter(Boolean);
}
async function loadUsd(){
  try{
    const end=new Date(),start=new Date(Date.now()-9*86400000);
    const url="https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='"+mmddyyyy(start)+"'&@dataFinalCotacao='"+mmddyyyy(end)+"'&$top=100&$orderby=dataHoraCotacao%20desc&$format=json";
    const j=await json(url);
    const rows=(j.value||[]).map(x=>({date:String(x.dataHoraCotacao||'').slice(0,10),price:n(x.cotacaoVenda)})).filter(x=>x.date&&x.price!==null);
    if(!rows.length)return null;
    const byDay=[];const seen=new Set();
    for(const r of rows){if(!seen.has(r.date)){seen.add(r.date);byDay.push(r)}}
    const cur=byDay[0],prev=byDay[1];
    return {kind:'currency',symbol:'USD',label:'Dólar PTAX',price:cur.price,change:prev?pctChange(cur.price,prev.price):null,unit:'BRL',source:'BCB/PTAX',referenceDate:cur.date};
  }catch(_){return null}
}
async function loadSelic(){
  try{
    const end=new Date(),start=new Date(Date.now()-12*86400000);
    const br=d=>String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
    const url='https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json&dataInicial='+encodeURIComponent(br(start))+'&dataFinal='+encodeURIComponent(br(end));
    const j=await json(url);
    const rows=Array.isArray(j)?j:[];
    const x=rows.at(-1)||null,rate=n(String(x?.valor||'').replace(',','.'));
    return rate===null?null:{kind:'rate',symbol:'SELIC',label:'Selic Meta',price:rate,change:null,unit:'% a.a.',source:'BCB/SGS',referenceDate:x?.data||null};
  }catch(_){return null}
}

module.exports=async function handler(req,res){
  res.setHeader('X-Robots-Tag','noindex');
  res.setHeader('Cache-Control','s-maxage=300, stale-while-revalidate=1800');
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  try{
    const [stocks,ibov,ifix,usd,selic]=await Promise.all([loadStocks(),loadIbov(),loadIfix(),loadUsd(),loadSelic()]);
    const capRows=stocks.filter(x=>n(x.change)!==null&&n(x.marketCap)>0);
    const capTotal=capRows.reduce((s,x)=>s+n(x.marketCap),0);
    const blueChange=capTotal>0?capRows.reduce((s,x)=>s+n(x.change)*n(x.marketCap),0)/capTotal:null;
    const advancers=stocks.filter(x=>n(x.change)>0).length;
    const blue=blueChange===null?null:{kind:'synthetic',symbol:'BLUE10',label:'Blue Chips 360',price:blueChange,change:null,unit:'%',source:'cálculo Bolsa 360'};
    const breadth=stocks.length?{kind:'synthetic',symbol:'ALTAS',label:'Blue chips em alta',price:advancers/stocks.length*100,change:null,unit:'%',source:'cálculo Bolsa 360'}:null;
    const indicators=[ibov,ifix,usd,selic,blue,breadth].filter(Boolean);
    return res.status(200).json({requestedAt:new Date().toISOString(),indicators,stocks,sources:['brapi','Banco Central do Brasil','cálculos Bolsa 360']});
  }catch(err){
    return res.status(502).json({error:'Não foi possível montar a faixa de mercado.',detail:err.message});
  }
};
