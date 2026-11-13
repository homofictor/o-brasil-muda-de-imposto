(function(){
'use strict';
const list=document.getElementById('newsList');
const help=document.getElementById('installHelp');
const installButton=document.getElementById('installButton');
const connection=document.getElementById('connection');
let deferredInstall=null;
function updateConnection(){connection.hidden=navigator.onLine;}
window.addEventListener('online',updateConnection);
window.addEventListener('offline',updateConnection);
updateConnection();
function safeUrl(value){try{const url=new URL(String(value||''));return url.protocol==='https:'?url.href:null;}catch(_){return null;}}
function dateLabel(value){if(!value)return 'Data não informada';const parsed=new Date(value.includes('T')?value:value+'T12:00:00');return Number.isNaN(parsed.getTime())?'Data não informada':parsed.toLocaleDateString('pt-BR');}
function itemNode(item,index){
 const a=document.createElement('a');a.className='news-item';a.href=safeUrl(item.url);a.setAttribute('data-news-preview','app:'+index);a.setAttribute('aria-haspopup','dialog');
 const small=document.createElement('small');small.textContent=(item.topicLabel||'Reforma Tributária')+' · '+dateLabel(item.publishedAt||item.date);
 const title=document.createElement('h3');title.textContent=item.title;
 const source=document.createElement('p');source.textContent=item.source||'Fonte identificada na matéria';
 const read=document.createElement('span');read.className='read';read.textContent='Ler resumo na plataforma';
 a.append(small,title,source,read);return a;
}
async function loadNews(){
 try{
  const response=await fetch('/api/noticias-reforma?limit=6',{cache:'no-store'});
  if(!response.ok)throw new Error('feed');
  const body=await response.json();
  const items=(Array.isArray(body.items)?body.items:[]).filter(x=>x&&x.title&&safeUrl(x.url)).slice(0,5);
  if(!items.length)throw new Error('empty');
  if(window.BRMINewsPreview)window.BRMINewsPreview.register('app',items);
  list.replaceChildren(...items.map(itemNode));
 }catch(_){
  const p=document.createElement('p');p.className='empty';p.textContent='O radar não pôde ser consultado agora. Acesse a seção Notícias quando houver conexão.';
  list.replaceChildren(p);
 }
}
function guide(){
 const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
 const text=isIOS?'No iPhone: toque em Compartilhar no navegador e escolha Adicionar à Tela de Início.':'No Android: abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial.';
 help.textContent=text;help.hidden=false;
}
window.addEventListener('beforeinstallprompt',event=>{
 event.preventDefault();deferredInstall=event;installButton.textContent='Instalar aplicativo';
});
window.addEventListener('appinstalled',()=>{deferredInstall=null;installButton.textContent='Aplicativo instalado';installButton.disabled=true;help.hidden=true;});
installButton.addEventListener('click',async()=>{
 if(!deferredInstall){guide();return;}
 const event=deferredInstall;deferredInstall=null;
 try{await event.prompt();const result=await event.userChoice;if(result.outcome!=='accepted'){installButton.textContent='Como instalar';guide();}}
 catch(_){installButton.textContent='Como instalar';guide();}
});
loadNews();
})();