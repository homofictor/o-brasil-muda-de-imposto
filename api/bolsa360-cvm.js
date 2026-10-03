const zlib=require('zlib');

const CVM_DFP_URL='https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_2025.zip';
const CVM_ITR_URL='https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/ITR/DADOS/itr_cia_aberta_2026.zip';
const CVM_CAD_URL='https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';

function cleanText(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase().replace(/\bBCO\b/g,'BANCO').replace(/\bCIA\b/g,'COMPANHIA')
    .replace(/[^A-Z0-9 ]+/g,' ').replace(/\b(S A|SA|S A A|LTDA|HOLDING|PARTICIPACOES)\b/g,' ')
    .replace(/\s+/g,' ').trim();
}
function tokens(s){return new Set(cleanText(s).split(' ').filter(x=>x.length>1))}
function similarity(a,b){
  const A=tokens(a),B=tokens(b); if(!A.size||!B.size)return 0;
  let inter=0; for(const x of A)if(B.has(x))inter++;
  const union=new Set([...A,...B]).size;
  let j=inter/union;
  const ca=cleanText(a),cb=cleanText(b);
  if(ca===cb)j=1;
  else if(ca.includes(cb)||cb.includes(ca))j=Math.max(j,.88);
  return j;
}
function parseNumber(v){
  if(v===null||v===undefined||v==='')return null;
  const n=Number(String(v).trim().replace(',','.'));
  return Number.isFinite(n)?n:null;
}
function cvmCode(v){const s=String(v||'').trim();return s.replace(/^0+/,'')||'0'}
function accountValue(row){
  const n=parseNumber(row?.VL_CONTA);
  if(n===null)return null;
  return n*(cleanText(row?.ESCALA_MOEDA)==='MIL'?1000:1);
}
function decode(buf){
  try{return new TextDecoder('windows-1252').decode(buf)}
  catch(_){return Buffer.from(buf).toString('latin1')}
}
function parseCsv(text){
  const rows=[];let row=[],field='',q=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(q){
      if(c==='"'&&text[i+1]==='"'){field+='"';i++}
      else if(c==='"')q=false;
      else field+=c;
    }else{
      if(c==='"')q=true;
      else if(c===';'){row.push(field);field=''}
      else if(c==='\n'){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field=''}
      else field+=c;
    }
  }
  if(field||row.length){row.push(field);rows.push(row)}
  if(!rows.length)return [];
  const headers=rows[0].map(x=>x.replace(/^\uFEFF/,''));
  return rows.slice(1).filter(r=>r.length>1).map(r=>{
    const o={};headers.forEach((h,i)=>o[h]=r[i]??'');return o;
  });
}
function parseCsvForCvms(text,allowedCvms){
  const out=[];let headers=null,cvmIndex=-1,row=[],field='',q=false;
  const push=()=>{
    if(!headers){
      headers=row.map(x=>x.replace(/^\uFEFF/,''));
      cvmIndex=headers.indexOf('CD_CVM');
    }else if(row.length>1){
      const cvm=cvmCode(row[cvmIndex]||'');
      if(allowedCvms.has(cvm)){
        const o={};headers.forEach((h,i)=>o[h]=row[i]??'');out.push(o);
      }
    }
    row=[];field='';
  };
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){
      if(ch==='"'&&text[i+1]==='"'){field+='"';i++}
      else if(ch==='"')q=false;
      else field+=ch;
    }else{
      if(ch==='"')q=true;
      else if(ch===';'){row.push(field);field=''}
      else if(ch==='\n'){row.push(field.replace(/\r$/,''));push()}
      else field+=ch;
    }
  }
  if(field||row.length){row.push(field);push()}
  return out;
}
function unzipSelected(buf,wanted){
  const out={};let eocd=-1;
  for(let i=buf.length-22;i>=Math.max(0,buf.length-65557);i--){
    if(buf.readUInt32LE(i)===0x06054b50){eocd=i;break}
  }
  if(eocd<0)throw new Error('ZIP CVM inválido.');
  const total=buf.readUInt16LE(eocd+10),cdOffset=buf.readUInt32LE(eocd+16);
  let p=cdOffset;
  for(let i=0;i<total;i++){
    if(buf.readUInt32LE(p)!==0x02014b50)break;
    const method=buf.readUInt16LE(p+10),csize=buf.readUInt32LE(p+20);
    const nlen=buf.readUInt16LE(p+28),elen=buf.readUInt16LE(p+30),clen=buf.readUInt16LE(p+32);
    const local=buf.readUInt32LE(p+42);
    const name=buf.slice(p+46,p+46+nlen).toString('utf8');
    const base=name.split('/').pop();
    if(wanted.has(base)){
      const ln=buf.readUInt16LE(local+26),le=buf.readUInt16LE(local+28);
      const start=local+30+ln+le,comp=buf.slice(start,start+csize);
      out[base]=method===0?comp:method===8?zlib.inflateRawSync(comp):null;
    }
    p+=46+nlen+elen+clen;
  }
  return out;
}
async function fetchBuffer(url){
  const r=await fetch(url,{headers:{'User-Agent':'Bolsa360-HomoFictor/0.3'}});
  if(!r.ok)throw new Error('Falha ao baixar fonte oficial: '+r.status);
  return Buffer.from(await r.arrayBuffer());
}
async function marketUniverse(limit=160){
  const q=new URLSearchParams({type:'stock',limit:String(limit),sortBy:'volume',sortOrder:'desc'});
  const r=await fetch('https://brapi.dev/api/quote/list?'+q,{headers:{Accept:'application/json'}});
  if(!r.ok)throw new Error('Falha ao consultar universo de mercado.');
  const j=await r.json();
  return (j.stocks||[]).map(x=>({
    ticker:x.stock,name:x.name||x.stock,close:Number(x.close)||null,change:Number(x.change)||null,
    volume:Number(x.volume)||0,marketCap:Number(x.market_cap)||null,sector:x.sector||null,
    subsector:x.subsector||null,type:x.type||null,subType:x.subType||null,logo:x.logo||null
  })).filter(x=>x.ticker&&x.close!==null);
}
function latestActiveCad(rows){
  return rows.filter(r=>cleanText(r.SIT).includes('ATIVO')).map(r=>({
    cvm:cvmCode(r.CD_CVM),cnpj:String(r.CNPJ_CIA||'').replace(/\D/g,''),
    name:r.DENOM_SOCIAL||'',trade:r.DENOM_COMERC||''
  }));
}
const aliases={
  PETR4:'PETROLEO BRASILEIRO S.A. - PETROBRAS',PETR3:'PETROLEO BRASILEIRO S.A. - PETROBRAS',
  BBAS3:'BANCO DO BRASIL S.A.',BBDC4:'BANCO BRADESCO S.A.',BBDC3:'BANCO BRADESCO S.A.',
  ITUB4:'ITAU UNIBANCO HOLDING S.A.',ITUB3:'ITAU UNIBANCO HOLDING S.A.',
  VALE3:'VALE S.A.',B3SA3:'B3 S.A. - BRASIL, BOLSA, BALCAO',ABEV3:'AMBEV S.A.',
  WEGE3:'WEG S.A.',RENT3:'LOCALIZA RENT A CAR S.A.',SUZB3:'SUZANO S.A.',
  ELET3:'CENTRAIS ELETRICAS BRASILEIRAS S.A. - ELETROBRAS',ELET6:'CENTRAIS ELETRICAS BRASILEIRAS S.A. - ELETROBRAS'
};
function matchCompanies(stocks,cad){
  const result=[];
  for(const s of stocks){
    const query=aliases[s.ticker]||s.name;
    let best=null,score=0;
    for(const c of cad){
      const sc=Math.max(similarity(query,c.name),similarity(query,c.trade));
      if(sc>score){score=sc;best=c}
    }
    if(best&&score>=.58)result.push({...s,cvm:best.cvm,cnpj:best.cnpj,cvmName:best.name,matchScore:score});
  }
  return result;
}
function latestPeriodMap(rows){
  const meta=new Map();
  for(const r of rows){
    const cvm=cvmCode(r.CD_CVM),ref=String(r.DT_REFER||''),ver=Number(r.VERSAO)||0;
    if(!cvm||!ref)continue;
    const m=meta.get(cvm);
    if(!m||ref>m.refDate||(ref===m.refDate&&ver>m.version))meta.set(cvm,{refDate:ref,version:ver});
  }
  const out=new Map();
  for(const r of rows){
    const cvm=cvmCode(r.CD_CVM),m=meta.get(cvm);
    if(!m||String(r.DT_REFER||'')!==m.refDate||(Number(r.VERSAO)||0)!==m.version)continue;
    if(!out.has(cvm))out.set(cvm,{refDate:m.refDate,version:m.version,current:[],previous:[]});
    const ord=cleanText(r.ORDEM_EXERC);
    if(ord==='ULTIMO')out.get(cvm).current.push(r);
    else if(ord==='PENULTIMO')out.get(cvm).previous.push(r);
  }
  return out;
}
function cumulativeRows(rows){
  const byCode=new Map();
  for(const r of rows||[]){
    const code=String(r.CD_CONTA||'').trim();
    if(!code)continue;
    const prior=byCode.get(code);
    const start=String(r.DT_INI_EXERC||'9999-99-99');
    if(!prior||start<String(prior.DT_INI_EXERC||'9999-99-99'))byCode.set(code,r);
  }
  return [...byCode.values()];
}
function getCode(rows,code){
  const candidates=(rows||[]).filter(r=>String(r.CD_CONTA||'').trim()===code);
  if(!candidates.length)return null;
  return accountValue(candidates[0]);
}
function getByDesc(rows,patterns,{contains=false,avoidNested=false}={}){
  const matched=[],seen=new Set();
  for(const r of rows||[]){
    const d=cleanText(r.DS_CONTA),hit=patterns.some(p=>contains?d.includes(p):d===p);
    if(!hit)continue;
    const code=String(r.CD_CONTA||'');
    if(seen.has(code))continue;
    const val=accountValue(r);if(val===null)continue;
    seen.add(code);matched.push({code,val});
  }
  const selected=avoidNested
    ?matched.filter(x=>!matched.some(y=>y.code!==x.code&&x.code.startsWith(y.code+'.')))
    :matched;
  return selected.length?selected.reduce((s,x)=>s+x.val,0):null;
}
function safeDiv(a,b){return a!==null&&b!==null&&b!==0?a/b:null}
function safePositiveDiv(a,b){return a!==null&&b!==null&&b>0?a/b:null}
function selectDfc(mi,md){return (mi&&mi.length)?mi:((md&&md.length)?md:[])}
function addTtm(annual,current,previous){
  return annual!==null&&current!==null&&previous!==null?annual+current-previous:annual;
}
function extractSnapshot({bpa=[],bpp=[],dre=[],dfc=[]}){
  const flowDre=cumulativeRows(dre),flowDfc=cumulativeRows(dfc);
  const assets=getByDesc(bpa,['ATIVO TOTAL'])??getCode(bpa,'1');
  const currentAssets=getCode(bpa,'1.01');
  const cash=getByDesc(bpa,['CAIXA E EQUIVALENTES DE CAIXA']);
  const equity=getByDesc(bpp,['PATRIMONIO LIQUIDO CONSOLIDADO'])??getByDesc(bpp,['PATRIMONIO LIQUIDO'])??getCode(bpp,'2.03');
  const currentLiabilities=getCode(bpp,'2.01');
  const debt=getByDesc(bpp,['EMPRESTIMOS E FINANCIAMENTOS','DEBENTURES','PASSIVOS DE ARRENDAMENTO','ARRENDAMENTOS'],{avoidNested:true});
  const revenue=getCode(flowDre,'3.01');
  const grossProfit=getCode(flowDre,'3.03');
  const ebit=getCode(flowDre,'3.05');
  const netIncome=getCode(flowDre,'3.11')??getByDesc(flowDre,[
    'LUCRO OU PREJUIZO LIQUIDO CONSOLIDADO DO PERIODO',
    'LUCRO PREJUIZO CONSOLIDADO DO PERIODO',
    'LUCRO LIQUIDO CONSOLIDADO DO PERIODO',
    'LUCRO OU PREJUIZO LIQUIDO DO PERIODO'
  ]);
  const cfo=getCode(flowDfc,'6.01');
  const capex=getByDesc(flowDfc,['AQUISICAO DE IMOBILIZADO','AQUISICAO DE ATIVO IMOBILIZADO','AQUISICAO DE INTANGIVEL'],{contains:true});
  return {assets,currentAssets,currentLiabilities,cash,equity,debt,revenue,grossProfit,ebit,netIncome,cfo,capex};
}
function getPeriod(map,cvm,which='current'){
  const e=map.get(String(cvm));
  return e?e[which]||[]:[];
}
function buildFundamentals(company,dfpMaps,itrMaps){
  const annual=extractSnapshot({
    bpa:getPeriod(dfpMaps.bpa,company.cvm),
    bpp:getPeriod(dfpMaps.bpp,company.cvm),
    dre:getPeriod(dfpMaps.dre,company.cvm),
    dfc:selectDfc(getPeriod(dfpMaps.dfcmi,company.cvm),getPeriod(dfpMaps.dfcmd,company.cvm))
  });

  const itrEntry=itrMaps.dre.get(String(company.cvm))||itrMaps.bpa.get(String(company.cvm))||null;
  const itrCurrent=extractSnapshot({
    bpa:getPeriod(itrMaps.bpa,company.cvm,'current'),
    bpp:getPeriod(itrMaps.bpp,company.cvm,'current'),
    dre:getPeriod(itrMaps.dre,company.cvm,'current'),
    dfc:selectDfc(getPeriod(itrMaps.dfcmi,company.cvm,'current'),getPeriod(itrMaps.dfcmd,company.cvm,'current'))
  });
  const itrPrevious=extractSnapshot({
    dre:getPeriod(itrMaps.dre,company.cvm,'previous'),
    dfc:selectDfc(getPeriod(itrMaps.dfcmi,company.cvm,'previous'),getPeriod(itrMaps.dfcmd,company.cvm,'previous'))
  });

  const latestBalance=itrEntry?itrCurrent:annual;
  const revenue=addTtm(annual.revenue,itrCurrent.revenue,itrPrevious.revenue);
  const grossProfit=addTtm(annual.grossProfit,itrCurrent.grossProfit,itrPrevious.grossProfit);
  const ebit=addTtm(annual.ebit,itrCurrent.ebit,itrPrevious.ebit);
  const netIncome=addTtm(annual.netIncome,itrCurrent.netIncome,itrPrevious.netIncome);
  const cfo=addTtm(annual.cfo,itrCurrent.cfo,itrPrevious.cfo);
  const capex=addTtm(annual.capex,itrCurrent.capex,itrPrevious.capex);
  const fcf=cfo!==null&&capex!==null?cfo+(capex>0?-capex:capex):null;

  const {assets,currentAssets,currentLiabilities,cash,equity,debt}=latestBalance;
  const netDebt=debt!==null?debt-(cash||0):null;
  const ev=company.marketCap!==null&&netDebt!==null?company.marketCap+netDebt:null;
  const ttmAvailable=!!itrEntry&&[revenue,ebit,netIncome].some(v=>v!==null);

  return {
    source:ttmAvailable?'CVM DFP 2025 + ITR 2026 (TTM)':'CVM DFP 2025',
    referenceDate:itrEntry?.refDate||'2025-12-31',
    ttmAvailable,
    assets,currentAssets,currentLiabilities,cash,equity,debt,netDebt,
    revenue,grossProfit,ebit,netIncome,cfo,capex,fcf,
    trailingPE:(company.marketCap!==null&&netIncome>0)?company.marketCap/netIncome:null,
    priceToBook:(company.marketCap!==null&&equity>0)?company.marketCap/equity:null,
    enterpriseToEbit:(ev!==null&&ebit>0)?ev/ebit:null,
    fcfYield:(fcf!==null&&company.marketCap>0)?fcf/company.marketCap:null,
    cfoYield:(cfo!==null&&company.marketCap>0)?cfo/company.marketCap:null,
    returnOnEquity:safePositiveDiv(netIncome,equity),
    returnOnAssets:safePositiveDiv(netIncome,assets),
    grossMargin:safePositiveDiv(grossProfit,revenue),
    ebitMargin:safePositiveDiv(ebit,revenue),
    profitMargin:safePositiveDiv(netIncome,revenue),
    currentRatio:safePositiveDiv(currentAssets,currentLiabilities),
    debtToEquity:safePositiveDiv(debt,equity),
    netDebtToEbit:safePositiveDiv(netDebt,ebit),
    cashToDebt:safePositiveDiv(cash,debt)
  };
}
async function loadMapsFromUrl(url,prefix,year,allowedCvms){
  const zip=await fetchBuffer(url);
  const specs=[['bpa','BPA'],['bpp','BPP'],['dre','DRE'],['dfcmi','DFC_MI'],['dfcmd','DFC_MD']];
  const maps={};
  for(const [key,label] of specs){
    const filename=`${prefix}_cia_aberta_${label}_con_${year}.csv`;
    const file=unzipSelected(zip,new Set([filename]))[filename]||Buffer.alloc(0);
    const text=decode(file);
    const rows=parseCsvForCvms(text,allowedCvms);
    maps[key]=latestPeriodMap(rows);
  }
  return maps;
}


