/* Leitura editorial dentro do portal, sem incorporação de HTML externo. */
(function(){
 'use strict';
 const records=new Map();let layer=null,lastFocus=null;
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safe=s=>{try{const u=new URL(String(s||''));return ['https:','http:'].includes(u.protocol)?u.href:''}catch(_){return ''}};
 const date=s=>{if(!s)return 'Data não informada';const d=new Date(s.includes('T')?s:s+'T12:00:00');return Number.isNaN(d.getTime())?'Data não informada':d.toLocaleDateString('pt-BR')};
 const topic=t=>({'ibs-cbs':'IBS e CBS','simples':'Simples Nacional','split-payment':'Split payment','imposto-seletivo':'Imposto Seletivo','documentos-fiscais':'Documentos fiscais','creditos':'Créditos tributários','setorial':'Setores e regiões'})[t]||'Reforma Tributária';
 function ensure(){
  if(layer)return layer;
  layer=document.createElement('div');layer.className='rt-news-dialog-layer';layer.hidden=true;
  layer.innerHTML='<div class="rt-news-dialog-scrim" data-news-dismiss></div><section class="rt-news-dialog" role="dialog" aria-modal="true" aria-labelledby="rtNewsDialogTitle" aria-describedby="rtNewsDialogDescription" tabindex="-1"><div class="rt-news-dialog-top"><span>RESUMO DA MATÉRIA · O BRASIL MUDA DE IMPOSTO</span><button class="rt-news-dialog-close" type="button" data-news-dismiss>Fechar <span aria-hidden="true">×</span></button></div><div id="rtNewsDialogContent"></div></section>';
  document.body.appendChild(layer);
  layer.addEventListener('click',e=>{if(e.target.closest('[data-news-dismiss]'))close()});
  return layer;
 }
 function open(item){
  const url=safe(item?.url);if(!url)return;
  ensure();lastFocus=document.activeElement;
  const title=esc(item.title||'Notícia da Reforma Tributária');
  const description=item.summary&&String(item.summary).trim()?esc(item.summary):'A fonte não disponibilizou informações suficientes para elaborar um resumo factual confiável. Leia a matéria original para conferir os detalhes.';
  document.getElementById('rtNewsDialogContent').innerHTML='<div class="rt-news-dialog-body"><div class="rt-news-dialog-meta"><span>'+esc(item.topicLabel||topic(item.topic))+'</span><span>'+esc(item.source||'Fonte original')+'</span><span>'+esc(date(item.publishedAt||item.date))+'</span></div><h2 id="rtNewsDialogTitle">'+title+'</h2><p id="rtNewsDialogDescription" class="rt-news-dialog-text">'+description+'</p><div class="rt-news-dialog-notice"><strong>Nota editorial</strong><p>O resumo utiliza somente a descrição disponível na fonte. Não representa leitura integral da reportagem nem comprovação de mudança normativa.</p></div><div class="rt-news-dialog-actions"><a class="rt-news-dialog-original" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Ler reportagem na fonte original ↗</a><button type="button" data-news-dismiss class="rt-news-dialog-secondary">Voltar ao portal</button></div></div>';
  layer.hidden=false;document.body.classList.add('rt-news-dialog-open');layer.querySelector('.rt-news-dialog-close').focus();
  document.addEventListener('keydown',handleKey);
 }
 function close(){
  if(!layer||layer.hidden)return;
  layer.hidden=true;document.body.classList.remove('rt-news-dialog-open');document.removeEventListener('keydown',handleKey);
  if(lastFocus&&typeof lastFocus.focus==='function'&&lastFocus.isConnected)lastFocus.focus();
 }
 function handleKey(e){
  if(e.key==='Escape'){e.preventDefault();close();return}
  if(e.key!=='Tab'||!layer||layer.hidden)return;
  const selectors='button:not(:disabled),a[href]';
  const f=[...layer.querySelectorAll(selectors)].filter(el=>el.getClientRects().length);
  if(!f.length)return;
  if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f[f.length-1].focus()}
  else if(!e.shiftKey&&document.activeElement===f[f.length-1]){e.preventDefault();f[0].focus()}
 }
 document.addEventListener('click',e=>{
  const link=e.target.closest('[data-news-preview]');if(!link)return;
  const article=records.get(link.getAttribute('data-news-preview'));if(!article)return;
  e.preventDefault();open(article);
 });
 window.BRMINewsPreview={register(namespace,items){(Array.isArray(items)?items:[]).forEach((x,i)=>records.set(namespace+':'+i,x))},close};
})();