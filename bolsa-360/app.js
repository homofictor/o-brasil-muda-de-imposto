const state={universe:null,selected:new Set(),sectorData:[],assetMap:new Map()};

const $=id=>document.getElementById(id);
const sectorNames={
  'Finance':'Financeiro',
  'Utilities':'Utilidades e energia',
  'Energy Minerals':'Petróleo e energia',
  'Non-Energy Minerals':'Mineração e materiais',
  'Retail Trade':'Varejo',
  'Technology Services':'Tecnologia e software',
  'Electronic Technology':'Tecnologia e eletrônicos',
  'Consumer Non-Durables':'Consumo não durável',
  'Consumer Durables':'Consumo durável',
  'Consumer Services':'Serviços ao consumidor',
  'Commercial Services':'Serviços empresariais',
  'Distribution Services':'Distribuição e atacado',
  'Transportation':'Transportes',
  'Process Industries':'Indústrias de processo',
  'Producer Manufacturing':'Indústria e manufatura',
  'Industrial Services':'Serviços industriais',
  'Health Services':'Serviços de saúde',
  'Health Technology':'Saúde e biotecnologia',
  'Communications':'Comunicações',
  'Miscellaneous':'Outros'
};

function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function n(v){const x=Number(v);return Number.isFinite(x)?x:null}
function money(v){
  const x=n(v); if(x===null)return 'N/D';
  return x.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2});
}
function compactMoney(v){
  const x=n(v);if(x===null)return 'N/D';
  return new Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:1}).format(x);
}
function mult(v){
  const x=n(v);if(x===null)return 'N/D';
  return x.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'x';
}
function pct(v,scale=100){
  const x=n(v);if(x===null)return 'N/D';
  return (x*scale).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})+'%';
}
function scoreClass(v){return v>=70?'high':v>=45?'mid':'low'}
function sectorPt(s){return sectorNames[s]||s||'Não classificado'}
function formatDate(v){
  if(!v)return '—';
  const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('pt-BR');
}

async function api(url){
  const r=await fetch(url,{headers:{Accept:'application/json'}});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||'Falha ao consultar dados.');
  return data;
}

async function loadUniverse(){
  try{
    const data=await api('/api/bolsa360?op=universe');
    state.universe=data;
    const counts=new Map();
    for(const s of data.stocks||[]){
      if(!s.sector)continue;
      counts.set(s.sector,(counts.get(s.sector)||0)+1);
    }
    const sectors=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
    $('sectorGrid').innerHTML=sectors.map(([sector,count],i)=>`
      <div class="sector-option">
        <input type="checkbox" id="sector-${i}" value="${esc(sector)}">
        <label for="sector-${i}">
          <b>${esc(sectorPt(sector))}</b>
          <small>${count} ativo${count===1?'':'s'} no universo do provedor</small>
        </label>
      </div>`).join('');
    $('universeStatus').textContent=(data.stocks?.length||0)+' ativos carregados. Selecione até 5 setores para comparar.';
  }catch(e){
    $('universeStatus').textContent='Não foi possível carregar o universo: '+e.message;
  }
}

$('sectorGrid').addEventListener('change',e=>{
  if(e.target.type!=='checkbox')return;
  if(e.target.checked){
    if(state.selected.size>=5){
      e.target.checked=false;
      return;
    }
    state.selected.add(e.target.value);
  }else state.selected.delete(e.target.value);
  $('runScreen').disabled=state.selected.size===0;
});
$('clearSectors').addEventListener('click',()=>{
  state.selected.clear();
  document.querySelectorAll('#sectorGrid input[type=checkbox]').forEach(x=>x.checked=false);
  $('runScreen').disabled=true;
});

