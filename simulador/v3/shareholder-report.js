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
   set('ownerCurrentTaxNote',impact?.known?(impact.confidence==='low'?'Estimativa preliminar · origem com baixa confiança.':impact.confidence==='medium'?'Estimativa de cenário · premissas ainda sujeitas a validação.':'Carga líquida anual usada como base da comparação.'):'Informe ou importe a carga líquida atual para medir o efeito da reforma.');
   set('ownerCurrentMargin',Number.isFinite(margin)?pct(margin):'PENDENTE');
   set('ownerBestTotalLabel',r.realDecisionSensitive?'Base comparável na referência histórica':'Menor base tributária em '+r.year);
   set('ownerBestTotal',best?money(best.total):'—');
   set('ownerBestTotalNote',best?(r.realDecisionSensitive?'Usa o resultado histórico apenas para referência; a decisão futura depende da lucratividade projetada.':((best.key==='real'||best.key==='presumed')&&!best.totalComplete)?'Base comparável sem CPP patronal.':'Desembolso anual nas premissas informadas.'):'Sem cenário validado');
   set('ownerGap',gap==null?'—':money(gap));set('ownerSecondRegime',second?'vs. '+second.name:'Sem segundo regime validado');
   set('ownerFutureConsumption',money((r.netVat||0)+(r.legacy||0)));
   set('ownerWorkingCapital',cash?.working==null?'—':money(cash.working));
   set('ownerResultEffectLabel',impact?.known?'Efeito no resultado com repasse de '+pct(impact.transferRate):'Efeito anual no resultado');
   let result='PENDENTE',resultNote='Depende da carga atual de consumo e do percentual de repasse a preços.';
   if(impact?.known){
    if(impact.financeCostKnown){
     result=impact.resultEffect>1?'+ '+money(impact.resultEffect):impact.resultEffect<-1?'− '+money(Math.abs(impact.resultEffect)):money(0);
     resultNote=(impact.confidence==='low'?'Estimativa preliminar. ':impact.confidence==='medium'?'Estimativa de cenário. ':'')+'Após tributos, repasse a preços e custo financeiro estimado.'+(impact.transferRate>=.999?' Se o mercado não aceitar o repasse integral, parte da variação será absorvida pela margem.':'');
    }else{result='PARCIAL';resultNote='Sem custo financeiro completo do gap.'}
   }
   set('ownerResultEffect',result);set('ownerResultEffectNote',resultNote);set('ownerB2bCredit',money(r.regularClientCredit||0));
   const why=byId('ownerWhy');
   if(why&&best){
    const regularPair=second&&[best.key,second.key].every(k=>k==='real'||k==='presumed');
    if(regularPair&&r.realDecisionSensitive&&r.breakEven){
     why.innerHTML='A DRE histórica coloca <strong>'+best.name+'</strong> à frente, mas isso não é uma previsão de 2027. O ponto aproximado de indiferença é <strong>'+money(r.breakEven.profit)+'</strong> de lucro anual, cerca de <strong>'+pct(r.breakEven.margin)+'</strong> do faturamento. Abaixo desse nível, o Lucro Real tende a manter vantagem; acima dele, o Lucro Presumido pode passar à frente, mantidas as demais premissas.';
    }else if(regularPair){
     const presumedTax=(r.irpj||0)+(r.csll||0),realTax=(r.realIrpj||0)+(r.realCsll||0),taxGap=Math.abs(realTax-presumedTax),lower=presumedTax<=realTax?'Lucro Presumido':'Lucro Real';
     why.innerHTML='Nas premissas atuais, a diferença entre os dois regimes vem essencialmente de <strong>IRPJ e CSLL</strong>. O '+lower+' apresenta IRPJ/CSLL estimados em <strong>'+money(Math.min(presumedTax,realTax))+'</strong>, contra <strong>'+money(Math.max(presumedTax,realTax))+'</strong> no outro regime, diferença de <strong>'+money(taxGap)+'</strong>. IBS/CBS, ICMS/ISS residual e, quando informada, a CPP são componentes comuns aos dois cenários e não explicam esse diferencial.';
    }else why.textContent=best.name+' apresentou a menor saída anual entre os cenários validados. O detalhamento técnico mostra os componentes que formam essa diferença.';
   }
   const pending=[],topRegular=best&&second&&[best.key,second.key].every(k=>k==='real'||k==='presumed');
   if(topRegular&&r.realDecisionSensitive)pending.push('Projetar a lucratividade futura. O resultado histórico é apenas referência e não deve ser repetido automaticamente em 2027–2033.');
   if(topRegular&&r.projectedProfitKnown&&r.breakEven?.profit>0&&Math.abs(r.projectedAccountingProfit-r.breakEven.profit)/r.breakEven.profit<=.25)pending.push('Validar a projeção de lucro com orçamento e carteira de pedidos: o valor informado está próximo do ponto de indiferença e pequenas mudanças podem inverter o regime que aparece à frente.');
   if(byId('realAccountingProfitAnnual')?.dataset?.importFiscalMismatch==='1')pending.push('Conferir a apuração fiscal: a DRE combina resultado contábil negativo com provisão de IRPJ/CSLL, portanto não é seguro assumir base fiscal zero sem revisar adições, exclusões e compensações.');
   if(topRegular&&!r.cppBaseKnown)pending.push('Informar folha/remunerações sujeitas à contribuição patronal e revisar a alíquota patronal efetiva, para completar o desembolso tributário total.');
   if(!impact?.known)pending.push('Informar a carga líquida atual de PIS/Cofins, ICMS, ISS e IPI, conforme aplicável, para calcular a variação real de preço, margem e resultado.');
   else if(impact.confidence==='low')pending.push('Confirmar a carga líquida atual de tributos sobre consumo: ela foi extraída com baixa confiança e afeta diretamente preço, margem e efeito no resultado.');
   if(!Number.isFinite(margin))pending.push('Informar a margem EBITDA atual para medir quanto da variação tributária pode ser absorvida pela operação.');
   if(cash?.reserveKnown)pending.push('Confirmar quanto do caixa e das aplicações considerados como reserva bruta está efetivamente livre para suportar a necessidade de liquidez do split payment.');
   if(fieldOrigin('b2bPct')==='Sugestão automática')pending.push('Confirmar o percentual real de vendas B2B com faturamento por cliente.');
   const usedVehicles=window.brmiImport?.docs?.some(d=>d?.usedVehiclesMention===true);
   const purchaseProxy=(window.brmiImport?.candidates||[]).find(x=>x?.field==='purchasesPct'&&/proxy pela DRE/i.test(String(x?.label||'')));
   if(usedVehicles)pending.push(r.creditMethod==='automotive-dre-proxy'?'Confirmar a origem e a documentação dos veículos seminovos. O cenário automotivo considerou o custo histórico identificado na DRE como proxy da base de aquisição e preservou o potencial de crédito de IBS/CBS, mas variação de estoques e condições reais de cada compra podem alterar o valor.':'Revisar separadamente as aquisições de veículos seminovos. Compras de bens móveis usados de pessoa física não contribuinte ou MEI para revenda podem gerar crédito presumido de IBS/CBS; a simples classificação do fornecedor como fora do regime regular não deve eliminar esse crédito.');
   if(purchaseProxy)pending.push(`Revisar a base de aquisições creditáveis. A DRE indica custos equivalentes a aproximadamente ${Number(purchaseProxy.value).toLocaleString('pt-BR',{maximumFractionDigits:1})}% da receita bruta, como proxy gerencial, mas custos não equivalem necessariamente às compras creditáveis do período.`);
   if(fieldOrigin('eligibleCreditPct')==='Sugestão automática'||fieldOrigin('regularSuppliersPct')==='Sugestão automática')pending.push('Substituir estimativas setoriais pelas compras efetivamente creditáveis e pelo regime dos principais fornecedores.');
   if(String(byId('taxTreatmentAccepted')?.value||'')!=='yes')pending.push('Confirmar a composição das receitas por tratamento/cClassTrib e eventuais reduções, benefícios ou regimes específicos.');
   pending.push('Tratar as alíquotas de referência de CBS/IBS como premissas de cenário e confirmar os valores oficiais aplicáveis ao ano analisado.');
   pending.push('Validar benefícios fiscais, operações interestaduais, exportações, créditos específicos e particularidades de IRPJ/CSLL não capturadas pelo modelo padrão.');
   const ul=byId('ownerPending');if(ul)ul.innerHTML=[...new Set(pending)].slice(0,6).map(x=>'<li>'+x+'</li>').join('');
   const evidence=[
    ['Vendas B2B',Number(byId('b2bPct')?.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',fieldOrigin('b2bPct')],
    ['Aquisições creditáveis',Number(byId('eligibleCreditPct')?.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',fieldOrigin('eligibleCreditPct')],
    ['Fornecedores no regime regular',Number(byId('regularSuppliersPct')?.value||0).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%',fieldOrigin('regularSuppliersPct')],
    ['Carga atual de consumo',impact?.known?money(impact.currentTax):'Não informada',impact?.confidence==='low'?'Baixa confiança · confirmar':fieldOrigin('currentConsumptionTaxAnnual')],
    ['Margem EBITDA',Number.isFinite(margin)?pct(margin):'Não informada',fieldOrigin('currentOperatingMarginPct')],
    ['Tratamento IBS/CBS',String(byId('taxTreatmentAccepted')?.value||'')==='yes'?'Confirmado':'A confirmar',String(byId('taxTreatmentAccepted')?.value||'')==='yes'?'Revisado pelo usuário':'Pendente']
   ];
   const eg=byId('ownerEvidenceGrid');if(eg)eg.innerHTML=evidence.map(x=>'<div><span>'+x[0]+'</span><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div>').join('');
   const q=byId('ownerAccountantQuestion');if(q){
    const projectedNearBreakEven=topRegular&&r.projectedProfitKnown&&r.breakEven?.profit>0&&Math.abs(r.projectedAccountingProfit-r.breakEven.profit)/r.breakEven.profit<=.25;
    if(topRegular&&(r.realDecisionSensitive||projectedNearBreakEven))q.textContent=r.projectedProfitKnown?'A projeção de lucro usada no cenário é robusta? Que lucro tributável e margem são razoáveis para 2027 considerando orçamento, carteira de pedidos, custos, adições/exclusões fiscais e eventual saldo efetivo de prejuízo fiscal?':'Qual lucro tributável e margem são razoáveis para 2027, considerando orçamento, carteira de pedidos, custos, adições/exclusões fiscais e eventual saldo efetivo de prejuízo fiscal?';
    else if(!impact?.known)q.textContent='Qual é a carga líquida atual de tributos sobre consumo da empresa, na mesma base anual usada pelo simulador, e como ela muda em 2027?';
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