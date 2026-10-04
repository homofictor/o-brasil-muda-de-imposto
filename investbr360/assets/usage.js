(function(){
  'use strict';
  if(navigator.webdriver||navigator.doNotTrack==='1')return;
  const ENDPOINT='/api/usage-event';
  const blocked=/name|email|mail|phone|telefone|whatsapp|cnpj|cpf|company|empresa|message|mensagem/i;

  function safeData(input){
    const out={};
    for(const [k,v] of Object.entries(input||{})){
      if(blocked.test(k))continue;
      if(typeof v==='boolean'||typeof v==='number')out[k]=v;
      else if(typeof v==='string')out[k]=v.slice(0,80);
    }
    return out;
  }

  function onceKey(name){return 'brmi_usage_'+name}
  function already(name){try{return sessionStorage.getItem(onceKey(name))==='1'}catch(_){return false}}
  function mark(name){try{sessionStorage.setItem(onceKey(name),'1')}catch(_){}}

  function send(name,data){
    const payload={event:name,data:safeData(data)};
    try{
      const body=JSON.stringify(payload);
      if(navigator.sendBeacon){
        navigator.sendBeacon(ENDPOINT,new Blob([body],{type:'application/json'}));
      }else{
        fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true,credentials:'same-origin'}).catch(()=>{});
      }
    }catch(_){}
    try{
      if(typeof window.va==='function')window.va('event',{name,data:payload.data});
    }catch(_){}
  }

  window.brmiTrack=(name,data)=>send(name,data);
  window.brmiTrackOnce=(name,data)=>{
    if(already(name))return;
    mark(name);
    send(name,data);
  };

  const path=location.pathname;
  const isSim=path.startsWith('/simulador/');
  window.brmiTrackOnce(isSim?'simulator_open':'site_view',{
    page:path,
    source:isSim?'simulator':'site',
    device:innerWidth<700?'mobile':'desktop'
  });

  document.addEventListener('click',e=>{
    const el=e.target.closest?.('a,button');
    if(!el)return;
    const href=el.tagName==='A'?(el.getAttribute('href')||''):'';
    if(href.startsWith('/simulador')&&!isSim){
      send('simulator_cta_click',{page:path,source:'site'});
    }
    if(el.id==='lookupBtn')send('cnpj_lookup_started',{page:path});
    if(el.matches?.('[data-automation-mode]')){
      send('automation_mode_selected',{mode:el.dataset.automationMode||''});
    }
    const nav=el.closest?.('[data-guided-nav]');
    if(nav){
      const step=Number(nav.dataset.guidedNav||0);
      if(step>=2&&step<=4)window.brmiTrackOnce('step_'+step,{step});
    }
    if(el.id==='guidedNext'){
      const active=Number(document.querySelector('[data-guided-nav].active')?.dataset.guidedNav||1);
      const step=Math.min(4,active+1);
      if(step>=2)window.brmiTrackOnce('step_'+step,{step});
    }
    if(el.id==='generateDiagnosisBtn')send('diagnosis_started',{page:path});
    if(el.id==='leadSkipBtn'){
      send('lead_skipped',{page:path});
      const box=document.getElementById('leadCapture');
      if(box)box.hidden=true;
    }
  },true);

  document.addEventListener('change',e=>{
    if(e.target?.id==='importFiles'&&e.target.files?.length){
      send('documents_selected',{count:e.target.files.length,page:path});
    }
  },true);

  document.addEventListener('brmi:diagnosis-generated',()=>{
    window.brmiTrackOnce('diagnosis_generated',{page:path});
  });
  document.addEventListener('brmi:report-opened',()=>{
    window.brmiTrackOnce('report_opened',{page:path});
    window.brmiTrackOnce('lead_form_view',{page:path});
  });

  function watchLookup(){
    const card=document.getElementById('companyCard');
    const status=document.getElementById('lookupStatus');
    if(!card||!status){setTimeout(watchLookup,500);return}
    const check=()=>{
      if(!card.hidden)window.brmiTrackOnce('cnpj_lookup_success',{page:path});
      if(status.classList.contains('bad'))send('cnpj_lookup_failure',{page:path});
    };
    new MutationObserver(check).observe(card,{attributes:true,attributeFilter:['hidden']});
    new MutationObserver(check).observe(status,{attributes:true,childList:true,subtree:true,characterData:true});
  }
  if(isSim)watchLookup();

  document.addEventListener('submit',async e=>{
    if(e.target?.id==='feedbackForm'){
      send('feedback_email_prepared',{page:path});
    }
    if(e.target?.id!=='simulatorLeadForm')return;
    e.preventDefault();
    const form=e.target;
    if(!form.reportValidity())return;

    const val=id=>(document.getElementById(id)?.value||'').trim();
    const profile=val('leadProfile')||'Não informado';
    const payload={
      name:val('leadName'),
      email:val('leadEmail'),
      whatsapp:val('leadWhatsapp'),
      company:val('leadCompany'),
      profile,
      consent:Boolean(document.getElementById('leadConsent')?.checked),
      source:location.pathname
    };
    const status=document.getElementById('leadStatus');
    const submit=form.querySelector('button[type="submit"]');
    if(submit){submit.disabled=true;submit.textContent='Enviando...'}
    if(status){status.hidden=false;status.textContent='Registrando seu contato...'}

    try{
      const r=await fetch('/api/lead',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      let data={};try{data=await r.json()}catch(_){}
      if(r.ok&&data?.ok){
        send('lead_saved',{page:path,profile});
        if(status)status.textContent='Contato recebido. Obrigado. Você continuará no seu diagnóstico.';
        if(submit){submit.textContent='Contato enviado';submit.disabled=true}
        form.querySelectorAll('input,select').forEach(el=>{el.disabled=true});
        return;
      }
      if(r.status!==503)throw new Error(data?.error||'Falha ao registrar o contato.');
    }catch(err){
      console.warn('Falha no cadastro automático; usando e-mail como contingência.',err);
    }

    send('lead_fallback_email',{page:path,profile});
    const lines=[
      'CONTATO DO SIMULADOR - O BRASIL MUDA DE IMPOSTO','',
      'Nome: '+(payload.name||'Não informado'),
      'E-mail: '+payload.email,
      'WhatsApp: '+(payload.whatsapp||'Não informado'),
      'Empresa: '+(payload.company||'Não informada'),
      'Perfil: '+profile,'',
      'Autorização: Quero receber atualizações do livro, do site, do simulador e conteúdos relacionados à Reforma Tributária.',
      'Origem: '+location.href
    ];
    if(status)status.textContent='A integração automática ainda está sendo concluída. Confirme o envio no seu aplicativo de e-mail.';
    if(submit){submit.disabled=false;submit.textContent='Enviar meu contato'}
    const subject='Lead Simulador: '+profile;
    location.href='mailto:homofictor@hotmail.com?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(lines.join('\n'));
  },true);
})();