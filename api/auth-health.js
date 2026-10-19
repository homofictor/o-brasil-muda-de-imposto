module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const url=process.env.SUPABASE_URL||'';
  const key=process.env.SUPABASE_ANON_KEY||'';
  if(!url||!key)return res.status(503).json({ok:false,configured:false});
  try{
    const r=await fetch(url.replace(/\/$/,'')+'/auth/v1/settings',{headers:{apikey:key,Authorization:'Bearer '+key}});
    const data=await r.json().catch(()=>({}));
    return res.status(r.ok?200:502).json({
      ok:r.ok,
      configured:true,
      external:data.external||{},
      disableSignup:Boolean(data.disable_signup),
      mailerAutoconfirm:Boolean(data.mailer_autoconfirm)
    });
  }catch(err){
    return res.status(502).json({ok:false,configured:true,error:'Falha ao consultar configuração de autenticação.'});
  }
};