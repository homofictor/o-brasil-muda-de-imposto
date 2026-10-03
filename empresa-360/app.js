const state={company:null,sector:null,context:null,diagnostic:null};

const $=id=>document.getElementById(id);
const form=$('cnpjForm');
const input=$('cnpj');
const statusEl=$('status');
const workspace=$('workspace');
const diagnostic=$('diagnostic');
const contextForm=$('contextForm');
const btn=$('analisarBtn');

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
function showStatus(msg,type=''){
  statusEl.textContent=msg;
  statusEl.className='status '+type;
}
function money(v){
  const n=Number(v||0);
  return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
}
function value(v){return v===null||v===undefined||v===''?'Não informado':String(v)}
function yesNo(v){return v===true?'Sim':v===false?'Não':'Não informado'}
function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,Math.round(n)))}
function field(label,val){return '<div><dt>'+label+'</dt><dd>'+val+'</dd></div>'}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

const sectors={
  agriculture:{name:'Agropecuária',base:68,insight:'Operações com cadeias longas, insumos e regimes específicos exigem atenção especial à apropriação de créditos e à transição tributária.'},
  extractive:{name:'Indústria extrativa',base:78,insight:'Atividade intensiva em ativos, insumos e cadeias B2B. Créditos, investimentos e fluxo financeiro tendem a ser temas materiais.'},
  industry:{name:'Indústria',base:82,insight:'Perfil industrial normalmente torna créditos, cadeia de fornecedores, formação de preços e investimentos centrais na transição para IBS e CBS.'},
  utilities:{name:'Energia e utilidades',base:80,insight:'Setor com forte intensidade de capital e regras próprias. A análise precisa separar efeitos tributários, investimentos e repasse de preços.'},
  construction:{name:'Construção',base:84,insight:'Construção combina contratos longos, insumos relevantes e particularidades setoriais. A transição tributária pode afetar margem, preço e caixa.'},
  wholesale:{name:'Comércio atacadista',base:78,insight:'Negócios B2B e alta circulação de mercadorias tornam crédito tributário, cadeia de fornecedores e capital de giro especialmente relevantes.'},
  retail:{name:'Comércio varejista',base:76,insight:'No varejo, preço final, concorrência e composição das compras são determinantes para medir o efeito econômico da reforma.'},
  transport:{name:'Transporte e logística',base:76,insight:'Combustíveis, ativos, operações interestaduais e contratos podem tornar o impacto tributário e financeiro relevante.'},
  hospitality:{name:'Hospedagem e alimentação',base:74,insight:'Negócio geralmente exposto a consumidor final, custos operacionais e sensibilidade de preço. Margem e repasse merecem atenção.'},
  tech:{name:'Tecnologia e informação',base:66,insight:'Empresas de tecnologia podem ter baixa intensidade de insumos e alta folha, alterando a dinâmica de créditos e margem no novo sistema.'},
  finance:{name:'Financeiro e seguros',base:55,insight:'O setor possui tratamento específico e exige cautela antes de aplicar regras genéricas de consumo e crédito tributário.'},
  realestate:{name:'Imobiliário',base:78,insight:'Operações imobiliárias possuem regras próprias e ciclos longos. É importante avaliar a transição por operação e modelo de negócio.'},
  professional:{name:'Serviços profissionais',base:72,insight:'Serviços intensivos em folha e com poucos insumos podem ter dinâmica de créditos diferente da indústria e do comércio.'},
  admin:{name:'Serviços administrativos',base:70,insight:'Estrutura de mão de obra, contratos e perfil dos clientes ajudam a determinar o efeito sobre preço e margem.'},
  education:{name:'Educação',base:68,insight:'Setor com tratamento específico e alta participação de mão de obra. A análise deve considerar benefícios aplicáveis e capacidade de repasse.'},
  health:{name:'Saúde',base:72,insight:'O setor possui reduções e particularidades. Mix de serviços, insumos e contratos deve ser analisado antes de estimar impacto.'},
  arts:{name:'Cultura e entretenimento',base:68,insight:'Receitas ao consumidor final e estrutura de custos tornam preço, benefício setorial e margem pontos importantes.'},
  services:{name:'Serviços',base:70,insight:'Em serviços, intensidade de folha, poucos créditos e capacidade de repassar preços costumam ser variáveis decisivas.'}
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
function revenueMid(v){
  const map={360000:180000,2400000:2580000,12400000:12400000,60000000:60000000,150000000:150000000};
  return map[Number(v)]||0;
}
function regimeInfo(c){
  const r=c.regime_tributario_recente;
  if(c.opcao_pelo_simples===true)return {name:'Simples Nacional',year:null,simple:true};
  if(r&&r.forma_de_tributacao)return {name:r.forma_de_tributacao,year:r.ano||null,simple:false};
  return {name:'Não confirmado',year:null,simple:false};
}
function customerLabel(v){return {b2b:'predominantemente B2B',b2c:'predominantemente consumidor final',gov:'com presença relevante do setor público',mixed:'com carteira mista'}[v]||v}
function supplierLabel(v){return {regular:'predominantemente em regime regular',simples:'predominantemente no Simples Nacional',imports:'com importações relevantes',mixed:'com composição mista ou ainda não detalhada'}[v]||v}
function pricingLabel(v){return {high:'boa flexibilidade de reajuste',medium:'reajuste dependente de negociação',low:'baixa flexibilidade de reajuste'}[v]||v}
function investmentLabel(v){return {none:'sem investimento relevante previsto',moderate:'com investimentos moderados previstos',high:'com investimentos relevantes previstos'}[v]||v}

function renderCompany(c,cnpj){
  state.company=c;
  state.sector=sectorFromCnae(c.cnae_fiscal);
  const regime=regimeInfo(c);

  $('companyName').textContent=c.razao_social||c.nome_fantasia||'Empresa identificada';
  $('companySubtitle').textContent=[c.nome_fantasia,c.municipio&&c.uf?c.municipio+' / '+c.uf:null].filter(Boolean).join(' · ');
  $('sectorBadge').textContent=state.sector.name;

  const regimeText=regime.year?regime.name+' · dado disponível de '+regime.year:regime.name;
  $('companyData').innerHTML=[
    field('CNPJ',maskCnpj(cnpj)),
    field('Situação',value(c.descricao_situacao_cadastral)),
    field('Setor inferido',state.sector.name),
    field('Regime disponível',regimeText),
    field('CNAE principal',value(c.cnae_fiscal_descricao)),
    field('Porte cadastral',value(c.porte)),
    field('Início da atividade',value(c.data_inicio_atividade)),
    field('Matriz / filial',value(c.descricao_identificador_matriz_filial))
  ].join('');

  $('profileInsight').innerHTML='<b>Leitura setorial inicial.</b> '+esc(state.sector.insight);
  adaptQuestions(state.sector);

  workspace.classList.remove('hidden');
  diagnostic.classList.add('hidden');
  workspace.scrollIntoView({behavior:'smooth',block:'start'});
  try{sessionStorage.setItem('empresa360.company',JSON.stringify({cnpj:onlyDigits(cnpj),data:c}))}catch(_){}
}

function adaptQuestions(sector){
  const cq=$('customerQuestion');
  const iq=$('investmentQuestion');
  if(sector===sectors.retail||sector===sectors.hospitality){
    cq.textContent='Quanto das vendas vai para consumidor final?';
  }else if(sector===sectors.wholesale||sector===sectors.industry){
    cq.textContent='Sua receita é principalmente B2B ou consumidor final?';
  }else{
    cq.textContent='Principal perfil de clientes';
  }
  if([sectors.industry,sectors.construction,sectors.utilities,sectors.transport].includes(sector)){
    iq.textContent='Há expansão, máquinas ou investimentos relevantes em 24 meses?';
  }else{
    iq.textContent='Investimentos relevantes nos próximos 24 meses?';
  }
}

async function lookup(cnpj){
  btn.disabled=true; btn.textContent='Mapeando...';
  showStatus('Consultando dados cadastrais e classificando o perfil da empresa...');
  try{
    const res=await fetch('/api/empresa360-cnpj?cnpj='+encodeURIComponent(cnpj),{headers:{Accept:'application/json'}});
    const payload=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(payload.error||'Não foi possível consultar este CNPJ.');
    renderCompany(payload.data,cnpj);
    showStatus('Empresa localizada. Complete o contexto para gerar o radar.','success');
  }catch(err){
    showStatus(err.message||'Falha na consulta. Tente novamente.','error');
  }finally{
    btn.disabled=false; btn.textContent='Mapear empresa';
  }
}

function collectContext(){
  return {
    revenueBand:$('revenueBand').value,
    revenue:revenueMid($('revenueBand').value),
    customer:$('customerProfile').value,
    purchase:Number($('purchaseIntensity').value||0),
    supplier:$('supplierProfile').value,
    pricing:$('pricingPower').value,
    investment:$('investmentLevel').value,
    margin:Number($('marginBand').value||0),
    interstate:Number($('interstateShare').value||0)
  };
}

function buildDiagnostic(c,ctx){
  const s=state.sector;
  const regime=regimeInfo(c);
  const isIndustry=[sectors.industry,sectors.extractive,sectors.utilities,sectors.construction,sectors.wholesale,sectors.retail,sectors.transport].includes(s);
  const isService=[sectors.professional,sectors.admin,sectors.tech,sectors.education,sectors.health,sectors.services].includes(s);
  const customerImpact=ctx.customer==='b2c'?14:ctx.customer==='mixed'?9:ctx.customer==='gov'?10:6;
  const lowPricing=ctx.pricing==='low'?18:ctx.pricing==='medium'?10:2;
  const highPurchase=ctx.purchase>=60?18:ctx.purchase>=35?10:3;
  const supplierCredit=ctx.supplier==='regular'?14:ctx.supplier==='imports'?17:ctx.supplier==='simples'?4:8;
  const investmentImpact=ctx.investment==='high'?16:ctx.investment==='moderate'?8:1;
  const interstateImpact=ctx.interstate>=60?10:ctx.interstate>=30?6:1;
  const marginPressure=ctx.margin>0&&ctx.margin<=8?12:ctx.margin>0&&ctx.margin<=15?6:2;
  const simpleComplexity=regime.simple?16:0;
  const serviceCreditPenalty=isService?8:0;

  const scores={
    reform:clamp(s.base+customerImpact/2+highPurchase/3+interstateImpact/2+simpleComplexity/2),
    pricing:clamp(38+customerImpact+lowPricing+marginPressure+(s===sectors.retail||s===sectors.hospitality?9:0)),
    credits:clamp(30+highPurchase+supplierCredit+(isIndustry?12:0)-serviceCreditPenalty+(regime.simple?8:0)),
    cash:clamp(34+highPurchase/2+investmentImpact+(ctx.customer==='gov'?12:ctx.customer==='b2b'?7:4)+lowPricing/2+(s===sectors.construction?12:0)),
    regime:clamp(42+simpleComplexity+(regime.year&&regime.year<2026?12:5)+(isService?8:4)),
    financial:clamp(34+investmentImpact+(ctx.revenue>=20000000?10:ctx.revenue>=4800000?6:3)+(ctx.margin>0&&ctx.margin<=8?12:4))
  };

  const completeAdvanced=(ctx.margin?1:0)+(ctx.interstate?1:0);
  let confidence=68+completeAdvanced*6+(c.cnae_fiscal?4:0)+(regime.name!=='Não confirmado'?4:0);
  confidence=clamp(confidence,0,88);

  const meta={
    reform:{
      label:'Reforma Tributária',
      why:regime.simple
        ?'O enquadramento no Simples e a relação com clientes e fornecedores tornam a escolha de tratamento do IBS/CBS um tema estratégico.'
        :'Setor, regime, perfil de clientes e intensidade de compras indicam que a transição para IBS/CBS merece simulação específica.',
      next:'Simular carga, créditos, preço e margem no Reforma 360.'
    },
    pricing:{
      label:'Precificação e margem',
      why:ctx.pricing==='low'
        ?'A empresa informou baixa flexibilidade para reajustar preços, o que aumenta a importância de medir qualquer variação de carga ou crédito.'
        :'O impacto tributário deve ser traduzido em preço e margem antes de qualquer decisão comercial.',
      next:'Testar cenários de manter preço, manter margem e compartilhar impacto.'
    },
    credits:{
      label:'Créditos de IBS/CBS',
      why:ctx.purchase>=60
        ?'Compras e insumos representam parcela elevada da receita, tornando o mecanismo de créditos economicamente relevante.'
        :'O perfil de fornecedores e a estrutura de compras justificam mapear a capacidade efetiva de apropriação de créditos.',
      next:'Detalhar compras, fornecedores e despesas elegíveis a crédito.'
    },
    cash:{
      label:'Caixa e capital de giro',
      why:ctx.investment==='high'
        ?'Investimentos relevantes e a dinâmica tributária podem alterar desembolsos, créditos e necessidade de caixa ao longo da transição.'
        :'O perfil operacional sinaliza que o efeito financeiro não deve ser analisado apenas pela alíquota nominal.',
      next:'Incluir BP, DRE e ciclo financeiro para quantificar a pressão de caixa.'
    },
    regime:{
      label:'Regime e enquadramento',
      why:regime.year&&regime.year<2026
        ?'O regime disponível na fonte pública é histórico e precisa ser confirmado antes de qualquer conclusão tributária.'
        :'Regime, porte e atividade devem ser confrontados com os cenários da transição.',
      next:'Confirmar regime atual e comparar os cenários permitidos para a empresa.'
    },
    financial:{
      label:'Capacidade financeira',
      why:'Sem BP e DRE não é possível avaliar liquidez, endividamento, cobertura financeira e capacidade de investimento com confiança.',
      next:'Adicionar BP e DRE para calcular os indicadores financeiros.'
    }
  };

  const ranked=Object.entries(scores).map(([key,score])=>({key,score,...meta[key]})).sort((a,b)=>b.score-a.score);
  const evidences=[
    'CNAE principal classificado como '+s.name+'.',
    'Regime disponível: '+regime.name+(regime.year?' ('+regime.year+')':'')+'.',
    'Perfil comercial informado como '+customerLabel(ctx.customer)+'.',
    'Compras e insumos estimados em faixa equivalente a cerca de '+ctx.purchase+'% da receita.',
    'Fornecedores '+supplierLabel(ctx.supplier)+'.',
    'Empresa declarou '+pricingLabel(ctx.pricing)+' e '+investmentLabel(ctx.investment)+'.'
  ];
  if(ctx.interstate)evidences.push('Vendas interestaduais informadas como economicamente '+(ctx.interstate>=60?'muito relevantes':ctx.interstate>=30?'relevantes':'pouco relevantes')+'.');
  if(ctx.margin)evidences.push('Margem operacional informada em faixa de aproximadamente '+ctx.margin+'% para fins indicativos.');

  const gaps=[
    {title:'BP e DRE',text:'Necessários para liquidez, endividamento, EBITDA, cobertura financeira e capital de giro.'},
    {title:'Compras e documentos fiscais',text:'Necessários para confirmar quais créditos de IBS/CBS são efetivamente aproveitáveis.'},
    {title:'Composição da receita',text:'Produtos, serviços, benefícios e destinos podem alterar significativamente o resultado tributário.'}
  ];
  if(regime.year&&regime.year<2026)gaps.unshift({title:'Regime tributário atual',text:'A fonte consultada informa '+regime.name+' em '+regime.year+'. O enquadramento de 2026 precisa ser confirmado.'});

  return {scores,ranked,confidence,evidences,gaps,regime};
}

function scoreLevel(score){
  if(score>=80)return 'Muito alta';
  if(score>=65)return 'Alta';
  if(score>=50)return 'Relevante';
  if(score>=35)return 'Moderada';
  return 'Baixa';
}
function renderDiagnostic(result,ctx){
  state.diagnostic=result;
  const top=result.ranked[0];
  $('topPriority').textContent=top.label;
  $('topPriorityReason').textContent=top.why;
  $('confidenceValue').textContent=result.confidence+'%';
  $('onePointValue').textContent=money(ctx.revenue/100);
  $('economicBase').textContent=money(ctx.revenue);
  $('diagnosticIntro').textContent='O radar encontrou '+result.ranked.filter(x=>x.score>=65).length+' frentes de alta relevância para aprofundamento. A prioridade é definida por regras, não por opinião da IA.';

  $('radarRows').innerHTML=result.ranked.map(item=>`
    <div class="score-row">
      <div class="score-head"><b>${esc(item.label)}</b><span>${item.score}/100</span></div>
      <div class="score-track"><div class="score-fill" style="width:${item.score}%"></div></div>
      <div class="score-meta"><span>${scoreLevel(item.score)}</span><span>índice de relevância</span></div>
    </div>`).join('');

  $('priorityCards').innerHTML=result.ranked.slice(0,3).map((item,i)=>`
    <article class="priority-item">
      <div class="priority-top"><span class="priority-rank">0${i+1}</span><span class="priority-score">${item.score}/100</span></div>
      <h4>${esc(item.label)}</h4>
      <p>${esc(item.why)}</p>
      <span class="priority-next">Próxima ação: ${esc(item.next)}</span>
    </article>`).join('');

  $('evidenceList').innerHTML=result.evidences.map(e=>'<li>'+esc(e)+'</li>').join('');
  $('gapList').innerHTML=result.gaps.map((g,i)=>`
    <div class="gap"><span class="gap-icon">${i+1}</span><div><b>${esc(g.title)}</b><small>${esc(g.text)}</small></div></div>`).join('');

  $('actionTitle').textContent='Quantifique a frente tributária no Reforma 360';
  $('actionText').textContent='O radar já definiu onde a Reforma Tributária cruza com preço, créditos e caixa. O próximo passo disponível é transformar esse contexto em cenários numéricos no espelho do simulador.';
  try{
    sessionStorage.setItem('empresa360.handoff',JSON.stringify({
      company:state.company,sector:state.sector.name,context:ctx,diagnostic:result,createdAt:new Date().toISOString()
    }));
  }catch(_){}

  diagnostic.classList.remove('hidden');
  diagnostic.scrollIntoView({behavior:'smooth',block:'start'});
}

input.addEventListener('input',()=>{input.value=maskCnpj(input.value);showStatus('')});
form.addEventListener('submit',e=>{
  e.preventDefault();
  const cnpj=onlyDigits(input.value);
  if(!validCnpj(cnpj)){showStatus('Informe um CNPJ válido com 14 dígitos.','error');input.focus();return}
  lookup(cnpj);
});

contextForm.addEventListener('submit',e=>{
  e.preventDefault();
  if(!state.company)return;
  const ctx=collectContext();
  const required=[ctx.revenueBand,ctx.customer,ctx.purchase,ctx.supplier,ctx.pricing,ctx.investment];
  if(required.some(v=>v===''||v===0)){return}
  state.context=ctx;
  const result=buildDiagnostic(state.company,ctx);
  renderDiagnostic(result,ctx);
});

$('showAdvanced').addEventListener('click',()=>{
  $('advancedFields').classList.toggle('hidden');
  $('showAdvanced').textContent=$('advancedFields').classList.contains('hidden')
    ?'+ adicionar dois dados para aumentar a precisão'
    :'− ocultar dados adicionais';
});

$('novaConsulta').addEventListener('click',()=>{
  state.company=null;state.context=null;state.diagnostic=null;
  workspace.classList.add('hidden');diagnostic.classList.add('hidden');
  contextForm.reset();input.value='';showStatus('');
  try{sessionStorage.removeItem('empresa360.company');sessionStorage.removeItem('empresa360.handoff')}catch(_){}
  window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>input.focus(),300);
});

$('editContext').addEventListener('click',()=>{
  workspace.scrollIntoView({behavior:'smooth',block:'start'});
});

try{
  const cached=JSON.parse(sessionStorage.getItem('empresa360.company')||'null');
  if(cached&&cached.cnpj&&cached.data){
    input.value=maskCnpj(cached.cnpj);
    renderCompany(cached.data,cached.cnpj);
    showStatus('Empresa recuperada nesta sessão. Revise o contexto e gere o radar.','success');
  }
}catch(_){}
