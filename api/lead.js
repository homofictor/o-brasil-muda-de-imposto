module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'){
    return res.status(200).json({
      ok:true,
      service:'lead-capture',
      configured:Boolean(process.env.GOOGLE_SHEETS_LEAD_WEBHOOK)
    });
  }
  if(req.method!=='POST'){
    res.setHeader('Allow','POST, GET');
    return res.status(405).json({error:'Método não permitido.'});
  }

  const origin=String(req.headers.origin||'');
  const official=/^https:\/\/(www\.)?obrasilmudadeimposto\.com\.br$/;
  const preview=/^https:\/\/[^/]+\.vercel\.app$/;
  if(origin&&!official.test(origin)&&!preview.test(origin)){
    return res.status(403).json({error:'Origem não permitida.'});
  }

  const webhook=process.env.GOOGLE_SHEETS_LEAD_WEBHOOK;
  if(!webhook){
    return res.status(503).json({error:'Integração com Google Sheets ainda não configurada.',code:'SHEETS_NOT_CONFIGURED'});
  }

  let body=req.body||{};
  if(typeof body==='string'){
    try{body=JSON.parse(body)}catch(_){body={}}
  }

  const clean=(v,max)=>String(v??'').trim().slice(0,max);
  const email=clean(body.email,160);
  const profile=clean(body.profile,80);
  const consent=body.consent===true;

  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    return res.status(400).json({error:'Informe um e-mail válido.'});
  }
  if(!profile)return res.status(400).json({error:'Informe o perfil profissional.'});
  if(!consent)return res.status(400).json({error:'É necessário autorizar o envio antes de registrar o contato.'});

  const payload={
    name:clean(body.name,100),
    email,
    whatsapp:clean(body.whatsapp,30),
    company:clean(body.company,120),
    profile,
    source:clean(body.source||'simulador',120),
    consent:true,
    submittedAt:new Date().toISOString()
  };

  try{
    const r=await fetch(webhook,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      redirect:'follow'
    });
    const text=await r.text();
    let data={};
    try{data=JSON.parse(text)}catch(_){data={ok:r.ok}}
    if(!r.ok||data?.ok===false){
      console.error('LEAD_SHEETS_ERROR',r.status,String(text).slice(0,500));
      return res.status(502).json({error:'Não foi possível registrar o contato na planilha.'});
    }
    console.log('BRMI_LEAD '+JSON.stringify({profile:payload.profile,source:payload.source,at:payload.submittedAt}));
    return res.status(201).json({ok:true});
  }catch(err){
    console.error('LEAD_SHEETS_EXCEPTION',err?.message||String(err));
    return res.status(502).json({error:'Falha temporária ao registrar o contato.'});
  }
};