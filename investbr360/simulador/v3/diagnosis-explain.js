(function(){
 const byId=id=>document.getElementById(id);
 const money=v=>Number.isFinite(v)&&typeof brl2!=='undefined'?brl2.format(v):'—';
 const pct=v=>Number.isFinite(v)&&typeof pct1==='function'?pct1(v):'—';
 const set=(id,v)=>{const n=byId(id);if(n)n.textContent=v==null?'—':String(v)};
 function currentTaxOrigin(){
  const el=byId('currentConsumptionTaxAnnual');
  if(!el||String(el.value||'').trim()==='')return{label:'não informada',confidence:'unknown'};
  if(el.dataset?.importVerified==='1')return{label:'extraída de documento',confidence:el.dataset.importConfidence||'medium'};
  if(el.dataset?.userEdited==='1')return{label:'informada pelo usuário',confidence:'high'};
  const box=el.closest?.('.field,.mix');
  if(box?.classList.contains('state-auto')||box?.classList.contains('state-suggested'))return{label:'estimada automaticamente',confidence:'medium'};
  return{label:'informada',confidence:'medium'}
 }
 function validModels(r){return (r?.models||[]).filter(m=>m.valid!==false&&Number.isFinite(m.total)).sort((a,b)=>a.total-b.total)}
 function sourceConfidenceText(conf){
  if(conf==='low')return'A carga atual usada como referência tem baixa confiança, portanto a explicação da variação deve ser tratada como preliminar.';
  if(conf==='medium')return'A carga atual ou alguma premissa relevante ainda depende de estimativa e deve ser validada.';
  if(conf==='high')return'A base atual foi informada ou validada com maior confiança, mas continua sujeita à conferência fiscal.';
  return'A carga atual ainda não possui base suficiente para explicar a variação com segurança.'
 }
 function explain(){
  try{
   if(typeof modelForYear!=='function')return;
   const year=typeof selectedYear!=='undefined'?selectedYear:2027,r=modelForYear(year),models=validModels(r),best=models[0],second=models[1];
   let impact=window.lastEconomicImpact;
   if((!impact||impact.modelKey!==best?.key)&&typeof economicImpactFor==='function'&&best)impact=economicImpactFor(r,best);
   const current=impact?.currentTax,future=impact?.futureTax,delta=impact?.taxDelta;
   const gross=Math.max(0,Number(r.grossVat||0)),credit=Math.max(0,Number(r.inputCredit||0)),net=Math.max(0,Number(r.netVat||0)),legacy=Math.max(0,Number(r.legacy||0));
   const topRegular=best&&second&&[best.key,second.key].every(k=>k==='real'||k==='presumed');
   const gap=best&&second?Math.max(0,second.total-best.total):null;

   let lead='O simulador transforma os números informados em explicações por regras fixas: calcula, compara e escolhe o texto correspondente a cada situação.';
   if(impact?.known)lead+=' Neste cenário, a carga líquida sobre consumo passa de '+money(current)+' para '+money(future)+'.';
   set('diagnosisExplainLead',lead);

   let regime='Os dados atuais não permitem comparar dois regimes com segurança.',formula='—';
   if(best&&second){
    if(topRegular){
      const realTax=(r.realIrpj||0)+(r.realCsll||0),presTax=(r.irpj||0)+(r.csll||0);
      if(r.realDecisionSensitive&&r.breakEven){
       regime='O resultado histórico coloca '+best.name+' à frente, mas a escolha futura depende da lucratividade. O simulador não transforma automaticamente o lucro histórico em previsão.';
       formula='Ponto de indiferença aproximado: '+money(r.breakEven.profit)+' · '+pct(r.breakEven.margin)+' do faturamento';
      }else{
       regime='Lucro Real e Lucro Presumido compartilham a mesma lógica de IBS/CBS neste cenário. Por isso, a diferença entre eles vem principalmente de IRPJ e CSLL calculados sobre bases diferentes.';
       formula='IRPJ + CSLL no Real: '+money(realTax)+' · Presumido: '+money(presTax)+(gap!=null?' · Diferença: '+money(gap):'');
      }
    }else{
      regime=best.name+' apresenta o menor desembolso entre os modelos válidos nas premissas informadas. O relatório mantém separado o crédito do cliente B2B, que não reduz a carga própria da empresa.';
      formula='1º cenário: '+money(best.total)+(second?' · 2º cenário: '+money(second.total):'');
    }
   }
   set('explainRegimeText',regime);set('explainRegimeFormula',formula);

   set('explainConsumptionText','No regime regular, o simulador calcula primeiro o débito bruto de IBS/CBS sobre as vendas, desconta os créditos estimados das aquisições e soma os tributos atuais que ainda permanecem durante a transição, como ICMS e ISS residual.');
   set('explainConsumptionFormula',money(gross)+' IBS/CBS bruto − '+money(credit)+' créditos + '+money(legacy)+' residual = '+money(net+legacy)+' carga futura');

   if(impact?.known){
    const dir=delta>1?'aumenta':delta<-1?'diminui':'permanece praticamente estável';
    const rate=current>0?Math.abs(delta)/current:null;
    set('explainVariationText','A carga '+dir+' porque o total líquido projetado para '+year+' é '+money(future)+', enquanto a carga atual usada como referência é '+money(current)+'. A diferença não é uma nova despesa isolada: ela resulta da combinação entre novos débitos, créditos recuperáveis e tributos que ainda coexistem durante a transição.');
    set('explainVariationFormula',money(future)+' − '+money(current)+' = '+(delta>=0?'+ ':'− ')+money(Math.abs(delta))+(rate!=null?' · '+pct(rate)+' sobre a carga atual':''));
   }else{
    set('explainVariationText','A variação ainda não pode ser explicada porque falta uma carga atual comparável em base anual.');
    set('explainVariationFormula','Carga futura − carga atual = pendente');
   }

   const finalParts=[{key:'legacy',label:'ICMS/ISS residual da transição',value:legacy},{key:'netVat',label:'IBS/CBS líquido após créditos',value:net}].sort((a,b)=>b.value-a.value);
   const main=finalParts[0],futureTotal=net+legacy,bridge=window.lastTaxBridge;
   if(impact?.known&&Math.abs(delta)>1){
    if(bridge?.reconciled&&bridge.primary){
      const effect=bridge.primary.value>=0?'pressão':'alívio';
      set('explainDriverText','A ponte conciliada identifica como principal fator '+bridge.primary.label+'. Esse bloco produz '+effect+' de '+money(Math.abs(bridge.primary.value))+' na variação total. Como a soma dos tributos atuais detalhados fecha com a carga de referência, esta atribuição é matematicamente reconciliada com o aumento ou redução total.');
      set('explainDriverFormula','Principal contribuição: '+bridge.primary.label+' = '+(bridge.primary.value>=0?'+ ':'− ')+money(Math.abs(bridge.primary.value)));
    }else if(delta>0){
      set('explainDriverText','O principal componente de pressão identificado na carga futura é '+main.label+', com '+money(main.value)+(futureTotal>0?' ('+pct(main.value/futureTotal)+' da carga futura)':'')+'. Os créditos de aquisições reduzem essa pressão em '+money(credit)+'. Sem a composição atual conciliada, o sistema identifica o maior componente futuro, mas não o apresenta como causa exclusiva da variação.');
      set('explainDriverFormula','Maior pressão futura: '+main.label+' = '+money(main.value));
    }else{
      set('explainDriverText','A redução ocorre porque a carga líquida futura fica abaixo da carga atual. O principal fator de alívio diretamente mensurável no novo cálculo são os créditos sobre aquisições, que reduzem o débito bruto de IBS/CBS antes da comparação final. A ponte detalhada permite uma atribuição mais precisa quando a composição atual estiver conciliada.');
      set('explainDriverFormula','Alívio por créditos: − '+money(credit)+' · IBS/CBS líquido: '+money(net));
    }
   }else if(impact?.known){
    set('explainDriverText','Não há variação material estimada entre a carga atual e a futura neste cenário.');
    set('explainDriverFormula','Variação aproximada: '+money(delta||0));
   }else{
    set('explainDriverText','Sem carga atual validada, o simulador consegue mostrar a composição da carga futura, mas não apontar com segurança a principal causa da variação.');
    set('explainDriverFormula','Principal componente futuro: '+main.label+' = '+money(main.value));
   }

   const creditPct=gross>0?credit/gross:null;
   set('explainCreditText','Os créditos não são receita nem benefício adicional: eles reduzem o débito bruto de IBS/CBS quando as aquisições atendem às condições do regime de crédito. Quanto maior a parcela efetivamente creditável e maior a participação de fornecedores no regime regular, menor tende a ser o IBS/CBS líquido.');
   set('explainCreditFormula',money(gross)+' débito bruto − '+money(credit)+' créditos = '+money(net)+' líquido'+(creditPct!=null?' · créditos equivalem a '+pct(creditPct)+' do débito bruto':''));

   const origin=currentTaxOrigin(),pending=[];
   if(origin.confidence==='low'||origin.confidence==='unknown')pending.push('validar a carga atual líquida de tributos sobre consumo');
   if(String(byId('currentOperatingMarginPct')?.value||'').trim()==='')pending.push('informar a margem EBITDA atual');
   if(byId('eligibleCreditPct')?.closest?.('.field,.mix')?.classList.contains('state-auto'))pending.push('confirmar quais compras realmente geram crédito');
   if(byId('regularSuppliersPct')?.closest?.('.field,.mix')?.classList.contains('state-auto'))pending.push('confirmar o regime dos principais fornecedores');
   if(!pending.length)pending.push('revisar as premissas fiscais e operacionais com a documentação da empresa');
   set('explainActionText','Antes de usar o resultado para decisão, a prioridade é '+pending.slice(0,3).join(', ')+'. Isso é relevante porque essas variáveis podem alterar diretamente a carga futura ou a capacidade da empresa de absorver a mudança.');
   set('explainActionFormula','Prioridade de validação: '+pending[0]);

   const caveat='Critério de interpretação: '+sourceConfidenceText(impact?.confidence||origin.confidence)+' Quando a carga atual está disponível apenas como total agregado, o simulador explica com precisão como a carga futura é formada e qual componente mais pesa nela, mas não inventa uma decomposição histórica por PIS/Cofins, ICMS, ISS e IPI.';
   set('diagnosisExplainCaveat',caveat);
  }catch(err){console.error('Entenda o seu diagnóstico:',err)}
 }
 window.renderDiagnosisExplanation=explain;
 document.addEventListener('brmi:diagnosis-generated',()=>setTimeout(explain,0));
 window.addEventListener('beforeprint',explain);
 setTimeout(explain,0);
})();