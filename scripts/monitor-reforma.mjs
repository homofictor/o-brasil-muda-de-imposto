import {createHash} from 'node:crypto';
const sources=[
 {name:"Receita Federal",url:"https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/ultimas-noticias",host:"www.gov.br"},
 {name:"Comitê Gestor do IBS",url:"https://www.cgibs.gov.br/noticias",host:"www.cgibs.gov.br"}
];
const token=process.env.GH_TOKEN, repo=process.env.GITHUB_REPOSITORY;
if(!token||!repo)throw new Error("GitHub environment missing");
function textOnly(raw){return raw.replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/\s+/g," ").trim()}
const results=[];let successful=0;
for(const source of sources){
 const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const r=await fetch(source.url,{signal:ctrl.signal,headers:{"User-Agent":"BRMI-Technical-Radar/1.0","Accept":"text/html"}});
  if(!r.ok)throw Error("status "+r.status);
  const html=await r.text();if(html.length<2000)throw Error("short page");
  successful++;
  const links=[...html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  for(const [,href,raw] of links){
   const title=textOnly(raw);if(title.length<22||title.length>200)continue;
   if(!/reforma tribut.ria|\bIBS\b|\bCBS\b|imposto seletivo|split payment|\bDeRE\b|nota t.cnica/i.test(title))continue;
   let url;try{url=new URL(href,source.url);if(url.hostname.replace(/^www\./,'')!==source.host.replace(/^www\./,'')||url.protocol!=="https:")continue}catch{continue}
   if(!/noticias|\/noticia|\/inicial|\/comunicado/.test(url.pathname))continue;
   const key=createHash('sha256').update(url.href).digest('hex').slice(0,12);
   if(!results.some(x=>x.key===key))results.push({key,title,source:source.name,url:url.href});
  }
 }catch(e){console.warn("SOURCE_CHECK_FAILED",source.name,String(e.message||e))}finally{clearTimeout(timer)}
}
if(!successful)throw Error("Nenhuma fonte oficial foi consultada com sucesso");
console.log("Official sources reached:",successful,"candidate publications:",results.length);
const headers={Authorization:"Bearer "+token,Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"};
const issues=await fetch("https://api.github.com/repos/"+repo+"/issues?state=all&per_page=100", {headers});
if(!issues.ok)throw Error("issues list "+issues.status);
const old=(await issues.json()).map(x=>String(x.body||"")).join("\n");
const novelties=results.filter(x=>!old.includes("[radar:"+x.key+"]")).slice(0,12);
if(novelties.length){
 const today=new Date().toISOString().slice(0,10);
 const body="## Triagem editorial necessária\n\nVerificação automática concluída em "+today+" (UTC). Estes links **não** foram validados como novas normas; é necessário ler fontes oficiais, conferir atos, publicação, vigência e eventuais alterações antes de editar o site.\n\n"+novelties.map(x=>"- [radar:"+x.key+"] **"+x.source+"**: "+x.title+"\n  "+x.url).join("\n")+"\n\nNão realizar deploy automático. Atualizar o site somente após revisão normativa e em lote único para reduzir custos.";
 const response=await fetch("https://api.github.com/repos/"+repo+"/issues",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({title:"[Radar RT] Triagem de fontes oficiais "+today,body})});
 if(!response.ok)throw Error("issue create "+response.status);
 console.log("Created editorial triage issue");
}else console.log("No unseen official links or no qualifying items");
if(process.env.GITHUB_STEP_SUMMARY){
 const fs=await import('node:fs/promises');
 await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,"### Monitoramento da Reforma Tributária\n\nFontes acessadas: "+successful+"/"+sources.length+". Links candidatos: "+results.length+". Novos para triagem: "+novelties.length+".\n");
}