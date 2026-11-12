/* Manchete principal e três destaques, inspirados na hierarquia editorial da ANALIZI. */
(async function(){
'use strict';
const grid=document.getElementById('newsHomeGrid');if(!grid)return;
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=s=>{try{const u=new URL(String(s||''));return ['https:','http:'].includes(u.protocol)?u.href:''}catch(_){return ''}};
const fmt=s=>{if(!s)return 'Data não informada';const d=new Date(s.includes('T')?s:s+'T12:00:00');return Number.isNaN(d.getTime())?'Data não informada':d.toLocaleDateString('pt-BR')};
const topics={'ibs-cbs':'IBS e CBS','simples':'Simples Nacional','split-payment':'Split payment','imposto-seletivo':'Imposto Seletivo','documentos-fiscais':'Documentos fiscais','creditos':'Créditos','setorial':'Impactos setoriais'};
const asset=t=>({'split-payment':'/assets/banner-split.webp','simples':'/assets/banner-regime.webp','creditos':'/assets/banner-margens.webp','imposto-seletivo':'/assets/banner-2033.webp','documentos-fiscais':'/assets/observatorio-tributario.svg','ibs-cbs':'/assets/observatorio-tributario.svg'})[t]||'/assets/observatorio-tributario.svg';
const render=(n,i)=>{
 const title=esc(n.title),src=asset(n.topic),label=esc(n.topicLabel||topics[n.topic]||'Reforma Tributária');
 const url=esc(safe(n.url)),date=esc(fmt(n.publishedAt||n.date)),source=esc(n.source||'Fonte externa');
 const head='<span class="rt-news-topic">'+label+'</span>';
 if(i===0)return '<a class="news-home-card featured" href="'+url+'" data-news-preview="home:0" aria-haspopup="dialog"><div class="news-feature-image"><img src="'+src+'" alt="" loading="lazy" decoding="async"><small>Imagem temática ilustrativa do acervo do projeto</small></div><div class="news-feature-copy">'+head+'<h3>'+title+'</h3><div class="news-home-source"><span>'+source+'</span><span>'+date+'</span></div><span class="rt-news-read">Ler resumo</span></div></a>';
 return '<a class="news-home-card rt-news-side" href="'+url+'" data-news-preview="home:'+i+'" aria-haspopup="dialog"><div class="rt-news-side-photo"><img src="'+src+'" alt="" loading="lazy" decoding="async"></div><div class="rt-news-side-copy">'+head+'<h3>'+title+'</h3><div class="news-home-source"><span>'+source+'</span><span>'+date+'</span></div></div></a>';
};
try{
 const res=await fetch('/api/noticias-reforma?limit=8',{cache:'no-store'});if(!res.ok)throw Error('feed unavailable');
 const data=await res.json(),items=(Array.isArray(data.items)?data.items:[]).filter(n=>n&&n.title&&safe(n.url)).slice(0,4);
 if(!items.length)throw Error('feed empty');
 if(window.BRMINewsPreview)window.BRMINewsPreview.register('home',items);
 grid.innerHTML=items.map(render).join('');
 const stamp=document.getElementById('newsHomeChecked');
 if(stamp)stamp.textContent='Feed consultado em '+fmt(data.updated_at)+'. Datas de publicação informadas pelas fontes.';
}catch(_){grid.innerHTML='<div class="news-home-empty">O radar está temporariamente indisponível. <a href="/noticias-reforma.html">Abrir página de notícias</a>.</div>';}
})();