function metricValue(row,key){
  const f=row.fundamentals||{};
  return {
    pe:f.trailingPE,
    pb:f.priceToBook,
    evEbitda:f.enterpriseToEbitda,
    fcfYield:f.fcfYield,
    roe:f.returnOnEquity,
    roa:f.returnOnAssets,
    ebitdaMargin:f.ebitdaMargins,
    profitMargin:f.profitMargins,
    dy:f.dividendYield,
    netDebtEbitda:f.netDebtToEbitda
  }[key];
}
function validMetric(key,v){
  const x=n(v);if(x===null)return false;
  if(['pe','pb','evEbitda'].includes(key))return x>0;
  return true;
}
function percentile(rows,key,direction){
  const vals=rows.map(r=>n(metricValue(r,key))).filter(v=>validMetric(key,v)).sort((a,b)=>a-b);
  const out=new Map();
  if(!vals.length)return out;
  for(const r of rows){
    const v=n(metricValue(r,key));
    if(!validMetric(key,v))continue;
    let lower=vals.filter(x=>x<v).length;
    let equal=vals.filter(x=>x===v).length;
    const rank=lower+(equal-1)/2;
    let s=vals.length===1?50:(rank/(vals.length-1))*100;
    if(direction==='lower')s=100-s;
    out.set(r.ticker,Math.round(s));
  }
  return out;
}
function weightedScore(rows,defs,minMetrics=2){
  const maps=defs.map(d=>({d,map:percentile(rows,d.key,d.dir)}));
  const out=new Map();
  for(const r of rows){
    let total=0,weight=0,count=0;
    for(const {d,map} of maps){
      if(!map.has(r.ticker))continue;
      total+=map.get(r.ticker)*d.w;weight+=d.w;count++;
    }
    out.set(r.ticker,count>=minMetrics&&weight?Math.round(total/weight):null);
  }
  return out;
}
function scoreSector(block){
  const rows=block.stocks||[];
  const isFinance=block.sector==='Finance';
  const fundamentalReady=rows.filter(r=>{
    const f=r.fundamentals||{};
    const candidates=isFinance?[f.trailingPE,f.priceToBook,f.dividendYield]:[f.trailingPE,f.priceToBook,f.enterpriseToEbitda,f.fcfYield];
    return candidates.filter(x=>validMetric('pe',x)||n(x)!==null).length>=2;
  }).length;
  if(fundamentalReady<3)return rows.map(r=>({...r,valuationScore:null,qualityScore:null,targetUpside:(n(r.fundamentals?.targetMeanPrice)!==null&&n(r.close)>0)?n(r.fundamentals.targetMeanPrice)/n(r.close)-1:null}));
  const valuationDefs=isFinance
    ?[{key:'pe',dir:'lower',w:.45},{key:'pb',dir:'lower',w:.4},{key:'dy',dir:'higher',w:.15}]
    :[{key:'pe',dir:'lower',w:.25},{key:'pb',dir:'lower',w:.15},{key:'evEbitda',dir:'lower',w:.35},{key:'fcfYield',dir:'higher',w:.25}];
  const qualityDefs=isFinance
    ?[{key:'roe',dir:'higher',w:.7},{key:'profitMargin',dir:'higher',w:.3}]
    :[{key:'roe',dir:'higher',w:.25},{key:'roa',dir:'higher',w:.15},{key:'ebitdaMargin',dir:'higher',w:.35},{key:'profitMargin',dir:'higher',w:.25}];

  const valuation=weightedScore(rows,valuationDefs,isFinance?2:2);
  const quality=weightedScore(rows,qualityDefs,1);

  return rows.map(r=>{
    const f=r.fundamentals||{};
    const target=n(f.targetMeanPrice),close=n(r.close);
    return {
      ...r,
      valuationScore:valuation.get(r.ticker)??null,
      qualityScore:quality.get(r.ticker)??null,
      targetUpside:target!==null&&close&&close>0?(target/close)-1:null
    };
  });
}
function sortRows(rows){
  const mode=$('sortBy').value;
  const copy=[...rows];
  const v=(r,key)=>n(r[key])??-Infinity;
  if(mode==='valuation')return copy.sort((a,b)=>v(b,'valuationScore')-v(a,'valuationScore'));
  if(mode==='quality')return copy.sort((a,b)=>v(b,'qualityScore')-v(a,'qualityScore'));
  if(mode==='priceAsc')return copy.sort((a,b)=>(n(a.close)??Infinity)-(n(b.close)??Infinity));
  if(mode==='dy')return copy.sort((a,b)=>(n(b.fundamentals?.dividendYield)??-Infinity)-(n(a.fundamentals?.dividendYield)??-Infinity));
  if(mode==='roe')return copy.sort((a,b)=>(n(b.fundamentals?.returnOnEquity)??-Infinity)-(n(a.fundamentals?.returnOnEquity)??-Infinity));
  if(mode==='evEbitda')return copy.sort((a,b)=>(n(a.fundamentals?.enterpriseToEbitda)??Infinity)-(n(b.fundamentals?.enterpriseToEbitda)??Infinity));
  return copy;
}

