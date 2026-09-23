/* Visão executiva para sócios e administradores */
(function(){
 const byId=id=>document.getElementById(id);
 const has=id=>String(byId(id)?.value??'').trim()!=='';
 const money=v=>Number.isFinite(v)?brl2.format(v):'—';
 const pct=v=>Number.isFinite(v)?pct1(v):'—';
 const validModels=r=>[...(r?.models||[])].filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total);
 function fieldOrigin(id){
  const input=byId(id),raw=String(input?.value??'').trim();if(!raw)return'Pendente';
  if(input?.dataset?.userEdited==='1')return'Informado pelo usuário';
  if(input?.dataset?.importVerified==='1'){
   if(input.dataset.importConfidence==='low')return'Extraído com baixa confiança';
   if(input.dataset.importConfidence==='medium')return'Extraído e calculado';
   return'Importado de documento';
  }
  const box=input?.closest?.('.field,.mix');
  if(box?.classList.contains('state-derived'))return'Calculado pelo simulador';
  if(box?.classList.contains('state-auto')||box?.classList.contains('state-suggested'))return'Sugestão automática';
  if(box?.classList.contains('state-complete'))return'Informado ou revisado';
  return'Informado';
 }
 function set(id,value){const node=byId(id);if(node)node.textContent=value==null?'—':String(value)}
 function render(){
  try{
   if(typeof modelForYear!=='function'||typeof years==='undefined')return;
   const all=years.map(modelForYear),year=typeof selectedYear!=='undefined'?selectedYear:2027,r=all.find(x=>x.year===year)||all[0];if(!r)return;
   const valid=validModels(r),best=valid[0],second=valid[1],gap=best&&second?second.total-best.total:null,impact=window.lastEconomicImpact;
   const marginRaw=String(byId('currentOperatingMarginPct')?.value??'').trim(),margin=marginRaw===''?null:Number(marginRaw)/100;
   let cash=null;try{cash=typeof cashMetrics==='function'?cashMetrics(r):null}catch(_){}
   set('ownerCurrentTax',impact?.known?money(impact.currentTax):'PENDENTE');
   set('ownerCurrentTaxNote',impact?.known?'Carga líquida anual usada como base da comparação.':'Informe ou importe a carga líquida atual para medir o efeito da reforma.');
   set('ownerCurrentMargin',Number.isFinite(margin)?pct(margin):'PENDENTE');
   set('ownerBestTotal',best?money(best.total):'—');
   set('ownerBestTotalNote',best?(((best.key==='real'||best.key==='presumed')&&!best.totalComplete)?'Base comparável sem CPP patronal.':'Desembolso anual nas premissas informadas.'):'Sem cenário validado');
   set('ownerGap',gap==null?'—':money(gap));set('ownerSecondRegime',second?'vs. '+second.name:'Sem segundo regime validado');
   set('ownerFutureConsumption',money((r.netVat||0)+(r.legacy||0)));
   set('ownerWorkingCapital',cash?.working==null?'—':money(cash.working));
   let result='PENDENTE',resultNote='Depende da carga atual de consumo e do percentual de repasse a preços.';
   if(impact?.known){
    if(impact.financeCostKnown){
     result=impact.resultEffect>1?'+ '+money(impact.resultEffect):impact.resultEffect<-1?'− '+money(Math.abs(impact.resultEffect)):money(0);
     resultNote='Após tributos, repasse a preços e custo financeiro estimado.';
    }else{result='PARCIAL';resultNote='Sem custo financeiro completo do gap.'}
   }
   set('ownerResultEffect',result);set('ownerResultEffectNote',resultNote);set('ownerB2bCredit',money(r.regularClientCredit||0));
   const why=byId('ownerWhy');
   if(why&&best){
    const regularPair=second&&[best.key,second.key].every(k=>k==='real'||k==='presumed');
    if(regularPair){
     const presumedTax=(r.irpj||0)+(r.csll||0),realTax=(r.realIrpj||0)+(r.realCsll||0),taxGap=Math.abs(realTax-presumedTax),lower=presumedTax<=realTax?'Lucro Presumido':'Lucro Real';
     why.innerHTML='Nas premissas atuais, a diferença entre os dois regimes vem essencialmente de <strong>IRPJ e CSLL</strong>. O '+lower+' apresenta IRPJ/CSLL estimados em <strong>'+money(Math.min(presumedTax,realTax))+'</strong>, contra <strong>'+money(Math.max(presumedTax,realTax))+'</strong> no outro regime, diferença de <strong>'+money(taxGap)+'</strong>. IBS/CBS, ICMS/ISS residual e, quando informada, a CPP são componentes comuns aos dois cenários e não explicam esse diferencial.';
    }else why.textContent=best.name+' apresentou a menor saída anual entre os cenários validados. O detalhamento técnico mostra os componentes que formam essa diferença.';
   }
   const pending=[],topRegular=best&&second&&[best.key,second.key].every(k=>k==='real'||k==='presumed');
   if(topRegular&&!r.cppBaseKnown)pending.push('Informar folha/remunerações sujeitas à contribuição patronal e revisar a alíquota patronal efetiva, para completar o desembolso tributário total.');
   if(!impact?.known)pending.push('Informar a carga líquida atual de PIS/Cofins, ICMS, ISS e IPI, conforme aplicável, para calcular a variação real de preço, margem e resultado.');
   if(!Number.isFinite(margin))pending.push('Informar a margem EBITDA atual para medir quanto da variação tributária pode ser absorvida pela operação.');
   if(fieldOrigin('b2bPct')==='Sugestão automática')pending.push('Confirmar o percentual real de vendas B2B com faturamento por cliente.');
   if(fieldOrigin('eligibleCreditPct')==='Sugestão automática'||fieldOrigin('regularSuppliersPct')==='Sugestão automática')pending.push('Substituir estimativas setoriais pelas compras efetivamente creditáveis e pelo regime dos principais fornecedores.');
   if(String(byId('taxTreatmentAccepted')?.value||'')!=='yes')pending.push('Confirmar a composição das receitas por tratamento/cClassTrib e eventuais reduções, benefícios ou regimes específicos.');
   pending.push('Validar benefícios fiscais, operações interestaduais, exportações, créditos específicos e particularidades de IRPJ/CSLL não capturadas pelo modelo padrão.');
   const ul=byId('ownerPending');if(ul)ul.innerHTML=[...new Set(pending)].slice(0,6).map(x=>'<li>'+x+'</li>').join('');
   const evidence=[
    ['Vendas B2B',Number(byId('b2bPct')?.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',fieldOrigin('b2bPct')],
    ['Aquisições creditáveis',Number(byId('eligibleCreditPct')?.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',fieldOrigin('eligibleCreditPct')],
    ['Fornecedores no regime regular',Number(byId('regularSuppliersPct')?.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',fieldOrigin('regularSuppliersPct')],
    ['Carga atual de consumo',impact?.known?money(impact.currentTax):'Não informada',fieldOrigin('currentConsumptionTaxAnnual')],
    ['Margem EBITDA',Number.isFinite(margin)?pct(margin):'Não informada',fieldOrigin('currentOperatingMarginPct')],
    ['Tratamento IBS/CBS',String(byId('taxTreatmentAccepted')?.value||'')==='yes'?'Confirmado':'A confirmar',String(byId('taxTreatmentAccepted')?.value||'')==='yes'?'Revisado pelo usuário':'Pendente']
   ];
   const eg=byId('ownerEvidenceGrid');if(eg)eg.innerHTML=evidence.map(x=>'<div><span>'+x[0]+'</span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div>').join('');
   const q=byId('ownerAccountantQuestion');if(q){
    if(!impact?.known)q.textContent='Qual é a carga líquida atual de tributos sobre consumo da empresa, na mesma base anual usada pelo simulador, e como ela muda em 2027?';
    else if(topRegular&&!r.cppBaseKnown)q.textContent='Qual é a base mensal efetivamente sujeita à contribuição patronal e qual alíquota efetiva devemos usar, considerando RAT, terceiros e eventuais regimes específicos?';
    else q.textContent='As premissas de receitas, créditos, fornecedores e benefícios refletem as operações reais da empresa ou ainda são estimativas que podem alterar a decisão?';
   }
  }catch(err){console.error('Visão dos sócios:',err)}
 }
 window.renderShareholderBrief=render;
 document.addEventListener('brmi:diagnosis-generated',()=>setTimeout(render,0));
 window.addEventListener('beforeprint',render);
 const previous=window.calculate;
 if(typeof previous==='function')window.calculate=function(){const out=previous.apply(this,arguments);setTimeout(render,0);return out};
 setTimeout(render,0);
})();