module.exports = async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'&&String(req.query?.health||'')==='1'){
    return res.status(200).json({ok:true,service:'usage-events'});
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
  let body=req.body||{};
  if(typeof body==='string'){
    try{body=JSON.parse(body)}catch(_){body={}}
  }
  const allowed=new Set([
    'site_view','simulator_open','simulator_cta_click',
    'cnpj_lookup_started','cnpj_lookup_success','cnpj_lookup_failure',
    'documents_selected','automation_mode_selected',
    'step_2','step_3','step_4',
    'diagnosis_started','diagnosis_generated','report_opened',
    'lead_form_view','lead_saved','lead_email_prepared','lead_fallback_email','lead_skipped',
    'feedback_email_prepared'
  ]);
  const event=String(body.event||'').slice(0,60);
  if(!allowed.has(event))return res.status(400).json({error:'Evento inválido.'});
  const allowedKeys=new Set(['page','source','step','count','mode','profile','device']);
  const data={};
  for(const [k,v] of Object.entries(body.data||{})){
    if(!allowedKeys.has(k))continue;
    if(typeof v==='boolean'||typeof v==='number')data[k]=v;
    else if(typeof v==='string')data[k]=v.slice(0,80);
  }
  console.log('BRMI_USAGE '+JSON.stringify({event,data,at:new Date().toISOString()}));
  return res.status(204).end();
};