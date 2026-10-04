const zlib=require('zlib');

const YEARS=[2021,2022,2023,2024,2025];

function cleanText(s){
  return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
}
function cvmCode(v){const s=String(v||'').trim();return s.replace(/^0+/,'')||'0'}
function parseNumber(v){
  if(v===null||v===undefined||v==='')return null;
  const n=Number(String(v).trim().replace(',','.'));
  return Number.isFinite(n)?n:null;
}
function accountValue(row){
  const n=parseNumber(row?.VL_CONTA);
  if(n===null)return null;
  return n*(cleanText(row?.ESCALA_MOEDA)==='MIL'?1000:1);
}
function decode(buf){
  try{return new TextDecoder('windows-1252').decode(buf)}
  catch(_){return Buffer.from(buf).toString('latin1')}
}
function unzipOne(buf,wanted){
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
    const name=buf.slice(p+46,p+46+nlen).toString('utf8').split('/').pop();
    if(name===wanted){
      const ln=buf.readUInt16LE(local+26),le=buf.readUInt16LE(local+28);
      const start=local+30+ln+le,comp=buf.slice(start,start+csize);
      return method===0?comp:method===8?zlib.inflateRawSync(comp):Buffer.alloc(0);
    }
    p+=46+nlen+elen+clen;
  }
  return Buffer.alloc(0);
}
function parseCsvForCvms(text,allowed){
  const out=[];let headers=null,cvmIndex=-1,row=[],field='',q=false;
  const push=()=>{
    if(!headers){
      headers=row.map(x=>x.replace(/^\uFEFF/,''));
      cvmIndex=headers.indexOf('CD_CVM');
    }else if(row.length>1){
      const cvm=cvmCode(row[cvmIndex]||'');
      if(allowed.has(cvm)){
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
async function fetchBuffer(url){
  const r=await fetch(url,{headers:{'User-Agent':'Bolsa360-HomoFictor/0.4'}});
  if(!r.ok)throw new Error('Falha ao baixar DFP '+r.status);
  return Buffer.from(await r.arrayBuffer());
}
function annualRows(rows,year){
  const byCvm=new Map();
  for(const r of rows){
    if(cleanText(r.ORDEM_EXERC)!=='ULTIMO')continue;
    const cvm=cvmCode(r.CD_CVM),ref=String(r.DT_REFER||'');
    if(!cvm||!ref.startsWith(String(year)))continue;
    const key=cvm+'|'+String(r.CD_CONTA||'');
    const prior=byCvm.get(key);
    const version=Number(r.VERSAO)||0;
    if(!prior||version>(Number(prior.VERSAO)||0))byCvm.set(key,r);
  }
  const out=new Map();
  for(const r of byCvm.values()){
    const cvm=cvmCode(r.CD_CVM);
    if(!out.has(cvm))out.set(cvm,[]);
    out.get(cvm).push(r);
  }
  return out;
}
function getCode(rows,code){
  const r=(rows||[]).find(x=>String(x.CD_CONTA||'').trim()===code);
  return r?accountValue(r):null;
}
function getNetIncome(rows){
  const direct=getCode(rows,'3.11');
  if(direct!==null)return direct;
  const match=(rows||[]).find(r=>{
    const d=cleanText(r.DS_CONTA);
    return d.includes('LUCRO')&&d.includes('PREJUIZO')&&d.includes('CONSOLIDADO');
  });
  return match?accountValue(match):null;
}
function point(rows,year){
  const revenue=getCode(rows,'3.01');
  const grossProfit=getCode(rows,'3.03');
  const ebit=getCode(rows,'3.05');
  const netIncome=getNetIncome(rows);
  return {
    year,revenue,grossProfit,ebit,netIncome,
    grossMargin:revenue&&grossProfit!==null?grossProfit/revenue:null,
    ebitMargin:revenue&&ebit!==null?ebit/revenue:null,
    profitMargin:revenue&&netIncome!==null?netIncome/revenue:null
  };
}

module.exports=async function handler(req,res){
  try{
    const raw=String(req.query?.cvms||'');
    const requested=[...new Set(raw.split(',').map(cvmCode).filter(x=>x&&x!=='0'))].slice(0,40);
    if(!requested.length)return res.status(400).json({error:'Informe códigos CVM.'});
    const allowed=new Set(requested);
    const series=Object.fromEntries(requested.map(c=>[c,[]]));

    for(const year of YEARS){
      const url=`https://dados.cvm.gov.br/dados/CIA_ABERTA/DOC/DFP/DADOS/dfp_cia_aberta_${year}.zip`;
      const zip=await fetchBuffer(url);
      const name=`dfp_cia_aberta_DRE_con_${year}.csv`;
      const file=unzipOne(zip,name);
      const rows=parseCsvForCvms(decode(file),allowed);
      const byCvm=annualRows(rows,year);
      for(const cvm of requested){
        const rowsFor=byCvm.get(cvm)||[];
        if(rowsFor.length)series[cvm].push(point(rowsFor,year));
      }
    }

    const covered=Object.values(series).filter(s=>s.length>=3).length;
    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({
      provider:'CVM DFP consolidadas 2021-2025',
      years:YEARS,
      requested:requested.length,
      covered,
      series
    });
  }catch(e){
    console.error('bolsa360-history',e);
    return res.status(502).json({error:e.message||'Falha ao construir histórico da CVM.'});
  }
};