/* Somente o shell público do aplicativo fica disponível offline.
   Dados de empresas, contas, APIs e simuladores não são armazenados pelo service worker. */
const VERSION='brmi-pwa-20261113-v1';
const CORE=['/app/','/app/index.html','/app/app.css','/app/app.js','/app/offline.html','/manifest.webmanifest','/assets/brmi-icon.svg','/assets/brmi-app-192.png','/assets/brmi-app-512.png','/assets/news-dialog-2026.js','/assets/noticias-editorial-2026.css'];
const CORE_PATHS=new Set(CORE);
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('brmi-pwa-')&&k!==VERSION).map(k=>caches.delete(k)))),self.clients.claim()]));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 const path=new URL(req.url).pathname;
 if(path.startsWith('/api/')||path.startsWith('/auth/')||path.startsWith('/simulador/')||path.startsWith('/360/')||path.startsWith('/motor-rt-credito-360/')||path==='/cadastro.html'||path==='/comunidade.html')return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).catch(async()=>await caches.match(path.startsWith('/app/')?'/app/':'/app/offline.html')||Response.error()));
  return;
 }
 if(CORE_PATHS.has(path)){
  event.respondWith(caches.match(path).then(cached=>cached||fetch(req)));
 }
});
