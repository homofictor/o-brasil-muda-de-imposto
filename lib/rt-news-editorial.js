/* Regras editoriais adaptadas do radar de noticias da ANALIZI.
 * Apenas texto fornecido pela fonte. Nao inventa fatos.
 */
const STOP=new Set(['para','com','sobre','brasil','reforma','tributaria','tributario','receita','federal','governo','novo','novos','nova','novas','pela','pelos','entre','como','mais','outros','outro','essa','esta','esse','este','apos','ainda','depois','antes','desde','todas','todos','sem','dos','das','uma','que','nos','nas','por','nao','sim']);
function normalize(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function clean(value){
 return String(value||'')
 .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
 .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
 .replace(/<[^>]*>/g,' ')
 .replace(/\b(?:data-[\w-]+|alt|src|srcset|class|width|height|loading)\s*=\s*(?:"[^"]*"|'[^']*'|\S+)/gi,' ')
 .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi,x=>({'&nbsp;':' ','&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>'})[x.toLowerCase()]||' ')
 .replace(/\s+/g,' ').trim();
}
function noise(value){
 const raw=String(value||'').toLowerCase(),text=clean(value);
 return !text||/\b(?:data-image|data-photo|image-caption|srcset|alt=)\b/i.test(raw)||/^(?:foto|fotografia|imagem|credito da foto|leia tambem|veja tambem|publicidade|newsletter|assine agora|clique aqui)\b/i.test(normalize(text))||/\b(?:Getty Images|Reuters)\s*\//i.test(text);
}
function excerpt(title,description){
 if(noise(description))return '';
 let out=clean(description);
 if(title&&out.toLowerCase().startsWith(String(title).toLowerCase()))out=out.slice(String(title).length).replace(/^[. :\-]+/,'').trim();
 if(normalize(out)===normalize(title)||out.length<38)return '';
 return out.slice(0,360).trim();
}
function tokens(text){
 return new Set(normalize(text).split(' ').filter(t=>(t.length>=4||t==='ibs'||t==='cbs')&&!STOP.has(t)&&!/^\d+$/.test(t)));
}
function likelySameEvent(a,b){
 const x=tokens(a.title),y=tokens(b.title);
 if(x.size<5||y.size<5)return false;
 let common=0;for(const word of x)if(y.has(word))common++;
 const contain=common/Math.min(x.size,y.size),jaccard=common/(x.size+y.size-common);
 if(contain<.83||jaccard<.69)return false;
 const aDate=Date.parse(a.publishedAt||a.date||''),bDate=Date.parse(b.publishedAt||b.date||'');
 return !(Number.isFinite(aDate)&&Number.isFinite(bDate)&&Math.abs(aDate-bDate)>5*86400000);
}
module.exports={excerpt,likelySameEvent};