function scoreBadge(v){
  return v===null?'<span class="na">N/D</span>':'<span class="score '+scoreClass(v)+'">'+v+'</span>';
}
function renderSector(block){
  const rows=sortRows(block.scored||[]);
  const coverage=block.fundamentalsCoverage||0;
  return `
    <section class="sector-block">
      <div class="sector-block-head">
        <div><h3>${esc(sectorPt(block.sector))}</h3><small>${block.total} ativos · ${coverage} com fundamentos disponíveis nesta sessão</small></div>
        <small>Fonte de mercado: brapi</small>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Ativo</th><th>Fechamento</th><th>P/L</th><th>P/VP</th><th>EV/EBITDA</th><th>ROE</th><th>DY</th><th>Valuation 360</th><th>Qualidade</th><th>Consenso</th>
          </tr></thead>
          <tbody>
            ${rows.map(r=>{
              const f=r.fundamentals||{};
              return `<tr>
                <td><button class="asset-btn" data-ticker="${esc(r.ticker)}">${esc(r.ticker)}</button><small>Vol. ${compactMoney(r.volume)}</small></td>
                <td><strong>${money(r.close)}</strong><small>${n(r.change)!==null?(n(r.change)>=0?'+':'')+n(r.change).toFixed(2)+'%':'N/D'}</small></td>
                <td>${mult(f.trailingPE)}</td>
                <td>${mult(f.priceToBook)}</td>
                <td>${mult(f.enterpriseToEbitda)}</td>
                <td>${pct(f.returnOnEquity)}</td>
                <td>${pct(f.dividendYield)}</td>
                <td>${scoreBadge(r.valuationScore)}</td>
                <td>${scoreBadge(r.qualityScore)}</td>
                <td><strong>${money(f.targetMeanPrice)}</strong><small>${r.targetUpside===null?'N/D':pct(r.targetUpside)}</small></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}
function renderResults(){
  state.assetMap.clear();
  for(const b of state.sectorData){
    for(const r of b.scored||[])state.assetMap.set(r.ticker,{...r,sector:b.sector});
  }
  $('sectorResults').innerHTML=state.sectorData.map(renderSector).join('');
  const total=state.sectorData.reduce((a,b)=>a+(b.total||0),0);
  const coverage=state.sectorData.reduce((a,b)=>a+(b.fundamentalsCoverage||0),0);
  $('summarySectors').textContent=state.sectorData.length;
  $('summaryStocks').textContent=total;
  $('summaryCoverage').textContent=coverage;
  const first=state.sectorData.find(x=>x.requestedAt);
  $('summaryDate').textContent=formatDate(first?.requestedAt);

  const publicDemo=state.sectorData.some(x=>x.authMode==='public-demo');
  $('dataWarning').classList.toggle('hidden',!publicDemo);
  if(publicDemo){
    $('dataWarning').innerHTML='<b>Modo público de desenvolvimento.</b> O universo, setores, fechamento e volume funcionam sem chave. A brapi libera fundamentos sem autenticação apenas para PETR4, VALE3, ITUB4 e MGLU3. O motor já aceita <code>BRAPI_API_KEY</code> no servidor para ampliar a cobertura sem expor a chave ao navegador.';
  }
  $('resultsSection').classList.remove('hidden');
}
async function runScreen(){
  if(!state.selected.size)return;
  $('runScreen').disabled=true;
  $('runScreen').textContent='Analisando...';
  $('universeStatus').textContent='Buscando preços e fundamentos dos setores selecionados...';
  try{
    const blocks=await Promise.all([...state.selected].map(sector=>
      api('/api/bolsa360?op=sector&sector='+encodeURIComponent(sector)+'&limit=20')
    ));
    state.sectorData=blocks.map(b=>({...b,scored:scoreSector(b)}));
    renderResults();
    $('universeStatus').textContent='Análise concluída. O ranking é recalculado dentro de cada setor.';
    $('resultsSection').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    $('universeStatus').textContent='Falha na análise: '+e.message;
  }finally{
    $('runScreen').disabled=false;
    $('runScreen').textContent='Analisar setores selecionados';
  }
}
$('runScreen').addEventListener('click',runScreen);
$('sortBy').addEventListener('change',renderResults);

