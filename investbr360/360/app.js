const $=id=>document.getElementById(id);
let listedCache=null;

function digits(v){return String(v||'').replace(/\D/g,'')}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function normalize(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function validCnpj(c){
  c=digits(c);if(c.length!==14||/^(\d)\1+$/.test(c))return false;
  const calc=(base,w)=>{const s=base.split('').reduce((a,n,i)=>a+Number(n)*w[i],0),r=s%11;return r<2?0:11-r};
  const d1=calc(c.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2=calc(c.slice(0,12)+d1,[6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return c.endsWith(String(d1)+String(d2));
}
function readArray(key){try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch(_){return []}}
function updateSnapshot(){
  $('companyCount').textContent=readArray('empresa360.portfolio.v03').length;
  $('selectionCount').textContent=readArray('bolsa360.selection.v01').length;
  let p=null;try{p=JSON.parse(localStorage.getItem('bolsa360.portfolio.v01')||'null')}catch(_){}
  $('portfolioStatus').textContent=p&&Array.isArray(p.positions)&&p.positions.length?'Sim':'Não';
}
async function listedUniverse(){
  if(listedCache)return listedCache;
  const r=await fetch('/api/bolsa360-cvm',{headers:{Accept:'application/json'}});
  const j=await r.json();
  if(!r.ok)throw new Error(j.error||'Não foi possível consultar a base de companhias listadas.');
  listedCache=j.companies||[];
  return listedCache;
}
function rankMatches(rows,q){
  q=normalize(q);
  return rows.map(r=>{
    const t=normalize(r.ticker),n=normalize(r.name),c=normalize(r.cvmName);
    let score=0;
    if(t===q)score=100;
    else if(t.startsWith(q))score=90;
    else if(n===q||c===q)score=85;
    else if(n.startsWith(q)||c.startsWith(q))score=75;
    else if(n.includes(q)||c.includes(q)||t.includes(q))score=60;
    return {r,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.r.volume-a.r.volume).slice(0,6).map(x=>x.r);
}
function goTicker(ticker){location.href='../bolsa-360/?ticker='+encodeURIComponent(String(ticker).toUpperCase())}
function goCnpj(cnpj){location.href='../empresa-360/?cnpj='+encodeURIComponent(digits(cnpj))}
function renderMatches(rows){
  const box=$('searchResults');
  if(!rows.length){box.classList.add('hidden');box.innerHTML='';return}
  box.innerHTML=rows.map(r=>'<button type="button" class="search-result" data-ticker="'+esc(r.ticker)+'"><div><b>'+esc(r.ticker)+' · '+esc(r.name||r.cvmName||'')+'</b><small>'+esc(r.sector||'Setor não informado')+(r.subsector?' · '+esc(r.subsector):'')+'</small></div><span>Abrir Bolsa 360 →</span></button>').join('');
  box.classList.remove('hidden');
}
$('searchResults').addEventListener('click',e=>{const b=e.target.closest('[data-ticker]');if(b)goTicker(b.dataset.ticker)});
$('globalSearch').addEventListener('submit',async e=>{
  e.preventDefault();
  const raw=$('searchInput').value.trim(),c=digits(raw),status=$('searchStatus');
  renderMatches([]);
  if(c.length===14){
    if(!validCnpj(c)){status.textContent='O número informado tem 14 dígitos, mas não passou na validação do CNPJ.';status.className='search-status error';return}
    status.textContent='CNPJ identificado. Abrindo Empresa 360...';status.className='search-status ok';goCnpj(c);return;
  }
  const ticker=raw.toUpperCase().replace(/\s/g,'');
  if(/^[A-Z]{4}\d{1,2}$/.test(ticker)){
    status.textContent='Ticker identificado. Abrindo Bolsa 360...';status.className='search-status ok';goTicker(ticker);return;
  }
  if(raw.length<2){status.textContent='Digite um CNPJ, ticker ou pelo menos duas letras do nome da companhia.';status.className='search-status error';return}
  status.textContent='Procurando entre as companhias listadas...';status.className='search-status';
  try{
    const rows=rankMatches(await listedUniverse(),raw);
    if(rows.length===1){goTicker(rows[0].ticker);return}
    if(!rows.length){status.textContent='Não encontrei companhia listada com esse nome. Para empresas não listadas, use o CNPJ.';status.className='search-status error';return}
    status.textContent='Selecione a companhia desejada.';status.className='search-status ok';renderMatches(rows);
  }catch(err){status.textContent=err.message||'Falha na busca.';status.className='search-status error'}
});
$('searchInput').addEventListener('input',()=>{const s=$('searchStatus');s.textContent='Exemplos: 33.000.167/0001-01 · PETR4 · Vale';s.className='search-status';renderMatches([])});
updateSnapshot();
window.addEventListener('storage',updateSnapshot);
