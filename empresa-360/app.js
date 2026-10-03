const form=document.getElementById('cnpjForm');
const input=document.getElementById('cnpj');
const statusEl=document.getElementById('status');
const section=document.getElementById('companySection');
const companyName=document.getElementById('companyName');
const companyTrade=document.getElementById('companyTrade');
const companyData=document.getElementById('companyData');
const btn=document.getElementById('analisarBtn');
const novaConsulta=document.getElementById('novaConsulta');

function onlyDigits(v){return String(v||'').replace(/\D/g,'').slice(0,14)}
function maskCnpj(v){
  const d=onlyDigits(v);
  return d
    .replace(/^(\d{2})(\d)/,'$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3')
    .replace(/\.(\d{3})(\d)/,'.$1/$2')
    .replace(/(\d{4})(\d)/,'$1-$2');
}
function validCnpj(cnpj){
  const c=onlyDigits(cnpj);
  if(c.length!==14||/^(\d)\1{13}$/.test(c))return false;
  const calc=(base,weights)=>{
    const sum=base.split('').reduce((acc,n,i)=>acc+Number(n)*weights[i],0);
    const r=sum%11;
    return r<2?0:11-r;
  };
  const d1=calc(c.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2]);
  const d2=calc(c.slice(0,12)+d1,[6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return c.endsWith(String(d1)+String(d2));
}
function showStatus(msg,type=''){
  statusEl.textContent=msg;
  statusEl.className='status '+type;
}
function money(v){
  if(v===null||v===undefined||v==='')return 'Não informado';
  const n=Number(v);
  return Number.isFinite(n)?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):String(v);
}
function yesNo(v){
  if(v===true)return 'Sim';
  if(v===false)return 'Não';
  return 'Não informado';
}
function value(v){
  return (v===null||v===undefined||v==='')?'Não informado':String(v);
}
function field(label,val){
  return '<div><dt>'+label+'</dt><dd>'+val+'</dd></div>';
}
function renderCompany(data,cnpj){
  companyName.textContent=data.razao_social||data.nome_fantasia||'Empresa identificada';
  companyTrade.textContent=data.nome_fantasia&&data.nome_fantasia!==data.razao_social?data.nome_fantasia:'';
  companyData.innerHTML=[
    field('CNPJ',maskCnpj(cnpj)),
    field('Situação cadastral',value(data.descricao_situacao_cadastral)),
    field('Início da atividade',value(data.data_inicio_atividade)),
    field('Matriz ou filial',value(data.descricao_identificador_matriz_filial)),
    field('Porte',value(data.porte)),
    field('Natureza jurídica',value(data.natureza_juridica)),
    field('CNAE principal',value(data.cnae_fiscal)+' '+value(data.cnae_fiscal_descricao)),
    field('Município / UF',value(data.municipio)+' / '+value(data.uf)),
    field('Simples Nacional',yesNo(data.opcao_pelo_simples)),
    field('MEI',yesNo(data.opcao_pelo_mei)),
    field('Capital social',money(data.capital_social)),
    field('CNAEs secundários',Array.isArray(data.cnaes_secundarios)?String(data.cnaes_secundarios.length):'Não informado')
  ].join('');
  section.classList.remove('hidden');
  section.scrollIntoView({behavior:'smooth',block:'start'});
  try{
    sessionStorage.setItem('empresa360.company',JSON.stringify({cnpj:onlyDigits(cnpj),data,consultedAt:new Date().toISOString()}));
  }catch(_){}
}
async function lookup(cnpj){
  btn.disabled=true;
  btn.textContent='Consultando...';
  showStatus('Consultando dados cadastrais...');
  try{
    const res=await fetch('/api/cnpj?cnpj='+encodeURIComponent(cnpj),{headers:{Accept:'application/json'}});
    const payload=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(payload.error||'Não foi possível consultar este CNPJ.');
    if(!payload.data)throw new Error('A consulta não retornou dados da empresa.');
    renderCompany(payload.data,cnpj);
    showStatus('Empresa localizada. O radar inicial foi preparado.','success');
  }catch(err){
    showStatus(err.message||'Falha na consulta. Tente novamente.','error');
    section.classList.add('hidden');
  }finally{
    btn.disabled=false;
    btn.textContent='Analisar empresa';
  }
}
input.addEventListener('input',()=>{input.value=maskCnpj(input.value);showStatus('')});
form.addEventListener('submit',e=>{
  e.preventDefault();
  const cnpj=onlyDigits(input.value);
  if(!validCnpj(cnpj)){
    showStatus('Informe um CNPJ válido com 14 dígitos.','error');
    input.focus();
    return;
  }
  lookup(cnpj);
});
novaConsulta.addEventListener('click',()=>{
  section.classList.add('hidden');
  input.value='';
  showStatus('');
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>input.focus(),350);
});
try{
  const cached=JSON.parse(sessionStorage.getItem('empresa360.company')||'null');
  if(cached&&cached.cnpj&&cached.data){
    input.value=maskCnpj(cached.cnpj);
    renderCompany(cached.data,cached.cnpj);
    showStatus('Consulta anterior recuperada nesta sessão.','success');
  }
}catch(_){}
