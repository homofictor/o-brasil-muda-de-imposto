module.exports = async function handler(req,res){
  const raw=String(req.query?.cnpj||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(raw.length!==14)return res.status(400).json({error:'CNPJ deve ter 14 posições.'});
  if(!/^[A-Z0-9]{12}[0-9]{2}$/.test(raw))return res.status(400).json({error:'Formato de CNPJ inválido.'});
  if(/[A-Z]/.test(raw))return res.status(422).json({error:'O provedor gratuito atual ainda não oferece consulta para CNPJ alfanumérico.',code:'ALPHANUMERIC_PROVIDER_REQUIRED'});
  try{
    const r=await fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`,{headers:{Accept:'application/json','User-Agent':'HomoFictor-Simulador-Reforma-Tributaria/3.0'}});
    const text=await r.text();let data={};try{data=JSON.parse(text)}catch(_){data={message:text}}
    if(!r.ok)return res.status(r.status).json({error:data.message||'Não foi possível consultar o CNPJ.'});
    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({provider:'BrasilAPI / Minha Receita',data});
  }catch(err){return res.status(502).json({error:'Falha temporária ao consultar a base pública.'})}
}