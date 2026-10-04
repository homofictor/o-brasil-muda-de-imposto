function initLeadCapture(){
 const form=document.getElementById('simulatorLeadForm');if(!form||form.dataset.ready==='1')return;form.dataset.ready='1';
 const status=document.getElementById('leadStatus'),skip=document.getElementById('leadSkipBtn');
 const show=(msg,ok=false)=>{if(!status)return;status.hidden=false;status.textContent=msg;status.className='leadStatus '+(ok?'ok':'bad')};
 skip?.addEventListener('click',()=>{form.hidden=true});
 form.addEventListener('submit',async e=>{
  e.preventDefault();e.stopPropagation();
  const email=document.getElementById('leadEmail')?.value.trim()||'',profile=document.getElementById('leadProfile')?.value||'',consent=document.getElementById('leadConsent')?.checked===true;
  if(!email||!profile||!consent){show('Preencha o e-mail, selecione seu perfil e confirme a autorização de contato.');return}
  const button=form.querySelector('button[type="submit"]');if(button)button.disabled=true;show('Enviando seu contato...');
  try{
   const r=await fetch('/api/lead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
    name:document.getElementById('leadName')?.value||'',email,whatsapp:document.getElementById('leadWhatsapp')?.value||'',company:document.getElementById('leadCompany')?.value||'',profile,consent:true,source:'simulador-v3-diagnostico'
   })});
   const data=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(data.error||'Não foi possível registrar o contato.');
   show('Contato registrado. Obrigado por colaborar com o aperfeiçoamento do simulador.',true);
   form.querySelectorAll('input,select,button').forEach(el=>{if(el!==skip)el.disabled=true});
  }catch(err){show(err.message||'Falha temporária no envio. Tente novamente.')}
  finally{if(button&&!form.querySelector('.leadStatus.ok'))button.disabled=false}
 });
}
window.initLeadCapture=initLeadCapture;
document.addEventListener('brmi:diagnosis-generated',initLeadCapture);