$('sectorResults').addEventListener('click',e=>{
  const btn=e.target.closest('[data-ticker]');
  if(!btn)return;
  const asset=state.assetMap.get(btn.dataset.ticker);
  if(asset)openDrawer(asset);
});
function drawerMetric(label,value){
  return '<div class="drawer-metric"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong></div>';
}
function openDrawer(a){
  const f=a.fundamentals||{};
  $('drawerBody').innerHTML=`
    <div class="drawer-title">
      <p class="eyebrow">${esc(sectorPt(a.sector))}</p>
      <h2>${esc(a.ticker)}</h2>
      <p class="muted">Comparação fundamentalista preliminar dentro do setor.</p>
    </div>
    <div class="drawer-price">
      <div><span>Último fechamento</span><strong>${money(a.close)}</strong></div>
      <div><span>Consenso de analistas</span><strong>${money(f.targetMeanPrice)}</strong></div>
    </div>
    <div class="drawer-grid">
      ${drawerMetric('Valuation 360',a.valuationScore===null?'N/D':a.valuationScore+'/100')}
      ${drawerMetric('Qualidade',a.qualityScore===null?'N/D':a.qualityScore+'/100')}
      ${drawerMetric('P/L',mult(f.trailingPE))}
      ${drawerMetric('P/VP',mult(f.priceToBook))}
      ${drawerMetric('EV/EBITDA',mult(f.enterpriseToEbitda))}
      ${drawerMetric('FCF Yield',pct(f.fcfYield))}
      ${drawerMetric('ROE',pct(f.returnOnEquity))}
      ${drawerMetric('Margem EBITDA',pct(f.ebitdaMargins))}
      ${drawerMetric('Dívida líquida/EBITDA',mult(f.netDebtToEbitda))}
      ${drawerMetric('Dividend Yield',pct(f.dividendYield))}
      ${drawerMetric('Preço-alvo mínimo',money(f.targetLowPrice))}
      ${drawerMetric('Preço-alvo máximo',money(f.targetHighPrice))}
    </div>
    <div class="drawer-note">Valuation 360 compara múltiplos e geração de caixa com pares do mesmo setor. Não representa recomendação de compra, venda ou manutenção. O preço-alvo exibido, quando disponível, é consenso externo de analistas e não o valor justo próprio do Bolsa 360.</div>
  `;
  $('drawerBackdrop').classList.remove('hidden');
  $('assetDrawer').classList.add('open');
  $('assetDrawer').setAttribute('aria-hidden','false');
}
function closeDrawer(){
  $('drawerBackdrop').classList.add('hidden');
  $('assetDrawer').classList.remove('open');
  $('assetDrawer').setAttribute('aria-hidden','true');
}
$('closeDrawer').addEventListener('click',closeDrawer);
$('drawerBackdrop').addEventListener('click',closeDrawer);

loadUniverse();