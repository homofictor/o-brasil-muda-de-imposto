(async function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const status=$('authStatus'),form=$('authForm');
  const redirect=new URLSearchParams(location.search);
  function safePath(raw,fall='/comunidade.html'){
    const v=String(raw||'').trim();
    if(!v.startsWith('/')||v.startsWith('//')||v.includes('\\'))return fall;
    try{const url=new URL(v,location.origin);return url.origin===location.origin?url.pathname+url.search+url.hash:fall}catch(_){return fall}
  }
  const next=safePath(redirect.get('next'));
  let client=null,mode=redirect.get('modo')==='criar'?'signup':'login',googleEnabled=false;
  function message(text,error=false){status.textContent=text;status.className='message'+(error?' error':' ok')}
  function setMode(value){
    mode=value;
    $('tabLogin').setAttribute('aria-selected',String(mode==='login'));
    $('tabSignup').setAttribute('aria-selected',String(mode==='signup'));
    $('nameField').hidden=mode!=='signup';$('termsField').hidden=mode!=='signup';
    $('nameField').querySelector('input').required=mode==='signup';
    $('passwordField').hidden=mode==='recover';$('password').required=mode!=='recover';
    $('password').autocomplete=mode==='signup'?'new-password':'current-password';
    $('submitBtn').textContent=mode==='signup'?'Criar cadastro':mode==='recover'?'Enviar instruções':'Entrar';
    $('forgotBtn').hidden=mode==='recover'||mode==='signup';
    $('accessTitle').textContent=mode==='signup'?'Crie seu cadastro gratuito':mode==='recover'?'Recuperação de acesso':'Entre na sua conta';
    $('accessDescription').textContent=mode==='signup'?'Uma conta permite participar da comunidade técnica.':'Use seu e-mail para autenticar no portal.';
    $('googleArea').hidden=!googleEnabled||mode==='recover';
    $('authStatus').className='message';$('authStatus').textContent='';
  }
  $('tabLogin').addEventListener('click',()=>setMode('login'));
  $('tabSignup').addEventListener('click',()=>setMode('signup'));
  $('forgotBtn').addEventListener('click',e=>{e.preventDefault();setMode('recover')});
  function displayAccount(user){
    form.hidden=true;$('authModes').hidden=true;$('googleArea').hidden=true;
    $('accountPanel').hidden=false;$('accountName').textContent=user.user_metadata?.full_name||'Conta autenticada';
    $('accountMail').textContent=user.email||'E-mail indisponível';
    $('accessTitle').textContent='Sua conta';
    $('accessDescription').textContent='Acesse os recursos de participação e a comunidade.';
    if(redirect.get('password_reset')==='1'){$('resetPanel').hidden=false;message('Defina a nova senha para concluir a recuperação.')}
    else if(redirect.get('oauth_return')==='1')message('Acesso Google confirmado.');
    else message('Sessão identificada.');
  }
  async function loadSDK(){
    if(window.supabase)return;
    const el=document.createElement('script');el.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    await new Promise((resolve,reject)=>{el.onload=resolve;el.onerror=()=>reject(Error('Biblioteca de autenticação indisponível.'));document.head.appendChild(el)});
  }
  try{
    const cfg=await fetch('/api/360-config',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Configuração não disponível.');return r.json()});
    if(!cfg.configured||!/^https:\/\/[^/]+\.supabase\.co$/.test(cfg.url)||!cfg.anonKey)throw Error('Cadastro temporariamente indisponível.');
    const health=await fetch('/api/auth-health',{cache:'no-store'}).then(r=>r.ok?r.json():{ok:false}).catch(()=>({ok:false}));
    if(!health.ok)throw Error('O serviço de autenticação está temporariamente indisponível.');
    googleEnabled=health.external?.google===true;
    await loadSDK();
    client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const result=await client.auth.getSession();if(result.error)throw result.error;
    setMode(mode);$('submitBtn').disabled=false;$('googleArea').hidden=!googleEnabled;
    if(result.data.session?.user){
      if(redirect.get('oauth_return')==='1'&&sessionStorage.getItem('brmiPolicyConsent')){
        await client.auth.updateUser({data:{policy_version:'2026-11-12',policy_accepted_at:sessionStorage.getItem('brmiPolicyConsent')}}).catch(()=>{});
        sessionStorage.removeItem('brmiPolicyConsent');
      }
      displayAccount(result.data.session.user);
    }else message('O acesso está disponível. Escolha entrar ou criar cadastro.');
  }catch(err){
    $('submitBtn').disabled=true;$('googleArea').hidden=true;
    message('Cadastro indisponível no momento. Notícias, legislação e simuladores continuam acessíveis sem conta.',true);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(!client)return;
    const email=$('email').value.trim(),password=$('password').value;
    if(!$('email').checkValidity()){message('Informe um e-mail válido.',true);return}
    if(mode!=='recover'&&password.length<8){message('A senha precisa ter ao menos oito caracteres.',true);return}
    if(mode==='signup'&&(!$('fullName').value.trim()||!$('terms').checked)){message('Preencha seu nome e aceite os termos para criar a conta.',true);return}
    const button=$('submitBtn');button.disabled=true;button.textContent='Processando...';
    try{
      let result;
      if(mode==='recover'){
        result=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/auth/confirm.html?next='+encodeURIComponent('/cadastro.html?password_reset=1')});
        if(result.error)throw result.error;
        message('Se o e-mail estiver cadastrado, enviaremos instruções para redefinir a senha.');return;
      }
      if(mode==='signup'){
        result=await client.auth.signUp({email,password,options:{data:{full_name:$('fullName').value.trim().slice(0,100),policy_version:'2026-11-12',policy_accepted_at:new Date().toISOString()},emailRedirectTo:location.origin+'/auth/confirm.html?next='+encodeURIComponent('/cadastro.html')}});
      }else result=await client.auth.signInWithPassword({email,password});
      if(result.error)throw result.error;
      if(result.data.session?.user){displayAccount(result.data.session.user);if(mode==='login'&&redirect.has('next'))location.assign(next)}
      else message('Confira sua caixa de entrada para as instruções de confirmação, quando aplicável.');
    }catch(e){message('Não foi possível concluir o acesso. Verifique seus dados ou tente novamente.',true)}
    finally{button.disabled=false;setMode(mode)}
  });
  $('googleBtn').addEventListener('click',async()=>{
    if(!client||!googleEnabled)return;
    if(!$('googleTerms').checked){message('É necessário aceitar os termos antes do acesso Google.',true);return}
    sessionStorage.setItem('brmiPolicyConsent',new Date().toISOString());
    const ret='/cadastro.html?oauth_return=1&next='+encodeURIComponent(next);
    const result=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/auth/confirm.html?next='+encodeURIComponent(ret)}});
    if(result.error)message('Acesso com Google indisponível. Use e-mail e senha.',true);
  });
  $('logoutBtn').addEventListener('click',async()=>{if(client)await client.auth.signOut();location.replace('/cadastro.html')});
  $('resetSubmit').addEventListener('click',async()=>{const pwd=$('newPassword').value;if(!client||pwd.length<8){message('A senha precisa ter pelo menos oito caracteres.',true);return}const res=await client.auth.updateUser({password:pwd});if(res.error){message('Não foi possível atualizar a senha.',true);return}history.replaceState(null,'','/cadastro.html');$('resetPanel').hidden=true;message('Senha atualizada com sucesso.')});
})();