function normalizeRecommendation(key,mean){
  const k=String(key||'').toLowerCase().replace(/[\s_-]+/g,'');
  if(k.includes('buy')||k.includes('outperform')||k.includes('overweight'))return 'Compra';
  if(k.includes('hold')||k.includes('neutral')||k.includes('marketperform')||k.includes('equalweight'))return 'Neutro';
  if(k.includes('sell')||k.includes('underperform')||k.includes('underweight'))return 'Venda';
  const m=parseNumber(mean);
  if(m!==null){
    if(m<=2.5)return 'Compra';
    if(m<=3.5)return 'Neutro';
    return 'Venda';
  }
  return null;
}
async function analystConsensusMap(tickers){
  const map=new Map(),key=process.env.BRAPI_API_KEY;
  const chunks=[];
  for(let i=0;i<tickers.length;i+=40)chunks.push(tickers.slice(i,i+40));
  for(const chunk of chunks){
    try{
      const headers={Accept:'application/json','User-Agent':'Bolsa360-HomoFictor/0.8'};
      if(key)headers.Authorization='Bearer '+key;
      const url='https://brapi.dev/api/v2/stocks/financial-data?symbols='+encodeURIComponent(chunk.join(','))+'&mode=current';
      const r=await fetch(url,{headers});
      if(!r.ok)continue;
      const j=await r.json();
      for(const item of (j.results||[])){
        const ticker=item.symbol||item.requestedSymbol;
        const d=item.data||item.financialData||{};
        if(!ticker)continue;
        const mean=parseNumber(d.targetMeanPrice),median=parseNumber(d.targetMedianPrice);
        const low=parseNumber(d.targetLowPrice),high=parseNumber(d.targetHighPrice);
        const opinions=parseNumber(d.numberOfAnalystOpinions),recMean=parseNumber(d.recommendationMean);
        const recKey=d.recommendationKey||null;
        if(mean===null&&median===null&&low===null&&high===null&&opinions===null&&!recKey&&recMean===null)continue;
        map.set(ticker,{
          source:'brapi financialData',
          targetMeanPrice:mean!==null&&mean>0?mean:null,
          targetMedianPrice:median!==null&&median>0?median:null,
          targetLowPrice:low!==null&&low>0?low:null,
          targetHighPrice:high!==null&&high>0?high:null,
          numberOfAnalystOpinions:opinions!==null&&opinions>=0?opinions:null,
          recommendationMean:recMean,
          recommendationKey:recKey,
          recommendation:normalizeRecommendation(recKey,recMean)
        });
      }
    }catch(_){}
  }
  return map;
}

