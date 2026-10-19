const curated = require("../data/noticias-reforma.json");

function decodeXml(value=""){
  return String(value||"")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,"$1")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"')
    .replace(/&#39;|&apos;/g,"'")
    .replace(/&lt;/g,"<")
    .replace(/&gt;/g,">")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)||32));
}
function stripHtml(value=""){
  return decodeXml(value).replace(/<br\s*\/?\s*>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
}
function tag(block,name){
  const m=String(block||"").match(new RegExp("<"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/"+name+">","i"));
  return m?decodeXml(m[1]).trim():"";
}
function normalize(value=""){
  return stripHtml(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}
function cleanTitle(title,source){
  let t=stripHtml(title);
  const s=stripHtml(source);
  if(s && t.endsWith(" - "+s)) t=t.slice(0,-(" - "+s).length).trim();
  return t;
}
function isRelevant(item){
  const n=normalize((item.title||"")+" "+(item.summary||""));
  return /(reforma tributaria|\bibs\b|\bcbs\b|imposto seletivo|split payment|simples nacional|iva dual|tributacao do consumo|documentos fiscais|nota fiscal|credito tributario)/.test(n);
}
function isOfficialSource(source=""){
  return /(Receita Federal|Comitê Gestor|CGIBS|Senado Federal|Câmara dos Deputados|Tribunal de Contas|TCU|Diário Oficial|Planalto|Ministério da Fazenda|Agência Brasil|Sefaz|Secretaria da Fazenda)/i.test(source);
}
function regionFor(item){
  const n=normalize((item.title||"")+" "+(item.summary||"")+" "+(item.source||""));
  if(/espirito santo|capixab|sefaz es|sebrae es|vitoria/.test(n)) return "Espírito Santo";
  return "Brasil";
}
function key(item){
  return normalize(item.title).replace(/\b(reforma tributaria|tributaria)\b/g,"").trim().slice(0,160);
}
async function googleNews(query){
  const qs=new URLSearchParams({q:query,hl:"pt-BR",gl:"BR",ceid:"BR:pt-419"});
  const ctrl=new AbortController();
  const timer=setTimeout(()=>ctrl.abort(),4500);
  try{
    const r=await fetch("https://news.google.com/rss/search?"+qs.toString(),{
      headers:{Accept:"application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8","User-Agent":"O-Brasil-Muda-de-Imposto/1.0"},
      signal:ctrl.signal
    });
    if(!r.ok) return [];
    const xml=await r.text();
    const blocks=xml.match(/<item>[\s\S]*?<\/item>/gi)||[];
    return blocks.slice(0,35).map(block=>{
      const source=stripHtml(tag(block,"source"))||"Fonte externa";
      const rawTitle=tag(block,"title");
      const title=cleanTitle(rawTitle,source);
      const rawDescription=tag(block,"description");
      const publishedAt=tag(block,"pubDate")||null;
      const url=tag(block,"link");
      return {
        id:"rss-"+normalize(title).replace(/\s+/g,"-").slice(0,110),
        date: publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? new Date(publishedAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10),
        publishedAt,
        source,
        type:isOfficialSource(source)?"Fonte oficial":"Imprensa",
        region:"Brasil",
        title,
        summary:stripHtml(rawDescription).replace(title,"").trim().slice(0,360),
        url,
        provider:"Google News RSS"
      };
    }).filter(x=>x.title&&x.url&&isRelevant(x)).map(x=>({...x,region:regionFor(x)}));
  }catch(_){
    return [];
  }finally{
    clearTimeout(timer);
  }
}
function curatedItems(){
  return (curated.items||[]).map(x=>({
    ...x,
    publishedAt:x.date?x.date+"T12:00:00-03:00":null,
    provider:"Curadoria editorial"
  }));
}
module.exports=async function handler(req,res){
  if(req.method!=="GET"){
    res.setHeader("Allow","GET");
    return res.status(405).json({error:"Método não permitido."});
  }
  const requested=Math.max(3,Math.min(24,Number(req.query?.limit)||18));
  const queries=[
    '"reforma tributária" (IBS OR CBS OR "Imposto Seletivo" OR "split payment")',
    '"reforma tributária" "Simples Nacional"',
    '"reforma tributária" empresas municípios'
  ];
  const live=(await Promise.all(queries.map(q=>googleNews(q)))).flat();
  const all=[...live,...curatedItems()];
  const seen=new Set();
  const deduped=[];
  for(const item of all){
    const k=key(item);
    if(!k||seen.has(k)) continue;
    seen.add(k);
    deduped.push(item);
  }
  deduped.sort((a,b)=>{
    const ao=isOfficialSource(a.source)?1:0,bo=isOfficialSource(b.source)?1:0;
    const at=Date.parse(a.publishedAt||a.date||0)||0,bt=Date.parse(b.publishedAt||b.date||0)||0;
    const ageA=Date.now()-at,ageB=Date.now()-bt;
    const recentA=ageA<=48*3600000?2:ageA<=7*86400000?1:0;
    const recentB=ageB<=48*3600000?2:ageB<=7*86400000?1:0;
    return (bo+recentB)-(ao+recentA)||bt-at;
  });
  const items=deduped.slice(0,requested);
  res.setHeader("Cache-Control","public, s-maxage=1800, stale-while-revalidate=21600");
  return res.status(200).json({
    ok:true,
    provider:"Google News RSS + curadoria editorial",
    updated_at:new Date().toISOString(),
    automatic:true,
    criteria:"Notícias filtradas por relevância para a Reforma Tributária do Consumo. Mudanças legais só devem ser tratadas como regra vigente quando confirmadas por fonte oficial.",
    items
  });
};