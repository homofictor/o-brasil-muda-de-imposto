(function(root){
 const $=id=>document.getElementById(id);
 const money=v=>Number.isFinite(v)&&typeof brl2!=='undefined'?brl2.format(v):'—';
 const pct=v=>Number.isFinite(v)&&typeof pct1==='function'?pct1(v):'—';
 const val=id=>{const el=$(id);if(!el||String(el.value||'').trim()==='')return null;const n=typeof root.parseMoneyValue==='function'?root.parseMoneyValue(el.value):Number(el.value);return Number.isFinite(n)?Math.max(0,n):null};
 const has=id=>{const el=$(id);return !!el&&String(el.value||'').trim()!==''};
 function validModels(r){return(r?.models||[]).filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total)}
 function futureParts(r,modelKey,futureTax){
  if(!r||!Number.isFinite(futureTax))return null;
  if(modelKey==='pure'){
   const cbs=Math.max(0,Number(r.dasCbs||0)),ibs=Math.max(0,Number(r.dasIbs||0));
   return{cbsNet:cbs,ibsNet:ibs,legacy:Math.max(0,futureTax-cbs-ibs),gross:cbs+ibs,credit:0}
  }
  const full=Math.max(0,Number(r.rr?.cbs||0)+Number(r.rr?.ibs||0)),cbsShare=full>0?Number(r.rr?.cbs||0)/full:0,ibsShare=full>0?Number(r.rr?.ibs||0)/full:0;
  const net=Math.max(0,Number(r.netVat||0)),gross=Math.max(0,Number(r.grossVat||0)),credit=Math.max(0,Number(r.inputCredit||0));
  return{cbsNet:net*cbsShare,ibsNet:net*ibsShare,legacy:Math.max(0,futureTax-net),gross,credit}
 }
 function currentBreakdown(){
  const items=[
   {key:'federal',label:'PIS/Cofins atuais',value:val('currentPisCofinsAnnual'),filled:has('currentPisCofinsAnnual')},
   {key:'icms',label:'ICMS atual',value:val('currentIcmsAnnual'),filled:has('currentIcmsAnnual')},
   {key:'iss',label:'ISS atual',value:val('currentIssAnnual'),filled:has('currentIssAnnual')},
   {key:'other',label:'IPI / outros atuais',value:val('currentOtherConsumptionAnnual'),filled:has('currentOtherConsumptionAnnual')}
  ];
  const filled=items.filter(x=>x.filled),sum=filled.reduce((s,x)=>s+(x.value||0),0);
  return{items,filled,sum,federal:items[0].value||0,icms:items[1].value||0,iss:items[2].value||0,other:items[3].value||0}
 }
 function buildTaxBridge(r,model,impact){
  if(!r||!model||!impact?.known)return{known:false};
  const current=Math.max(0,Number(impact.currentTax||0)),future=Math.max(0,Number(impact.futureTax||0)),delta=future-current,parts=futureParts(r,model.key,future),detail=currentBreakdown();
  if(!parts)return{known:false};
  const tolerance=Math.max(100,current*.02),difference=detail.sum-current,reconciled=detail.filled.length>0&&Math.abs(difference)<=tolerance;
  const federalFuture=parts.cbsNet,subnationalFuture=parts.ibsNet+parts.legacy;
  const contributions=[
   {key:'federal',label:'PIS/Cofins atuais → CBS líquida',current:detail.federal,future:federalFuture,value:federalFuture-detail.federal},
   {key:'subnational',label:'ICMS/ISS atuais → IBS líquido + residual',current:detail.icms+detail.iss,future:subnationalFuture,value:subnationalFuture-(detail.icms+detail.iss)},
   {key:'other',label:'IPI / outros incluídos na carga atual',current:detail.other,future:0,value:-detail.other}
  ];
  let primary=null;
  if(reconciled){
   const candidates=delta>1?contributions.filter(x=>x.value>0):delta<-1?contributions.filter(x=>x.value<0):contributions;
   primary=[...candidates].sort((a,b)=>Math.abs(b.value)-Math.abs(a.value))[0]||null;
  }else{
   const futureComponents=[
    {key:'netvat',label:'IBS/CBS líquido',value:parts.cbsNet+parts.ibsNet},
    {key:'legacy',label:'ICMS/ISS residual',value:parts.legacy}
   ];
   primary=[...futureComponents].sort((a,b)=>b.value-a.value)[0]||null;
  }
  return{known:true,current,future,delta,rate:current>0?delta/current:null,parts,detail,reconciled,tolerance,difference,contributions,primary,modelKey:model.key,year:r.year}
 }
 function signedMoney(v){if(!Number.isFinite(v))return'—';if(Math.abs(v)<.005)return money(0);return(v>0?'+ ':'− ')+money(Math.abs(v))}
 function renderStatus(bridge){
  const node=$('currentTaxBreakdownStatus');if(!node)return;
  const d=currentBreakdown(),current=val('currentConsumptionTaxAnnual');
  node.className='currentTaxBreakdownStatus';
  if(!d.filled.length){node.textContent='Preenchimento opcional. O total detalhado será conciliado com a carga atual usada no diagnóstico.';return}
  if(current==null){node.classList.add('warn');node.textContent='Componentes informados somam '+money(d.sum)+'. Informe ou confirme também a carga atual total para validar a ponte.';return}
  const diff=d.sum-current,tol=Math.max(100,current*.02);
  if(Math.abs(diff)<=tol){node.classList.add('ok');node.textContent='Composição conciliada: '+money(d.sum)+' detalhados para '+money(current)+' de carga atual. A ponte poderá atribuir a variação por blocos.'}
  else{node.classList.add('warn');node.textContent='Composição ainda não conciliada: componentes somam '+money(d.sum)+', contra '+money(current)+' de carga atual. Diferença de '+signedMoney(diff)+'.'}
 }
 function renderTaxBridge(){
  try{
   renderStatus();
   if(typeof root.modelForYear!=='function')return;
   const year=Math.max(2027,Math.min(2033,Number($('yearRange')?.value)||2027)),r=root.modelForYear(year),models=validModels(r),model=models[0];
   let impact=root.lastEconomicImpact;if((!impact||impact.modelKey!==model?.key)&&typeof root.economicImpactFor==='function'&&model)impact=root.economicImpactFor(r,model);
   const b=buildTaxBridge(r,model,impact);root.lastTaxBridge=b;
   const set=(id,v)=>{const n=$(id);if(n)n.textContent=v==null?'—':String(v)};
   if(!b.known){
    set('taxBridgeHeadline','A ponte depende de uma carga atual comparável e de um cenário futuro válido.');
    ['bridgeCurrentTax','bridgeCbsNet','bridgeIbsNet','bridgeLegacy','bridgeFutureTax','bridgeDelta','bridgePrimaryDriver'].forEach(id=>set(id,'—'));
    set('bridgePrimaryDriverText','Complete a carga atual para comparar os dois sistemas.');
    set('bridgeAttributionQuality','Pendente');set('bridgeAttributionText','Sem base atual suficiente para atribuir a variação.');
    const wrap=$('taxBridgeContributionWrap');if(wrap)wrap.hidden=true;return b
   }
   const direction=b.delta>1?'aumento':b.delta<-1?'redução':'estabilidade',headline='A carga de consumo apresenta '+direction+' de '+money(Math.abs(b.delta))+(b.rate!=null?' ('+pct(Math.abs(b.rate))+')':'')+' entre a referência atual e '+b.year+'.';
   set('taxBridgeHeadline',headline);set('bridgeCurrentTax',money(b.current));set('bridgeCbsNet',money(b.parts.cbsNet));set('bridgeIbsNet',money(b.parts.ibsNet));set('bridgeLegacy',money(b.parts.legacy));set('bridgeFutureTax',money(b.future));set('bridgeDelta',signedMoney(b.delta));
   if(b.reconciled&&b.primary){
    set('bridgePrimaryDriver',b.primary.label);
    set('bridgePrimaryDriverText',(b.primary.value>=0?'Pressão de ':'Alívio de ')+money(Math.abs(b.primary.value))+' na variação total, considerando a composição atual informada e conciliada.');
    set('bridgeAttributionQuality','Atribuição conciliada');
    set('bridgeAttributionText','Os componentes atuais somam aproximadamente a carga total usada no diagnóstico. A variação pode ser decomposta matematicamente por blocos.');
   }else if(b.primary){
    set('bridgePrimaryDriver',b.primary.label);
    set('bridgePrimaryDriverText','É o maior componente identificado na carga futura, no valor de '+money(b.primary.value)+'. Sem conciliação da composição atual, ele não é apresentado como causa exclusiva da variação.');
    set('bridgeAttributionQuality',b.detail.filled.length?'Composição não conciliada':'Atribuição indicativa');
    set('bridgeAttributionText',b.detail.filled.length?'Os valores detalhados da carga atual não fecham com o total usado no diagnóstico. Corrija a diferença para obter atribuição causal por blocos.':'A carga atual está agregada. O simulador mostra a formação futura, mas evita atribuir a diferença a um tributo específico sem base documental.');
   }
   const wrap=$('taxBridgeContributionWrap'),body=$('taxBridgeContributionBody');
   if(wrap)wrap.hidden=!b.reconciled;
   if(body&&b.reconciled)body.innerHTML=b.contributions.map(x=>'<tr><td><strong>'+x.label+'</strong></td><td>'+money(x.current)+'</td><td>'+money(x.future)+'</td><td class="'+(x.value>1?'up':x.value<-1?'down':'flat')+'">'+signedMoney(x.value)+'</td></tr>').join('');
   set('taxBridgeContributionTotal',signedMoney(b.delta));
   const note=$('taxBridgeNote');
   if(note){
    if(b.reconciled)note.textContent='A soma das contribuições reproduz a variação total dentro da tolerância de conciliação. Se houver IPI ou outro tributo atual relevante, confirme se ele está corretamente incluído no detalhamento antes de interpretar a atribuição.';
    else note.textContent='Sem composição atual conciliada, a ponte mostra com precisão a carga futura e seus componentes, mas não inventa uma decomposição histórica. Preencha PIS/Cofins, ICMS, ISS e, se aplicável, IPI/outros para identificar o principal responsável pela variação.'
   }
   return b
  }catch(err){console.error('Ponte da variação tributária:',err);return{known:false,error:String(err)}}
 }
 root.buildTaxBridge=buildTaxBridge;root.renderTaxBridge=renderTaxBridge;
 ['currentPisCofinsAnnual','currentIcmsAnnual','currentIssAnnual','currentOtherConsumptionAnnual','currentConsumptionTaxAnnual'].forEach(id=>{
  const el=$(id);if(!el||el.dataset.taxBridgeBound)return;el.dataset.taxBridgeBound='1';el.addEventListener('input',()=>setTimeout(renderTaxBridge,0));el.addEventListener('change',()=>setTimeout(renderTaxBridge,0))
 });
 setTimeout(renderTaxBridge,0);
})(typeof window!=='undefined'?window:globalThis);