module.exports=async function handler(req,res){
  try{
    const [stocks,cadBuf]=await Promise.all([
      marketUniverse(160),fetchBuffer(CVM_CAD_URL)
    ]);

    const cad=latestActiveCad(parseCsv(decode(cadBuf)));
    let matched=matchCompanies(stocks,cad);
    const byCompany=new Map();
    for(const s of matched){
      const prior=byCompany.get(s.cvm);
      if(!prior||s.volume>prior.volume)byCompany.set(s.cvm,s);
    }
    matched=[...byCompany.values()].sort((a,b)=>b.volume-a.volume).slice(0,100);

    const allowedCvms=new Set(matched.map(x=>String(x.cvm)));
    const dfpMaps=await loadMapsFromUrl(CVM_DFP_URL,'dfp',2025,allowedCvms);
    const itrMaps=await loadMapsFromUrl(CVM_ITR_URL,'itr',2026,allowedCvms);

    const consensus=await analystConsensusMap(matched.map(c=>c.ticker));
    const companies=matched.map(c=>{
      const analystConsensus=consensus.get(c.ticker)||null;
      const target=analystConsensus?.targetMeanPrice??analystConsensus?.targetMedianPrice??null;
      return {
        ...c,
        analystConsensus:analystConsensus?{
          ...analystConsensus,
          targetDistance:target!==null&&c.close>0?target/c.close-1:null,
          collectedAt:new Date().toISOString()
        }:null,
        fundamentals:buildFundamentals(c,dfpMaps,itrMaps)
      };
    });
    const covered=companies.filter(c=>c.fundamentals.trailingPE!==null||c.fundamentals.priceToBook!==null||c.fundamentals.returnOnEquity!==null).length;
    const ttmCovered=companies.filter(c=>c.fundamentals.ttmAvailable).length;
    const latestItrReference=companies.map(c=>c.fundamentals.referenceDate).filter(d=>d&&d>'2025-12-31').sort().pop()||null;

    res.setHeader('Cache-Control','s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json({
      provider:'Mercado operacional + CVM DFP 2025 + ITR 2026 + consenso de analistas brapi',
      methodology:'BP usa a posição mais recente do ITR; DRE e DFC usam TTM = DFP 2025 + acumulado 2026 - período comparável de 2025.',
      requestedAt:new Date().toISOString(),
      latestItrReference,total:companies.length,covered,ttmCovered,companies
    });
  }catch(e){
    console.error('bolsa360-cvm',e);
    return res.status(502).json({error:e.message||'Falha ao construir base fundamentalista CVM.'});
  }
};