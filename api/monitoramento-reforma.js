const SOURCES=[
 {name:"Receita Federal",url:"https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/ultimas-noticias",check:/reforma tribut.ria|CBS|IBS/i},
 {name:"Comitê Gestor do IBS",url:"https://www.cgibs.gov.br/noticias",check:/IBS|Comitê Gestor/i}
];
module.exports=async function(req,res){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({ok:false})}
 const results=await Promise.all(SOURCES.map(async s=>{
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),4800);
  try{const r=await fetch(s.url,{signal:ctrl.signal,headers:{"Accept":"text/html"}});if(!r.ok)return {source:s.name,ok:false};const html=(await r.text()).slice(0,140000);return {source:s.name,ok:s.check.test(html)}}catch(_){return {source:s.name,ok:false}}finally{clearTimeout(timer)}
 }));
 const ok=results.filter(x=>x.ok).length;
 res.setHeader("Cache-Control","public, s-maxage=10800, stale-while-revalidate=3600");
 if(!ok)return res.status(503).json({ok:false,sources_ok:0,message:"Fontes oficiais temporariamente indisponíveis"});
 return res.status(200).json({ok:true,checked_at:new Date().toISOString(),sources_ok:ok,sources:results,editorial_reviewed_at:"2026-11-12",note:"Consulta técnica automática às páginas oficiais; não equivale à validação editorial integral de alterações normativas."});
};