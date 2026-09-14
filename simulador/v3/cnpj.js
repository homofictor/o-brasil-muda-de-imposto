function normalizeCnpjInput(v){
 let s=String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,14);
 if(/^[0-9]{14}$/.test(s))return`${s.slice(0,2)}.${s.slice(2,5)}.${s.slice(5,8)}/${s.slice(8,12)}-${s.slice(12)}`;
 if(s.length>12)return`${s.slice(0,2)}.${s.slice(2,5)}.${s.slice(5,8)}/${s.slice(8,12)}-${s.slice(12)}`;return s;
}
async function fetchJson(url,timeoutMs=12000){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);try{const r=await fetch(url,{headers:{Accept:'application/json'},signal:controller.signal});let payload={};try{payload=await r.json()}catch(_){payload={}}return{r,payload}}finally{clearTimeout(timer)}}
async function queryCnpj(raw){
 let endpointError=null;try{const{r,payload}=await fetchJson(`/api/cnpj?cnpj=${encodeURIComponent(raw)}`);if(r.ok&&payload?.data)return payload;endpointError=new Error(payload?.error||`Endpoint respondeu ${r.status}.`)}catch(err){endpointError=err}
 if(/[A-Z]/.test(raw))throw new Error('O CNPJ usa o padrão alfanumérico. O provedor gratuito atual ainda não oferece consulta compatível; preencha os dados manualmente.');
 try{const{r,payload}=await fetchJson(`https://brasilapi.com.br/api/cnpj/v1/${encodeURIComponent(raw)}`);if(!r.ok)throw new Error(payload?.message||`Base pública respondeu ${r.status}.`);return{provider:'BrasilAPI / Minha Receita',data:payload}}catch(err){if(endpointError)throw new Error('Não foi possível consultar o CNPJ agora. Você pode continuar preenchendo manualmente.');throw err}
}
function setLookupBusy(busy,title='Consultando e preparando sua simulação...',text='Buscando dados cadastrais públicos, identificando a atividade e recalculando os cenários.'){
 const box=$('lookupWork'),btn=$('lookupBtn'),results=$('resultado');
 if(box){box.hidden=!busy;if($('lookupWorkTitle'))$('lookupWorkTitle').textContent=title;if($('lookupWorkText'))$('lookupWorkText').textContent=text}
 if(btn){btn.disabled=busy;btn.innerHTML=busy?'<span class="btnHourglass" aria-hidden="true">⌛</span> Processando...':'Buscar empresa'}
 if(results){results.hidden=busy;results.setAttribute('aria-busy',busy?'true':'false')}
}
async function lookupCnpj(){
 const raw=$('cnpj').value.toUpperCase().replace(/[^A-Z0-9]/g,''),status=$('lookupStatus');if(raw.length!==14){status.className='status bad';status.textContent='Informe um CNPJ com 14 posições.';return}
 if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('cnpj');
 const started=Date.now();
 status.className='status';status.textContent='Consulta iniciada. Aguarde alguns instantes.';if($('companyCard'))$('companyCard').hidden=true;setLookupBusy(true);
 try{
  const payload=await queryCnpj(raw);
  const elapsed=Date.now()-started;if(elapsed<850)await new Promise(resolve=>setTimeout(resolve,850-elapsed));
  if($('lookupWorkTitle'))$('lookupWorkTitle').textContent='Empresa localizada. Recalculando os cenários...';
  if($('lookupWorkText'))$('lookupWorkText').textContent='Aplicando CNAE, enquadramento sugerido e premissas da empresa ao simulador.';
  companyData=payload.data;fillCompany(companyData);calculate();await new Promise(resolve=>setTimeout(resolve,250));
  status.className='status ok';status.textContent=`Dados encontrados em ${payload.provider||'base pública'}. Confirme o enquadramento antes de decidir.`
 }catch(err){
  const elapsed=Date.now()-started;if(elapsed<650)await new Promise(resolve=>setTimeout(resolve,650-elapsed));
  status.className='status bad';status.textContent=err?.name==='AbortError'?'A consulta demorou além do esperado. Tente novamente.':(err.message||'Falha na consulta.')
 }finally{setLookupBusy(false);calculate()}
}
function fillCompany(d){
 $('companyCard').hidden=false;$('companyName').textContent=d.razao_social||'Razão social não informada';$('companyTrade').textContent=d.nome_fantasia?`Nome fantasia: ${d.nome_fantasia}`:'Nome fantasia não informado';
 const active=(d.descricao_situacao_cadastral||'').toUpperCase()==='ATIVA';$('companyStatus').textContent=d.descricao_situacao_cadastral||'Situação não informada';$('companyStatus').className='chip '+(active?'ok':'bad');
 $('companySimple').textContent=d.opcao_pelo_simples===true?'Simples: sim':d.opcao_pelo_simples===false?'Simples: não':'Simples: não confirmado';$('companySimple').className='chip '+(d.opcao_pelo_simples===true?'ok':'');
 $('companyMei').textContent=d.opcao_pelo_mei===true?'MEI: sim':d.opcao_pelo_mei===false?'MEI: não':'MEI: não confirmado';$('companyMei').className='chip '+(d.opcao_pelo_mei===true?'ok':'');
 $('companySize').textContent=d.porte||d.descricao_porte||'Não informado';$('companyLocation').textContent=[d.municipio,d.uf].filter(Boolean).join(' / ')||'Não informado';$('companyNature').textContent=d.natureza_juridica||'Não informado';$('companyCnae').textContent=`${cnaeFmt(d.cnae_fiscal)} · ${d.cnae_fiscal_descricao||'Descrição não informada'}`;$('activity').value=`${cnaeFmt(d.cnae_fiscal)} · ${d.cnae_fiscal_descricao||''}`;
 if(d.opcao_pelo_simples===true)$('simpleStatus').value='yes';else if(d.opcao_pelo_simples===false)$('simpleStatus').value='no';else $('simpleStatus').value='unknown';
 if($('meiStatus'))$('meiStatus').value=d.opcao_pelo_mei===true?'yes':d.opcao_pelo_mei===false?'no':'unknown';
 cnaeSuggestion=inferActivity(d.cnae_fiscal,d.cnae_fiscal_descricao);$('annex').value=cnaeSuggestion.annex;$('annexHint').textContent=`Sugestão: Anexo ${cnaeSuggestion.annex}. Confiança ${cnaeSuggestion.confidence}. ${cnaeSuggestion.reason}.`;
 const kind=cnaeSuggestion.kind;if(kind==='service')numSet('legacyRate',5);else if(kind==='commerce'||kind==='industry')numSet('legacyRate',10);applyFactorR();
}
