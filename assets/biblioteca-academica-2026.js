(async function(){
const grid=document.getElementById('acervoGrid');if(!grid)return;
const q=document.getElementById('acervoBusca'),area=document.getElementById('acervoArea'),year=document.getElementById('acervoAno'),counter=document.getElementById('acervoContagem');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let items=[];
function render(){
 const qq=(q.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
 const visible=items.filter(x=>(!qq||[x.title,x.authors,x.topic,x.journal,x.description].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(qq))&&(!area.value||x.area===area.value)&&(!year.value||String(x.year)===year.value));
 counter.textContent=visible.length+' referência(s) encontrada(s).';
 grid.innerHTML=visible.map(x=>'<article class="acervo-item"><span class="acervo-tag">'+esc(x.area)+' · '+esc(x.year)+'</span><h3>'+esc(x.title)+'</h3><p class="acervo-authors">'+esc(x.authors)+'</p><p>'+esc(x.description)+'</p><div class="acervo-meta">'+esc(x.journal)+' · '+esc(x.topic)+'</div><div class="acervo-links"><a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Consultar no periódico</a> <span>DOI: '+esc(x.doi||'não informado')+'</span></div></article>').join('')||'<p>Nenhum artigo corresponde aos filtros.</p>';
}
try{const r=await fetch('/data/acervo-academico.json');if(!r.ok)throw Error('acervo');items=(await r.json()).items||[];render()}catch(e){grid.innerHTML='<p>O acervo não pôde ser carregado. Tente novamente.</p>'}
[q,area,year].forEach(el=>el.addEventListener(el===q?'input':'change',render));
})();