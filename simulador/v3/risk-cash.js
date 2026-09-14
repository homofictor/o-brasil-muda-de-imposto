function recommendation(r){
 if(r.isMei)return{key:'mei',title:'MEI: regime híbrido indisponível',text:'O MEI não pode optar pela apuração regular de IBS/CBS. O V3 não usa as faixas dos Anexos I a V para calcular o DAS-MEI; confirme a permanência no SIMEI e as regras específicas aplicáveis.'};
 if(!r.simpleEligible){const best=[r.models.find(m=>m.key==='presumed'),r.models.find(m=>m.key==='real')].sort((a,b)=>a.total-b.total)[0];return{key:best.key,title:best.name,text:`A empresa não está em cenário elegível confirmado para o Simples. Entre as premissas de migração total, ${best.name} apresenta a menor saída anual estimada, mas IRPJ/CSLL e contribuições exigem validação contábil detalhada.`};}
 const pure=r.models[0],hybrid=r.models[1];
 if(hybrid.total<=pure.total)return{key:'hybrid',title:'Simples híbrido',text:`O regime regular de IBS/CBS reduz a saída anual estimada em ${brl.format(pure.total-hybrid.total)} e amplia o crédito potencial aos clientes PJ em ${brl.format(r.extraClientCredit)}.`};
 const delta=hybrid.total-pure.total;
 if(r.b2bSales<=0||!Number.isFinite(r.breakEvenCapture))return{key:'pure',title:'Simples Nacional 100%',text:`O Simples puro reduz a saída anual estimada em ${brl.format(delta)} e não há vendas B2B informadas que justifiquem monetizar crédito adicional.`};
 if(r.capture>0&&r.adjustedHybrid<pure.total)return{key:'hybrid',title:'Simples híbrido, com validação comercial',text:`Tributariamente o híbrido custa ${brl.format(delta)} a mais, mas a captura comercial informada (${pct1(r.capture)}) do crédito adicional dos clientes pode compensar essa diferença. O ponto de equilíbrio é ${pct1(r.breakEvenCapture)} das vendas B2B.`};
 return{key:'pure',title:'Simples Nacional 100%',text:`Pelas premissas atuais, o híbrido custa ${brl.format(delta)} a mais por ano. Ele entrega ${brl.format(r.extraClientCredit)} a mais de crédito aos clientes PJ, mas seria necessário recuperar pelo menos ${pct1(r.breakEvenCapture)} das vendas B2B em preço, margem, retenção ou volume para compensar a diferença.`};
}
function riskScore(r){
 if(r.isMei)return{score:0,label:'Não aplicável',drivers:['MEI não pode optar pelo regime regular de IBS/CBS.']};
 if(r.b2bSales<=0)return{score:0,label:'Baixo',drivers:['Sem vendas B2B informadas.']};
 const b2b=clamp(num('b2bPct')/100,0,1),vatGap=r.hybridClientCredit>0?clamp(r.extraClientCredit/r.hybridClientCredit,0,1):0,regShare=clamp(num('regularSuppliersPct')/100,0,1),taxable=revenueRateFactor();
 const score=Math.round(b2b*40+vatGap*35+taxable*15+regShare*10),label=score>=67?'Alto':score>=34?'Moderado':'Baixo';
 return{score,label,drivers:[`${(b2b*100).toFixed(0)}% das vendas foram informadas como B2B.`,`O Simples puro entrega aproximadamente ${pct1(1-vatGap)} do crédito que o regime regular entregaria ao cliente, nas premissas atuais.`,`${(regShare*100).toFixed(0)}% dos fornecedores foram informados no regime regular, aumentando o potencial de crédito próprio no híbrido.`]};
}
function cashMetrics(r){
 if(r.isMei)return{grossMonthly:0,liabilityMonthly:0,floatReplacement:0,temporaryExcess:0,working:0,gap:0,cost:0,cash100:100,notApplicable:true};
 const split=clamp(num('splitPct')/100,0,1),floatDays=clamp(num('floatDays'),0,90),refundDays=clamp(num('refundDays'),0,30),reserve=Math.max(0,num('cashReserve'));
 const grossMonthly=(r.grossVat/12)*split,liabilityMonthly=(r.netVat/12)*split,floatReplacement=liabilityMonthly*(floatDays/30),overRetention=Math.max(0,grossMonthly-liabilityMonthly),temporaryExcess=overRetention*(refundDays/30),working=floatReplacement+temporaryExcess,gap=Math.max(0,working-reserve),cost=gap*clamp(num('financeRate')/100,0,2),cash100=100-(r.grossRegularRate*split*100);
 return{grossMonthly,liabilityMonthly,floatReplacement,temporaryExcess,working,gap,cost,cash100,notApplicable:false};
}
