(function(){
  const CATS={
    geral:"Discussão geral","ibs-cbs":"IBS e CBS",simples:"Simples Nacional","split-payment":"Split payment",
    credito:"Créditos","precos-margens":"Preços e margens","capital-de-giro":"Capital de giro",
    "documentos-fiscais":"Documentos fiscais",setorial:"Impactos setoriais"
  };
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const fmt=d=>{try{return new Date(d).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}catch{return ""}};
  let client=null,session=null,currentCategory="todos",topics=[],replyCounts={},currentTopic=null,currentSearch="",currentSort="activity";

  async function loadSdk(){
    if(window.supabase)return;
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
    });
  }
  async function initClient(){
    try{
      const cfg=await fetch("/api/360-config",{headers:{Accept:"application/json"}}).then(r=>r.json());
      if(!cfg.configured)throw new Error("Banco da comunidade ainda não configurado.");
      await loadSdk();
      client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
      const {data}=await client.auth.getSession();session=data.session||null;
      renderAuth();
      client.auth.onAuthStateChange((_e,s)=>{session=s||null;renderAuth()});
      await loadTopics();
    }catch(err){
      $("topics").innerHTML='<div class="empty">A comunidade está temporariamente indisponível. '+esc(err.message||"")+'</div>';
      $("communityStatus").textContent="Não foi possível conectar à comunidade.";
    }
  }
  function renderAuth(){
    const account=$("account"),form=$("newTopicPanel"),login=$("loginCommunity"),logout=$("logoutCommunity");
    if(session?.user){
      const name=session.user.user_metadata?.full_name||session.user.user_metadata?.name||session.user.email?.split("@")[0]||"Participante";
      account.innerHTML="<strong>"+esc(name)+"</strong>"+esc(session.user.email||"");
      $("displayName").value=name.slice(0,60);
      form.hidden=false;login.hidden=true;logout.hidden=false;
    }else{
      account.innerHTML="<strong>Leitura aberta</strong>Entre para publicar ou responder.";
      form.hidden=true;login.hidden=false;logout.hidden=true;
    }
  }
  async function ensureProfile(){
    if(!session?.user)throw new Error("Entre para participar.");
    const name=$("displayName").value.trim();
    if(name.length<2)throw new Error("Informe um nome público com pelo menos 2 caracteres.");
    const {error}=await client.from("community_profiles").upsert({user_id:session.user.id,display_name:name,role:"member"},{onConflict:"user_id"});
    if(error)throw error;
  }
  async function loadTopics(){
    $("communityStatus").textContent="Atualizando discussões...";
    const {data,error}=await client.from("community_topics")
      .select("id,user_id,category,title,body,source_url,created_at,last_activity_at,community_profiles(display_name)")
      .eq("status","published").order("last_activity_at",{ascending:false}).limit(50);
    if(error)throw error;
    topics=data||[];
    const ids=topics.map(t=>t.id);
    replyCounts={};
    if(ids.length){
      const {data:replies}=await client.from("community_replies").select("topic_id").eq("status","published").in("topic_id",ids);
      (replies||[]).forEach(r=>replyCounts[r.topic_id]=(replyCounts[r.topic_id]||0)+1);
    }
    renderTopics();
    $("communityStatus").textContent=topics.length+" discuss"+(topics.length===1?"ão":"ões")+" publicadas.";
  }
  function renderTopics(){
    let list=currentCategory==="todos"?[...topics]:topics.filter(t=>t.category===currentCategory);
    const q=currentSearch.trim().toLowerCase();
    if(q)list=list.filter(t=>[
      t.title,t.body,t.community_profiles?.display_name,CATS[t.category]||t.category
    ].join(" ").toLowerCase().includes(q));
    if(currentSort==="recent")list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    else if(currentSort==="replies")list.sort((a,b)=>(replyCounts[b.id]||0)-(replyCounts[a.id]||0)||new Date(b.last_activity_at)-new Date(a.last_activity_at));
    else list.sort((a,b)=>new Date(b.last_activity_at)-new Date(a.last_activity_at));
    $("topics").innerHTML=list.length?list.map(t=>{
      const author=t.community_profiles?.display_name||"Participante";
      return '<button class="topic" type="button" data-topic="'+esc(t.id)+'"><div class="topic-top"><div><span class="topic-cat">'+esc(CATS[t.category]||t.category)+'</span><h3>'+esc(t.title)+'</h3></div></div><p>'+esc(t.body)+'</p><div class="topic-meta"><span>'+esc(author)+'</span><span>'+fmt(t.created_at)+'</span><span>'+(replyCounts[t.id]||0)+' resposta'+((replyCounts[t.id]||0)===1?"":"s")+'</span></div></button>';
    }).join(""):'<div class="empty">Nenhuma discussão nesta categoria.</div>';
    document.querySelectorAll("[data-topic]").forEach(b=>b.addEventListener("click",()=>openTopic(b.dataset.topic)));
  }
  async function openTopic(id){
    const topic=topics.find(t=>t.id===id);if(!topic)return;
    currentTopic=topic;
    $("dialogCategory").textContent=CATS[topic.category]||topic.category;
    $("dialogTitle").textContent=topic.title;
    $("dialogAuthor").textContent=(topic.community_profiles?.display_name||"Participante")+" · "+fmt(topic.created_at);
    $("dialogBodyText").textContent=topic.body;
    const sourceWrap=$("dialogSourceWrap"),sourceLink=$("dialogSource");
    if(topic.source_url){sourceLink.href=topic.source_url;sourceWrap.hidden=false}else{sourceLink.removeAttribute("href");sourceWrap.hidden=true}
    $("replyBox").value="";
    $("replyStatus").textContent="";
    const {data,error}=await client.from("community_replies")
      .select("id,user_id,body,created_at,community_profiles(display_name)")
      .eq("topic_id",id).eq("status","published").order("created_at",{ascending:true});
    if(error){$("replies").innerHTML='<div class="empty">Não foi possível carregar as respostas.</div>'}
    else $("replies").innerHTML=(data||[]).length?(data||[]).map(r=>'<div class="reply"><b>'+esc(r.community_profiles?.display_name||"Participante")+'</b><span>'+fmt(r.created_at)+'</span><p>'+esc(r.body)+'</p></div>').join(""):'<div class="empty">Ainda não há respostas.</div>';
    $("replyForm").hidden=!session?.user;
    $("replyLogin").hidden=Boolean(session?.user);
    $("topicDialog").showModal();
  }
  async function createTopic(e){
    e.preventDefault();const status=$("topicStatus");status.textContent="Publicando...";
    try{
      await ensureProfile();
      const title=$("topicTitle").value.trim(),body=$("topicBody").value.trim(),category=$("topicCategory").value,sourceUrl=$("topicSource").value.trim();
      if(title.length<8)throw new Error("O título precisa ter pelo menos 8 caracteres.");
      if(body.length<20)throw new Error("Descreva a questão com um pouco mais de contexto.");
      if(sourceUrl&&!/^https?:\/\//i.test(sourceUrl))throw new Error("A fonte deve começar com http:// ou https://.");
      const {error}=await client.from("community_topics").insert({user_id:session.user.id,title,body,category,source_url:sourceUrl||null,status:"published"});
      if(error)throw error;
      $("topicTitle").value="";$("topicBody").value="";$("topicSource").value="";status.textContent="Discussão publicada.";
      await loadTopics();
    }catch(err){status.textContent=err.message||"Não foi possível publicar."}
  }
  async function createReply(e){
    e.preventDefault();const status=$("replyStatus");status.textContent="Publicando...";
    try{
      if(!currentTopic)throw new Error("Discussão não selecionada.");
      await ensureProfile();
      const body=$("replyBox").value.trim();if(body.length<2)throw new Error("Escreva uma resposta.");
      const {error}=await client.from("community_replies").insert({topic_id:currentTopic.id,user_id:session.user.id,body,status:"published"});
      if(error)throw error;
      status.textContent="Resposta publicada.";await loadTopics();await openTopic(currentTopic.id);
    }catch(err){status.textContent=err.message||"Não foi possível responder."}
  }
  async function reportTopic(){
    if(!session?.user){location.href="/360/login.html?next=/comunidade.html";return}
    if(!currentTopic)return;
    const reason=prompt("Motivo do reporte (ex.: spam, informação enganosa, ofensa):");
    if(!reason||reason.trim().length<4)return;
    const {error}=await client.from("community_reports").insert({reporter_user_id:session.user.id,topic_id:currentTopic.id,reason:reason.trim().slice(0,500)});
    alert(error?"Não foi possível registrar o reporte.":"Reporte registrado para revisão.");
  }
  document.querySelectorAll(".filters [data-category]").forEach(b=>b.addEventListener("click",()=>{
    document.querySelectorAll(".filters [data-category]").forEach(x=>x.classList.remove("active"));
    b.classList.add("active");currentCategory=b.dataset.category;renderTopics();
  }));
  $("topicSearch").addEventListener("input",e=>{currentSearch=e.target.value||"";renderTopics()});
  $("topicSort").addEventListener("change",e=>{currentSort=e.target.value||"activity";renderTopics()});
  document.querySelectorAll("[data-topic-suggestion]").forEach(b=>b.addEventListener("click",()=>{
    if(!session?.user){location.href="/360/login.html?next=/comunidade.html";return}
    $("topicCategory").value=b.dataset.category||"geral";
    $("topicTitle").value=b.dataset.title||"";
    $("topicBody").focus();
    $("newTopicPanel").scrollIntoView({behavior:"smooth",block:"start"});
  }));
  $("topicForm").addEventListener("submit",createTopic);
  $("replyForm").addEventListener("submit",createReply);
  $("closeDialog").addEventListener("click",()=>$("topicDialog").close());
  $("reportTopic").addEventListener("click",reportTopic);
  $("loginCommunity").addEventListener("click",()=>location.href="/360/login.html?next=/comunidade.html");
  $("replyLogin").addEventListener("click",()=>location.href="/360/login.html?next=/comunidade.html");
  $("logoutCommunity").addEventListener("click",async()=>{if(client)await client.auth.signOut();location.reload()});
  initClient();
})();