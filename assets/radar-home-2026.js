(async function(){
  var grid=document.getElementById('newsHomeGrid'); if(!grid)return;
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function fmt(s){var d=new Date(s&&s.includes('T')?s:(s||'')+'T12:00:00');return isNaN(d.getTime())?'Data não informada':d.toLocaleDateString('pt-BR')}
  try{
    var r=await fetch('/api/noticias-reforma?limit=8',{cache:'no-store'});if(!r.ok)throw Error('feed');
    var data=await r.json(),items=(data.items||[]).filter(function(n){return n&&n.title&&n.url}).slice(0,4);
    if(!items.length)throw Error('feed vazio');
    grid.innerHTML=items.map(function(n,i){
      var meta='<div class="news-home-meta"><span class="news-home-pill">'+esc(n.type||'Imprensa')+'</span><span class="news-home-pill">'+esc(n.topicLabel||'Reforma Tributária')+'</span></div>';
      var footer='<div class="news-home-source"><span>'+esc(n.source||'Fonte externa')+'</span><span>'+fmt(n.publishedAt||n.date)+'</span></div>';
      var summary=esc(n.summary||'Leia a matéria na fonte original.');
      if(i===0)return '<a class="news-home-card featured" href="'+esc(n.url)+'" target="_blank" rel="noopener noreferrer">'+
        '<div class="news-feature-image"><img src="/assets/banner-2033.webp" alt="Ilustração temática sobre a transição tributária" loading="lazy" decoding="async"><small>Imagem ilustrativa do acervo do projeto</small></div>'+
        '<div class="news-feature-copy">'+meta+'<h3>'+esc(n.title)+'</h3><p>'+summary+'</p>'+footer+'</div></a>';
      return '<a class="news-home-card" href="'+esc(n.url)+'" target="_blank" rel="noopener noreferrer">'+meta+'<h3>'+esc(n.title)+'</h3><p>'+summary+'</p>'+footer+'</a>';
    }).join('');
    var stamp=document.getElementById('newsHomeChecked');
    if(stamp)stamp.textContent='Feed consultado em '+fmt(data.updated_at)+'. As datas nas matérias são de publicação.';
  }catch(e){grid.innerHTML='<div class="news-home-empty">Notícias temporariamente indisponíveis. <a href="/noticias-reforma.html">Consultar o radar de notícias</a>.</div>';}
})();