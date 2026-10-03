const zlib=require('zlib');

const CVM_DFP_URL='https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_2025.zip';
const CVM_CAD_URL='https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv';

function cleanText(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toUpperCase().replace(/\bBCO\b/g,'BANCO').replace(/\bCIA\b/g,'COMPANHIA')
    .replace(/[^A-Z0-9 ]+/g,' ').replace(/\b(S A|SA|S A A|LTDA|HOLDING|PARTICIPACOES|PARTICIPACOES)\b/g,' ')
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
  let s=String(v).trim().replace(/\./g,'').replace(',','.');
  const n=Number(s); return Number.isFinite(n)?n:null;
}
function decode(buf){
  try{return new TextDecoder('windows-1252').decode(buf)}
  catch(_){return Buffer.from(buf).toString('latin1')}
}
function parseCsv(text){
  const rows=[]; let row=[],field='',q=false;
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
    const o={}; headers.forEach((h,i)=>o[h]=r[i]??''); return o;
  });
}
function unzipSelected(buf, wanted){
  const out={};
  let eocd=-1;
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
      const start=local+30+ln+le;
      const comp=buf.slice(start,start+csize);
      out[base]=method===0?comp:method===8?zlib.inflateRawSync(comp):null;
    }
    p+=46+nlen+elen+clen;
  }
  return out;
}
function listZipEntries(buf){
  const names=[]; let eocd=-1;
  for(let i=buf.length-22;i>=Math.max(0,buf.length-65557);i--){if(buf.readUInt32LE(i)===0x06054b50){eocd=i;break}}
  if(eocd<0)return names;
  const total=buf.readUInt16LE(eocd+10); let p=buf.readUInt32LE(eocd+16);
  for(let i=0;i<total;i++){
    if(buf.readUInt32LE(p)!==0x02014b50)break;
    const nlen=buf.readUInt16LE(p+28),elen=buf.readUInt16LE(p+30),clen=buf.readUInt16LE(p+32);
    names.push(buf.slice(p+46,p+46+nlen).toString('utf8'));
    p+=46+nlen+elen+clen;
  }
  return names;
}
async function fetchBuffer(url){
  const r=await fetch(url,{headers:{'User-Agent':'Bolsa360-HomoFictor/0.2'}});
  if(!r.ok)throw new Error('Falha ao baixar fonte oficial: '+r.status);
  return Buffer.from(await r.arrayBuffer());
}
async function marketUniverse(limit=140){
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
  return rows.filter(r=>String(r.SIT||'').toUpperCase().includes('ATIVO')).map(r=>({
    cvm:String(r.CD_CVM||'').trim(),cnpj:String(r.CNPJ_CIA||'').replace(/\D/g,''),
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
function accountMap(rows){
  const byCvm=new Map();
  for(const r of rows){
    if(r.ORDEM_EXERC&&String(r.ORDEM_EXERC).toUpperCase()!=='ÚLTIMO'&&String(r.ORDEM_EXERC).toUpperCase()!=='ULTIMO')continue;
    const cvm=String(r.CD_CVM||'').trim(); if(!cvm)continue;
    if(!byCvm.has(cvm))byCvm.set(cvm,[]);
    byCvm.get(cvm).push(r);
  }
  return byCvm;
}
function getCode(rows,code){
  const candidates=rows.filter(r=>String(r.CD_CONTA||'').trim()===code);
  if(!candidates.length)return null;
  candidates.sort((a,b)=>(Number(b.VERSAO)||0)-(Number(a.VERSAO)||0));
  return parseNumber(candidates[0].VL_CONTA);
}
function getByDesc(rows,patterns){
  const seen=new Set(); let total=0,found=false;
  for(const r of rows){
    const d=cleanText(r.DS_CONTA);
    if(!patterns.some(p=>d===p||d.includes(p)))continue;
    const code=String(r.CD_CONTA||'');
    if(seen.has(code))continue;
    const val=parseNumber(r.VL_CONTA); if(val===null)continue;
    seen.add(code); total+=val; found=true;
  }
  return found?total:null;
}
function chooseRows(map,cvm){return map.get(String(cvm))||[]}
function safeDiv(a,b){return a!==null&&b!==null&&b!==0?a/b:null}
function buildFundamentals(company,maps){
  const bpa=chooseRows(maps.bpa,company.cvm),bpp=chooseRows(maps.bpp,company.cvm),dre=chooseRows(maps.dre,company.cvm);
  const dfc=[...chooseRows(maps.dfcmi,company.cvm),...chooseRows(maps.dfcmd,company.cvm)];
  const assets=getCode(bpa,'1'),currentAssets=getCode(bpa,'1.01'),cash=getByDesc(bpa,['CAIXA E EQUIVALENTES DE CAIXA']);
  const equity=getCode(bpp,'2.03'),currentLiabilities=getCode(bpp,'2.01');
  const debt=getByDesc(bpp,['EMPRESTIMOS E FINANCIAMENTOS','DEBENTURES','PASSIVOS DE ARRENDAMENTO']);
  const revenue=getCode(dre,'3.01'),grossProfit=getCode(dre,'3.03'),ebit=getCode(dre,'3.05'),netIncome=getCode(dre,'3.11');
  const cfo=getCode(dfc,'6.01');
  const capex=getByDesc(dfc,['AQUISICAO DE IMOBILIZADO','AQUISICAO DE ATIVO IMOBILIZADO','AQUISICAO DE INTANGIVEL']);
  const fcf=(cfo!==null&&capex!==null)?cfo+(capex>0?-capex:capex):null;
  const netDebt=(debt!==null)?debt-(cash||0):null;
  const ev=(company.marketCap!==null&&netDebt!==null)?company.marketCap+netDebt:null;
  return {
    source:'CVM DFP 2025',
    assets,currentAssets,currentLiabilities,cash,equity,debt,netDebt,revenue,grossProfit,ebit,netIncome,cfo,capex,fcf,
    trailingPE:(company.marketCap!==null&&netIncome>0)?company.marketCap/netIncome:null,
    priceToBook:(company.marketCap!==null&&equity>0)?company.marketCap/equity:null,
    enterpriseToEbit:(ev!==null&&ebit>0)?ev/ebit:null,
    fcfYield:(fcf!==null&&company.marketCap>0)?fcf/company.marketCap:null,
    cfoYield:(cfo!==null&&company.marketCap>0)?cfo/company.marketCap:null,
    returnOnEquity:safeDiv(netIncome,equity),
    returnOnAssets:safeDiv(netIncome,assets),
    grossMargin:safeDiv(grossProfit,revenue),
    ebitMargin:safeDiv(ebit,revenue),
    profitMargin:safeDiv(netIncome,revenue),
    currentRatio:safeDiv(currentAssets,currentLiabilities),
    debtToEquity:safeDiv(debt,equity)
  };
}

module.exports=async function handler(req,res){
  try{
    if(String(req.query?.debug||'')==='zip'){
      const zipBuf=await fetchBuffer(CVM_DFP_URL);
      return res.status(200).json({entries:listZipEntries(zipBuf)});
    }
    if(String(req.query?.debug||'')==='sample'){
      const zipBuf=await fetchBuffer(CVM_DFP_URL);
      const wanted=new Set(['dfp_cia_aberta_DRE_con_2025.csv','dfp_cia_aberta_BPA_con_2025.csv']);
      const files=unzipSelected(zipBuf,wanted);
      const dre=parseCsv(decode(files['dfp_cia_aberta_DRE_con_2025.csv']||Buffer.alloc(0)));
      const bpa=parseCsv(decode(files['dfp_cia_aberta_BPA_con_2025.csv']||Buffer.alloc(0)));
      return res.status(200).json({dre:dre.slice(0,3),bpa:bpa.slice(0,3)});
    }
    const [stocks,cadBuf,zipBuf]=await Promise.all([
      marketUniverse(160),fetchBuffer(CVM_CAD_URL),fetchBuffer(CVM_DFP_URL)
    ]);
    const cad=latestActiveCad(parseCsv(decode(cadBuf)));
    let matched=matchCompanies(stocks,cad);

    const byCompany=new Map();
    for(const s of matched){
      const prior=byCompany.get(s.cvm);
      if(!prior||s.volume>prior.volume)byCompany.set(s.cvm,s);
    }
    matched=[...byCompany.values()].sort((a,b)=>b.volume-a.volume).slice(0,100);

    const wanted=new Set([
      'dfp_cia_aberta_BPA_con_2025.csv','dfp_cia_aberta_BPP_con_2025.csv',
      'dfp_cia_aberta_DRE_con_2025.csv','dfp_cia_aberta_DFC_MI_con_2025.csv',
      'dfp_cia_aberta_DFC_MD_con_2025.csv'
    ]);
    const files=unzipSelected(zipBuf,wanted);
    const maps={
      bpa:accountMap(parseCsv(decode(files['dfp_cia_aberta_BPA_con_2025.csv']||Buffer.alloc(0)))),
      bpp:accountMap(parseCsv(decode(files['dfp_cia_aberta_BPP_con_2025.csv']||Buffer.alloc(0)))),
      dre:accountMap(parseCsv(decode(files['dfp_cia_aberta_DRE_con_2025.csv']||Buffer.alloc(0)))),
      dfcmi:accountMap(parseCsv(decode(files['dfp_cia_aberta_DFC_MI_con_2025.csv']||Buffer.alloc(0)))),
      dfcmd:accountMap(parseCsv(decode(files['dfp_cia_aberta_DFC_MD_con_2025.csv']||Buffer.alloc(0))))
    };
    const companies=matched.map(c=>({...c,fundamentals:buildFundamentals(c,maps)}));
    const covered=companies.filter(c=>c.fundamentals.trailingPE!==null||c.fundamentals.priceToBook!==null||c.fundamentals.returnOnEquity!==null).length;

    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
      provider:'B3/brapi preços + CVM DFP 2025',
      methodology:'Companhia deduplicada pela ação mais líquida; fundamentos calculados pelo Bolsa 360.',
      requestedAt:new Date().toISOString(),
      total:companies.length,covered,companies
    });
  }catch(e){
    console.error('bolsa360-cvm',e);
    return res.status(502).json({error:e.message||'Falha ao construir base fundamentalista CVM.'});
  }
};