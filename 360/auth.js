(function(){
  const LOGIN_PATH='/360/login.html';
  const STATE_TABLE='platform360_user_state';
  let client=null, session=null, profile=null, configured=false;

  async function loadSdk(){
    if(window.supabase)return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }
  async function config(){
    const r=await fetch('/api/360-config',{headers:{Accept:'application/json'}});
    if(!r.ok)return {configured:false};
    return r.json();
  }
  async function init(){
    try{
      const cfg=await config();
      configured=Boolean(cfg.configured);
      if(!configured){document.documentElement.dataset.auth='unconfigured';return {configured:false};}
      await loadSdk();
      client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data}=await client.auth.getSession();
      session=data.session||null;
      if(session){
        await ensureProfile();
        document.documentElement.dataset.auth='signed-in';
        renderAccount();
      }else{
        document.documentElement.dataset.auth='signed-out';
        const here=location.pathname;
        if(!here.endsWith('/360/login.html')&&!here.endsWith('/360/login')) location.replace(LOGIN_PATH+'?next='+encodeURIComponent(here+location.search));
      }
      client.auth.onAuthStateChange(async(_event,newSession)=>{
        session=newSession||null;
        if(session){await ensureProfile();renderAccount();}
      });
      return {configured:true,session};
    }catch(err){
      console.error('Plataforma 360 auth:',err);
      document.documentElement.dataset.auth='error';
      return {configured:false,error:err};
    }
  }
  async function ensureProfile(){
    if(!client||!session?.user)return;
    const u=session.user;
    const meta=u.user_metadata||{};
    await client.from('platform360_profiles').upsert({
      id:u.id,
      email:u.email||null,
      full_name:meta.full_name||meta.name||null,
      avatar_url:meta.avatar_url||meta.picture||null,
      auth_provider:u.app_metadata?.provider||null,
      last_seen_at:new Date().toISOString()
    },{onConflict:'id'});
    const {data}=await client.from('platform360_profiles').select('*').eq('id',u.id).maybeSingle();
    profile=data||null;
    const acceptedAt=meta.policy_accepted_at;
    if(acceptedAt){
      const {data:existing}=await client.from('platform360_consents')
        .select('id').eq('user_id',u.id).eq('consent_type','terms_privacy').eq('policy_version',meta.policy_version||'2026-10-03').maybeSingle();
      if(!existing){
        await client.from('platform360_consents').insert({
          user_id:u.id,
          consent_type:'terms_privacy',
          policy_version:meta.policy_version||'2026-10-03',
          accepted:true,
          accepted_at:acceptedAt
        });
      }
    }
  }
  function renderAccount(){
    const host=document.getElementById('p360Account');
    if(!host||!session?.user)return;
    const name=profile?.full_name||session.user.email||'Minha conta';
    host.innerHTML='<span class="p360-user">'+escapeHtml(name)+'</span><button type="button" id="p360Logout">Sair</button>';
    document.getElementById('p360Logout')?.addEventListener('click',signOut);
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  async function signInWithPassword(email,password){if(!client)throw new Error('Autenticação ainda não configurada.');return client.auth.signInWithPassword({email,password});}
  async function signUp(email,password,fullName,acceptedPolicy){
    if(!client)throw new Error('Autenticação ainda não configurada.');
    if(!acceptedPolicy)throw new Error('É necessário aceitar a Política de Privacidade e os Termos de Uso.');
    return client.auth.signUp({
      email,password,
      options:{
        data:{
          full_name:fullName||'',
          policy_version:'2026-10-03',
          policy_accepted_at:new Date().toISOString()
        },
        emailRedirectTo:location.origin+'/360/'
      }
    });
  }
  async function signInWithGoogle(){
    if(!client)throw new Error('Autenticação ainda não configurada.');
    return client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/360/'}});
  }
  async function signInWithFacebook(){
    if(!client)throw new Error('Autenticação ainda não configurada.');
    return client.auth.signInWithOAuth({provider:'facebook',options:{redirectTo:location.origin+'/360/'}});
  }
  async function signOut(){if(client)await client.auth.signOut();location.replace(LOGIN_PATH);}
  async function saveState(key,value){
    if(!client||!session?.user)return false;
    const {error}=await client.from(STATE_TABLE).upsert({user_id:session.user.id,state_key:key,state_value:value,updated_at:new Date().toISOString()},{onConflict:'user_id,state_key'});
    if(error)throw error;return true;
  }
  async function loadState(key){
    if(!client||!session?.user)return null;
    const {data,error}=await client.from(STATE_TABLE).select('state_value').eq('user_id',session.user.id).eq('state_key',key).maybeSingle();
    if(error)throw error;return data?.state_value??null;
  }
  window.P360Auth={init,signInWithPassword,signUp,signInWithGoogle,signInWithFacebook,signOut,saveState,loadState,get client(){return client},get session(){return session},get profile(){return profile},get configured(){return configured}};
  window.P360Auth.ready=init();
})();
