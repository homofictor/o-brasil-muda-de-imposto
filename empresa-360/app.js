const KEY='empresa360.portfolio.v03';
const state={portfolio:[],selected:null};

const $=id=>document.getElementById(id);
const form=$('cnpjForm');
const input=$('cnpj');
const addBtn=$('addBtn');
const statusEl=$('status');

function onlyDigits(v){return String(v||'').replace(/\D/g,'').slice(0,14)}
function maskCnpj(v){
  const d=onlyDigits(v);
  return d.replace(/^(\d{2})(\d)/,'$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
    .replace(/\.(\d{3})(\d)/,'.$1/$2')
    .replace(/(\d{4})(\d)/,'$1-$2');
}
function validCnpj(cnpj){
  const c=onlyDigits(cnpj);
  if(c.length!==14||/^(\d)\1{13}$/.test(c))return false;
  const calc=(base,w)=>{
    const s=base.split('').reduce((a,n,i)=>a+Number(n)*w[i],0);
    const r=s%11;
    return r<2?0:11-r;
  };
  const d1=calc(c.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2=calc(c.slice(0,12)+d1,[6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return c.endsWith(String(d1)+String(d2));
}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function showStatus(msg,type=''){statusEl.textContent=msg;statusEl.className='status '+type}
function save(){localStorage.setItem(KEY,JSON.stringify(state.portfolio))}
function load(){
  try{
    const p=JSON.parse(localStorage.getItem(KEY)||'[]');
    state.portfolio=Array.isArray(p)?p:[];
  }catch(_){state.portfolio=[]}
}

const sectors={
  agriculture:{name:'Agropecuária',group:'supply',base:76},
  extractive:{name:'Indústria extrativa',group:'supply',base:88},
  industry:{name:'Indústria',group:'supply',base:90},
  utilities:{name:'Energia e utilidades',group:'supply',base:84},
  construction:{name:'Construção',group:'supply',base:92},
  wholesale:{name:'Comércio atacadista',group:'supply',base:86},
  retail:{name:'Comércio varejista',group:'supply',base:82},
  transport:{name:'Transporte e logística',group:'supply',base:83},
  hospitality:{name:'Hospedagem e alimentação',group:'consumer',base:80},
  tech:{name:'Tecnologia e informação',group:'services',base:74},
  finance:{name:'Financeiro e seguros',group:'specific',base:58},
  realestate:{name:'Imobiliário',group:'specific',base:84},
  professional:{name:'Serviços profissionais',group:'services',base:78},
  admin:{name:'Serviços administrativos',group:'services',base:76},
  education:{name:'Educação',group:'services',base:72},
  health:{name:'Saúde',group:'services',base:74},
  arts:{name:'Cultura e entretenimento',group:'consumer',base:72},
  services:{name:'Serviços',group:'services',base:74}
};
function sectorFromCnae(cnae){
  const raw=String(cnae||'').padStart(7,'0');
  const div=Number(raw.slice(0,2));
  if(div>=1&&div<=3)return sectors.agriculture;
  if(div>=5&&div<=9)return sectors.extractive;
  if(div>=10&&div<=33)return sectors.industry;
  if(div>=35&&div<=39)return sectors.utilities;
  if(div>=41&&div<=43)return sectors.construction;
  if(div===45||div===47)return sectors.retail;
  if(div===46)return sectors.wholesale;
  if(div>=49&&div<=53)return sectors.transport;
  if(div>=55&&div<=56)return sectors.hospitality;
  if(div>=58&&div<=63)return sectors.tech;
  if(div>=64&&div<=66)return sectors.finance;
  if(div===68)return sectors.realestate;
  if(div>=69&&div<=75)return sectors.professional;
  if(div>=77&&div<=82)return sectors.admin;
  if(div===85)return sectors.education;
  if(div>=86&&div<=88)return sectors.health;
  if(div>=90&&div<=93)return sectors.arts;
  return sectors.services;
}
function regimeInfo(c){
  if(c.opcao_pelo_simples===true)return {name:'Simples Nacional',year:2026,source:'opção pública'};
  const r=c.regime_tributario_recente;
  if(r&&r.forma_de_tributacao)return {name:r.forma_de_tributacao,year:Number(r.ano)||null,source:'histórico disponível'};
  return {name:'Não identificado',year:null,source:'não disponível'};
}
function buildTriage(c){
  const sector=sectorFromCnae(c.cnae_fiscal);
  const regime=regimeInfo(c);
  let score=sector.base;
  const reasons=[];

  if(sector.group==='supply'){
    score+=4;
    reasons.push('Setor com cadeia de compras, insumos ou ativos que justifica avaliar créditos e efeitos de caixa.');
  }
  if(sector.group==='services'){
    score+=2;
    reasons.push('Atividade de serviços merece testar a relação entre créditos disponíveis, preço e margem.');
  }
  if(sector.group==='specific'){
    reasons.push('Atividade com tratamento ou dinâmica específica. O simulador deve ser usado com revisão cuidadosa das premissas.');
  }
  if(c.opcao_pelo_simples===true){
    score+=5;
    reasons.push('Optante do Simples identificado. A transição e a relação com clientes B2B justificam simulação específica.');
  }
  if(!regime.year){
    score+=5;
    reasons.push('O regime atual não foi identificado automaticamente e precisa ser confirmado.');
  }else if(regime.year<2026){
    score+=7;
    reasons.push('O regime público disponível é de '+regime.year+' e precisa ser confirmado para 2026.');
  }
  const secondary=Number(c.cnaes_secundarios_count||0);
  if(secondary>=5){
    score+=3;
    reasons.push('A empresa possui vários CNAEs secundários, o que pode exigir revisão da composição real das receitas.');
  }
  if(String(c.porte||'').toUpperCase()==='DEMAIS'){
    score+=2;
    reasons.push('Porte cadastral indica maior complexidade potencial para a análise.');
  }
  score=Math.max(0,Math.min(100,Math.round(score)));

  return {
    score,
    level:score>=80?'Alta':score>=65?'Média':'Inicial',
    sector,
    regime,
    regimeNeedsConfirmation:(!regime.year||regime.year<2026),
    reasons:reasons.slice(0,4)
  };
}
function hydrate(entry){
  const triage=buildTriage(entry.data);
  return {...entry,triage};
}
function priorityClass(level){return level==='Alta'?'high':level==='Média'?'medium':'low'}
function portfolioSorted(){return state.portfolio.map(hydrate).sort((a,b)=>b.triage.score-a.triage.score)}
function companyName(e){return e.data.razao_social||e.data.nome_fantasia||e.cnpj}

async function fetchCompany(cnpj){
  const res=await fetch('/api/empresa360-cnpj?cnpj='+encodeURIComponent(cnpj),{headers:{Accept:'application/json'}});
  const payload=await res.json().catch(()=>({}));
  if(!res.ok||!payload.data)throw new Error(payload.error||'Não foi possível consultar o CNPJ.');
  return payload.data;
}
async function addCompany(cnpj,{silent=false}={}){
  cnpj=onlyDigits(cnpj);
  if(!validCnpj(cnpj))throw new Error('CNPJ inválido: '+cnpj);
  const existing=state.portfolio.find(x=>x.cnpj===cnpj);
  if(existing){if(!silent)selectCompany(cnpj);return {added:false,existing:true}}
  const data=await fetchCompany(cnpj);
  state.portfolio.push({cnpj,data,addedAt:new Date().toISOString(),reformaStartedAt:null});
  save();
  renderAll();
  if(!silent)selectCompany(cnpj);
  return {added:true};
}

function renderMetrics(items){
  $('metricTotal').textContent=items.length;
  $('metricHigh').textContent=items.filter(x=>x.triage.level==='Alta').length;
  $('metricRegime').textContent=items.filter(x=>x.triage.regimeNeedsConfirmation).length;
  $('metricPending').textContent=items.filter(x=>!x.reformaStartedAt).length;

  $('oppIndustry').textContent=items.filter(x=>x.triage.sector.group==='supply').length;
  $('oppServices').textContent=items.filter(x=>x.triage.sector.group==='services').length;
  $('oppSimple').textContent=items.filter(x=>x.data.opcao_pelo_simples===true).length;
  $('oppOldRegime').textContent=items.filter(x=>x.triage.regime.year&&x.triage.regime.year<2026).length;
}
function filteredItems(items){
  const q=$('portfolioSearch').value.trim().toLowerCase();
  const f=$('portfolioFilter').value;
  return items.filter(x=>{
    const text=[companyName(x),x.cnpj,x.data.nome_fantasia,x.triage.sector.name,x.triage.regime.name].filter(Boolean).join(' ').toLowerCase();
    if(q&&!text.includes(q))return false;
    if(f==='high'&&x.triage.level!=='Alta')return false;
    if(f==='regime'&&!x.triage.regimeNeedsConfirmation)return false;
    if(f==='pending'&&x.reformaStartedAt)return false;
    return true;
  });
}
function renderTable(items){
  const list=filteredItems(items);
  $('emptyState').classList.toggle('hidden',state.portfolio.length>0);
  $('portfolioWrap').classList.toggle('hidden',state.portfolio.length===0);

  $('portfolioBody').innerHTML=list.map(x=>{
    const regime=x.triage.regime;
    const status=x.reformaStartedAt?'Reforma iniciada':'Ainda não iniciada';
    return `
      <tr>
        <td><strong>${esc(companyName(x))}</strong><small>${maskCnpj(x.cnpj)} · ${esc(x.data.municipio||'')} ${esc(x.data.uf||'')}</small></td>
        <td>${esc(x.triage.sector.name)}</td>
        <td><strong>${esc(regime.name)}</strong><small>${regime.year?'referência '+regime.year:'confirmar'}</small></td>
        <td><span class="score-pill ${priorityClass(x.triage.level)}">${x.triage.level} · ${x.triage.score}/100</span></td>
        <td><span class="status-pill ${x.reformaStartedAt?'started':''}">${status}</span></td>
        <td><button class="row-button" data-company="${x.cnpj}" type="button">Abrir dossiê</button></td>
      </tr>`;
  }).join('');

  if(state.portfolio.length>0&&!list.length){
    $('portfolioBody').innerHTML='<tr><td colspan="6"><small>Nenhuma empresa corresponde ao filtro atual.</small></td></tr>';
  }
}
function renderAll(){
  const items=portfolioSorted();
  renderMetrics(items);
  renderTable(items);
  if(state.selected){
    const exists=state.portfolio.some(x=>x.cnpj===state.selected);
    if(exists)renderDrawer(state.selected);else clearDrawer();
  }
}
function clearDrawer(){
  state.selected=null;
  $('drawerContent').classList.add('hidden');
  $('drawerEmpty').classList.remove('hidden');
}
function renderDrawer(cnpj){
  const raw=state.portfolio.find(x=>x.cnpj===cnpj);
  if(!raw)return clearDrawer();
  const x=hydrate(raw);
  state.selected=cnpj;
  $('drawerEmpty').classList.add('hidden');
  $('drawerContent').classList.remove('hidden');

  $('drawerName').textContent=companyName(x);
  $('drawerSubtitle').textContent=[x.data.nome_fantasia,x.triage.sector.name,x.data.municipio&&x.data.uf?x.data.municipio+' / '+x.data.uf:null].filter(Boolean).join(' · ');
  $('drawerPriority').textContent=x.triage.level;
  $('drawerScore').textContent=x.triage.score+'/100';
  $('drawerReasons').innerHTML=x.triage.reasons.map(r=>'<div class="reason">'+esc(r)+'</div>').join('');
  $('openReforma').href='../simulador/guiado/?empresa360=1&cnpj='+encodeURIComponent(x.cnpj);
}
function selectCompany(cnpj){
  renderDrawer(cnpj);
  $('companyDrawer').scrollIntoView({behavior:'smooth',block:'nearest'});
}

form.addEventListener('submit',async e=>{
  e.preventDefault();
  const cnpj=onlyDigits(input.value);
  if(!validCnpj(cnpj)){showStatus('Informe um CNPJ válido com 14 dígitos.','error');input.focus();return}
  addBtn.disabled=true;addBtn.textContent='Consultando...';showStatus('Consultando a empresa...');
  try{
    const result=await addCompany(cnpj);
    input.value='';
    showStatus(result.existing?'Empresa já estava na carteira.':'Empresa adicionada à carteira.','success');
  }catch(err){showStatus(err.message||'Falha na consulta.','error')}
  finally{addBtn.disabled=false;addBtn.textContent='Adicionar à carteira'}
});
input.addEventListener('input',()=>{input.value=maskCnpj(input.value);showStatus('')});

$('portfolioBody').addEventListener('click',e=>{
  const btn=e.target.closest('[data-company]');
  if(btn)selectCompany(btn.dataset.company);
});
$('portfolioSearch').addEventListener('input',()=>renderTable(portfolioSorted()));
$('portfolioFilter').addEventListener('change',()=>renderTable(portfolioSorted()));

$('removeCompany').addEventListener('click',()=>{
  if(!state.selected)return;
  state.portfolio=state.portfolio.filter(x=>x.cnpj!==state.selected);
  save();clearDrawer();renderAll();
});

$('openReforma').addEventListener('click',()=>{
  if(!state.selected)return;
  const i=state.portfolio.findIndex(x=>x.cnpj===state.selected);
  if(i<0)return;
  state.portfolio[i].reformaStartedAt=new Date().toISOString();
  const entry=hydrate(state.portfolio[i]);
  try{
    sessionStorage.setItem('empresa360.selected',JSON.stringify({
      cnpj:entry.cnpj,
      company:entry.data,
      triage:entry.triage,
      source:'empresa-360-cockpit',
      openedAt:new Date().toISOString()
    }));
  }catch(_){}
  save();renderAll();
});

$('importBtn').addEventListener('click',()=>$('portfolioFile').click());
$('portfolioFile').addEventListener('change',async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  const text=await file.text();
  const matches=[...new Set((text.match(/\d[\d.\/-]{12,20}\d/g)||[]).map(onlyDigits).filter(x=>x.length===14&&validCnpj(x)))];
  if(!matches.length){showStatus('Não encontrei CNPJs válidos no arquivo.','error');e.target.value='';return}
  const batch=matches.slice(0,100);
  $('importBtn').disabled=true;
  let added=0,failed=0;
  for(let i=0;i<batch.length;i++){
    showStatus('Importando '+(i+1)+' de '+batch.length+' empresas...');
    try{
      const r=await addCompany(batch[i],{silent:true});
      if(r.added)added++;
    }catch(_){failed++}
  }
  renderAll();
  showStatus('Importação concluída: '+added+' adicionadas'+(failed?', '+failed+' não consultadas':'')+'.','success');
  $('importBtn').disabled=false;
  e.target.value='';
});

load();
renderAll();
