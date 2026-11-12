(async function(){
  var el=document.getElementById('monitoramentoEstado'); if(!el)return;
  try{
    var r=await fetch('/api/monitoramento-reforma',{cache:'default'});
    if(!r.ok)throw Error('indisponível');
    var j=await r.json();if(!j.ok||!j.checked_at||!j.sources_ok)throw Error('sem confirmação');
    var d=new Date(j.checked_at),date=d.toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'}),hm=d.toLocaleTimeString('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'});
    el.textContent='Fontes oficiais consultadas em '+date+' às '+hm+' ('+j.sources_ok+' fonte'+(j.sources_ok===1?'':'s')+')';
  }catch(e){el.textContent='Verificação automática indisponível. Consulte as atualizações editoriais.';}
})();