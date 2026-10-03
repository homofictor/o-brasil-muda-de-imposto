const state={universe:null,cvmBase:null,historyByCvm:{},selected:new Set(),sectorData:[],assetMap:new Map()};

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
    evEbit:f.enterpriseToEbit,
    cfoYield:f.cfoYield,
    roe:f.returnOnEquity,
    roa:f.returnOnAssets,
    ebitMargin:f.ebitMargin,
    profitMargin:f.profitMargin,
    debtEquity:f.debtToEquity,
    netDebtEbit:f.netDebtToEbit,
    currentRatio:f.currentRatio,
    gRevenue3:row.growth?.revenueCagr3,
    gRevenueLong:row.growth?.revenueCagrLong,
    gEbit3:row.growth?.ebitCagr3,
    gProfit3:row.growth?.profitCagr3,
    gMargin:row.growth?.ebitMarginDelta,
    gProfitYears:row.growth?.positiveProfitYears
  }[key];
}
function validMetric(key,v){
  const x=n(v);if(x===null)return false;
  if(['pe','pb','evEbit'].includes(key))return x>0;
  if(key==='currentRatio')return x>=0;
  return true;
}
function percentile(rows,key,direction){
  const vals=rows.map(r=>n(metricValue(r,key))).filter(v=>validMetric(key,v)).sort((a,b)=>a-b);
  const out=new Map();
  if(!vals.length)return out;
  for(const r of rows){
    const v=n(metricValue(r,key));
    if(!validMetric(key,v))continue;
    const lower=vals.filter(x=>x<v).length;
    const equal=vals.filter(x=>x===v).length;
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
  const isBank=block.isBank===true;
  const valuationDefs=isBank
    ?[{key:'pe',dir:'lower',w:.55},{key:'pb',dir:'lower',w:.45}]
    :[{key:'pe',dir:'lower',w:.30},{key:'pb',dir:'lower',w:.15},{key:'evEbit',dir:'lower',w:.30},{key:'cfoYield',dir:'higher',w:.25}];
  const qualityDefs=isBank
    ?[{key:'roe',dir:'higher',w:.75},{key:'profitMargin',dir:'higher',w:.25}]
    :[{key:'roe',dir:'higher',w:.30},{key:'roa',dir:'higher',w:.15},{key:'ebitMargin',dir:'higher',w:.30},{key:'profitMargin',dir:'higher',w:.25}];
  const solidityDefs=isBank?[]:[
    {key:'debtEquity',dir:'lower',w:.40},
    {key:'netDebtEbit',dir:'lower',w:.40},
    {key:'currentRatio',dir:'higher',w:.20}
  ];
  const growthDefs=isBank?[
    {key:'gRevenue3',dir:'higher',w:.30},
    {key:'gRevenueLong',dir:'higher',w:.15},
    {key:'gProfit3',dir:'higher',w:.35},
    {key:'gProfitYears',dir:'higher',w:.20}
  ]:[
    {key:'gRevenue3',dir:'higher',w:.25},
    {key:'gRevenueLong',dir:'higher',w:.15},
    {key:'gEbit3',dir:'higher',w:.20},
    {key:'gProfit3',dir:'higher',w:.20},
    {key:'gMargin',dir:'higher',w:.10},
    {key:'gProfitYears',dir:'higher',w:.10}
  ];

  const ready=rows.filter(r=>{
    const f=r.fundamentals||{};
    return [f.trailingPE,f.priceToBook,f.returnOnEquity].filter(x=>n(x)!==null).length>=2;
  }).length;
  if(ready<3)return rows.map(r=>({...r,valuationScore:null,qualityScore:null,solidityScore:null}));

  const valuation=weightedScore(rows,valuationDefs,isBank?2:2);
  const quality=weightedScore(rows,qualityDefs,1);
  const solidity=isBank?new Map():weightedScore(rows,solidityDefs,2);
  const growth=weightedScore(rows,growthDefs,3);

  return rows.map(r=>({
    ...r,
    valuationScore:valuation.get(r.ticker)??null,
    qualityScore:quality.get(r.ticker)??null,
    solidityScore:isBank?null:(solidity.get(r.ticker)??null),
    growthScore:growth.get(r.ticker)??null
  }));
}
function sortRows(rows){
  const mode=$('sortBy').value;
  const copy=[...rows];
  const v=(r,key)=>n(r[key])??-Infinity;
  if(mode==='valuation')return copy.sort((a,b)=>v(b,'valuationScore')-v(a,'valuationScore'));
  if(mode==='quality')return copy.sort((a,b)=>v(b,'qualityScore')-v(a,'qualityScore'));
  if(mode==='solidity')return copy.sort((a,b)=>v(b,'solidityScore')-v(a,'solidityScore'));
  if(mode==='growth')return copy.sort((a,b)=>v(b,'growthScore')-v(a,'growthScore'));
  if(mode==='priceAsc')return copy.sort((a,b)=>(n(a.close)??Infinity)-(n(b.close)??Infinity));
  if(mode==='roe')return copy.sort((a,b)=>(n(b.fundamentals?.returnOnEquity)??-Infinity)-(n(a.fundamentals?.returnOnEquity)??-Infinity));
  if(mode==='evEbit')return copy.sort((a,b)=>(n(a.fundamentals?.enterpriseToEbit)??Infinity)-(n(b.fundamentals?.enterpriseToEbit)??Infinity));
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
        <div><h3>${esc(block.label||sectorPt(block.sector))}</h3><small>${block.total} ativos · ${coverage} com fundamentos · TTM até ${formatDate(state.cvmBase?.latestItrReference)}</small></div>
        <small>Fonte de mercado: brapi</small>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>Ativo</th><th>Fechamento</th><th>P/L</th><th>P/VP</th><th>EV/EBIT</th><th>ROE</th><th>Margem EBIT</th><th>Dívida/PL</th><th>Valuation 360</th><th>Qualidade</th><th>Solidez</th><th>Crescimento</th>
          </tr></thead>
          <tbody>
            ${rows.map(r=>{
              const f=r.fundamentals||{};
              return `<tr>
                <td><button class="asset-btn" data-ticker="${esc(r.ticker)}">${esc(r.ticker)}</button><small>Vol. ${compactMoney(r.volume)}</small></td>
                <td><strong>${money(r.close)}</strong><small>${n(r.change)!==null?(n(r.change)>=0?'+':'')+n(r.change).toFixed(2)+'%':'N/D'}</small></td>
                <td>${mult(f.trailingPE)}</td>
                <td>${mult(f.priceToBook)}</td>
                <td>${mult(f.enterpriseToEbit)}</td>
                <td>${pct(f.returnOnEquity)}</td>
                <td>${pct(f.ebitMargin)}</td>
                <td>${mult(f.debtToEquity)}</td>
                <td>${scoreBadge(r.valuationScore)}</td>
                <td>${scoreBadge(r.qualityScore)}</td>
                <td>${scoreBadge(r.solidityScore)}</td>
                <td>${scoreBadge(r.growthScore)}</td>
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
    for(const r of b.scored||[])state.assetMap.set(r.ticker,{...r,sector:b.sector,peerLabel:b.label});
  }
  $('sectorResults').innerHTML=state.sectorData.map(renderSector).join('');
  const total=state.sectorData.reduce((a,b)=>a+(b.total||0),0);
  const coverage=state.sectorData.reduce((a,b)=>a+(b.fundamentalsCoverage||0),0);
  $('summarySectors').textContent=state.selected.size;
  $('summaryStocks').textContent=total;
  $('summaryCoverage').textContent=coverage;
  $('coverageNote').textContent=state.cvmBase?.ttmCovered?state.cvmBase.ttmCovered+' companhias com dados TTM no universo-base':'Cobertura disponível na base';
  $('summaryDate').textContent=formatDate(state.cvmBase?.latestItrReference);

  $('dataWarning').classList.remove('hidden');
  $('dataWarning').innerHTML='<b>Base TTM incorporada.</b> Balanço patrimonial usa a posição mais recente do ITR 2026. DRE e DFC usam TTM = DFP 2025 + acumulado de 2026 - período comparável de 2025. Referência mais recente da base: <b>'+formatDate(state.cvmBase?.latestItrReference)+'</b>.';
  $('resultsSection').classList.remove('hidden');
}
function cagr(start,end,years){
  const a=n(start),b=n(end);
  if(a===null||b===null||a<=0||b<=0||!years)return null;
  return Math.pow(b/a,1/years)-1;
}
function growthFromHistory(stock){
  const annual=[...(state.historyByCvm[String(stock.cvm)]||[])].sort((a,b)=>a.year-b.year);
  const ttm=stock.fundamentals||{};
  const history=[...annual];
  if(ttm.ttmAvailable)history.push({
    year:'TTM',
    revenue:ttm.revenue,ebit:ttm.ebit,netIncome:ttm.netIncome,
    ebitMargin:ttm.ebitMargin,profitMargin:ttm.profitMargin
  });
  const byYear=y=>annual.find(x=>x.year===y)||null;
  const y21=byYear(2021),y22=byYear(2022),y25=byYear(2025);
  const annualValid=annual.filter(x=>n(x.netIncome)!==null);
  return {
    history,
    revenueCagr3:y22&&y25?cagr(y22.revenue,y25.revenue,3):null,
    revenueCagrLong:y21&&y25?cagr(y21.revenue,y25.revenue,4):null,
    ebitCagr3:y22&&y25?cagr(y22.ebit,y25.ebit,3):null,
    profitCagr3:y22&&y25?cagr(y22.netIncome,y25.netIncome,3):null,
    ebitMarginDelta:y22&&y25&&n(y22.ebitMargin)!==null&&n(y25.ebitMargin)!==null?y25.ebitMargin-y22.ebitMargin:null,
    positiveProfitYears:annualValid.length?annualValid.filter(x=>n(x.netIncome)>0).length/annualValid.length:null,
    ttmVs2025:y25&&n(y25.revenue)>0&&n(ttm.revenue)!==null?ttm.revenue/y25.revenue-1:null
  };
}
async function loadHistoryFor(stocks){
  const missing=[...new Set(stocks.map(s=>String(s.cvm)).filter(c=>c&&!state.historyByCvm[c]))];
  for(let i=0;i<missing.length;i+=35){
    const chunk=missing.slice(i,i+35);
    const data=await api('/api/bolsa360-history?cvms='+encodeURIComponent(chunk.join(',')));
    Object.assign(state.historyByCvm,data.series||{});
  }
}
async function runScreen(){
  if(!state.selected.size)return;
  $('runScreen').disabled=true;
  $('runScreen').textContent='Analisando...';
  $('universeStatus').textContent='Cruzando preços do último pregão com demonstrações financeiras oficiais da CVM...';
  try{
    if(!state.cvmBase)state.cvmBase=await api('/api/bolsa360-cvm');
    const peerGroup=(row,sector)=>{
      const sub=String(row.subsector||'').toLowerCase();
      if(sector==='Finance'){
        if(sub.includes('banco')||sub.includes('crédito')||sub.includes('credito'))return {key:'finance:banks',label:'Bancos',isBank:true};
        if(sub.includes('segur')||sub.includes('ressegur'))return {key:'finance:insurance',label:'Seguros e resseguros',isBank:false};
        if(sub.includes('incorpora')||sub.includes('imóve')||sub.includes('imove')||sub.includes('shopping'))return {key:'finance:realestate',label:'Imobiliário',isBank:false};
        if(sub.includes('aluguel de carro'))return {key:'finance:rental',label:'Locação de veículos e ativos',isBank:false};
        if(sub.includes('dados financeiros')||sub.includes('bolsas')||sub.includes('gestão')||sub.includes('gestao')||sub.includes('títulos')||sub.includes('titulos'))return {key:'finance:services',label:'Serviços financeiros',isBank:false};
        return {key:'finance:other',label:'Financeiro, outros',isBank:false};
      }
      return {key:sector,label:sectorPt(sector),isBank:false};
    };
    const selectedStocks=(state.cvmBase.companies||[]).filter(x=>state.selected.has(x.sector));
    $('universeStatus').textContent='Carregando histórico de 2021 a 2025 para as companhias selecionadas...';
    await loadHistoryFor(selectedStocks);

    const groups=new Map();
    for(const sector of state.selected){
      for(const stock of selectedStocks.filter(x=>x.sector===sector)){
        const enriched={...stock,growth:growthFromHistory(stock)};
        const g=peerGroup(enriched,sector);
        if(!groups.has(g.key))groups.set(g.key,{sector,label:g.label,isBank:g.isBank,stocks:[]});
        groups.get(g.key).stocks.push(enriched);
      }
    }
    const blocks=[...groups.values()].map(block=>{
      const covered=block.stocks.filter(x=>x.fundamentals&&(
        x.fundamentals.trailingPE!==null||x.fundamentals.priceToBook!==null||x.fundamentals.returnOnEquity!==null
      )).length;
      const base={...block,total:block.stocks.length,fundamentalsCoverage:covered,requestedAt:state.cvmBase.requestedAt};
      return {...base,scored:scoreSector(base)};
    }).filter(b=>b.total>0);
    state.sectorData=blocks;
    renderResults();
    $('universeStatus').textContent='Análise concluída com TTM 2026 e histórico anual 2021-2025 da CVM.';
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
function renderHistory(rows){
  if(!rows.length)return '';
  return '<div class="history-box"><p class="eyebrow">HISTÓRICO FUNDAMENTALISTA</p><div class="history-list">'+rows.map(r=>
    '<div class="history-row"><b>'+esc(r.year)+'</b><span>Receita '+compactMoney(r.revenue)+'</span><span>EBIT '+compactMoney(r.ebit)+'</span><span>Lucro '+compactMoney(r.netIncome)+'</span><span>Margem EBIT '+pct(r.ebitMargin)+'</span></div>'
  ).join('')+'</div></div>';
}
function openDrawer(a){
  const f=a.fundamentals||{};
  $('drawerBody').innerHTML=`
    <div class="drawer-title">
      <p class="eyebrow">${esc(a.peerLabel||sectorPt(a.sector))}</p>
      <h2>${esc(a.ticker)}</h2>
      <p class="muted">Comparação fundamentalista dentro do grupo de pares · ${esc(f.source||'CVM')} · referência ${formatDate(f.referenceDate)}.</p>
    </div>
    <div class="drawer-price">
      <div><span>Último fechamento</span><strong>${money(a.close)}</strong></div>
      <div><span>Valor de mercado</span><strong>${compactMoney(a.marketCap)}</strong></div>
    </div>
    <div class="drawer-grid">
      ${drawerMetric('Valuation 360',a.valuationScore===null?'N/D':a.valuationScore+'/100')}
      ${drawerMetric('Qualidade',a.qualityScore===null?'N/D':a.qualityScore+'/100')}
      ${drawerMetric('P/L',mult(f.trailingPE))}
      ${drawerMetric('P/VP',mult(f.priceToBook))}
      ${drawerMetric('EV/EBIT',mult(f.enterpriseToEbit))}
      ${drawerMetric('CFO Yield',pct(f.cfoYield))}
      ${drawerMetric('ROE',pct(f.returnOnEquity))}
      ${drawerMetric('Margem EBIT',pct(f.ebitMargin))}
      ${drawerMetric('Dívida / PL',mult(f.debtToEquity))}
      ${drawerMetric('Dívida líquida / EBIT',mult(f.netDebtToEbit))}
      ${drawerMetric('Liquidez corrente',mult(f.currentRatio))}
      ${drawerMetric('Solidez',a.solidityScore===null?'N/D':a.solidityScore+'/100')}
      ${drawerMetric('Crescimento 360',a.growthScore===null?'N/D':a.growthScore+'/100')}
      ${drawerMetric('Receita CAGR 3a',pct(a.growth?.revenueCagr3))}
      ${drawerMetric('Receita CAGR 2021-25',pct(a.growth?.revenueCagrLong))}
      ${drawerMetric('EBIT CAGR 3a',pct(a.growth?.ebitCagr3))}
      ${drawerMetric('Lucro CAGR 3a',pct(a.growth?.profitCagr3))}
      ${drawerMetric('Margem EBIT Δ',pct(a.growth?.ebitMarginDelta))}
      ${drawerMetric('Anos com lucro',pct(a.growth?.positiveProfitYears))}
    </div>
    ${renderHistory(a.growth?.history||[])}\n    <div class="drawer-note">Valuation, Qualidade, Solidez e Crescimento 360 são dimensões independentes. O histórico usa DFP anuais da CVM de 2021 a 2025 e acrescenta o TTM 2026 quando disponível. Não representa recomendação de compra, venda ou manutenção.</div>
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