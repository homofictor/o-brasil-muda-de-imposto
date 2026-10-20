/* Simples Decisão 360. QA sintético sem dados de empresas reais. */
(function(){
'use strict';
const base=window.SD360_QA_DATA;
if(!base||!Array.isArray(base.casos))return;
const doc=document,casos=base.casos;
const ids=['simples','anexo','rbt12','folha12','tributosExtra','receita','das',
'dasIntegralManual','taxaCbs','creditoCbs','taxaIbs','creditoIbs','admin','margem',
'b2b','elegiveis','credSimples','capture','chkDas','chkAliq','chkCred','chkB2b','chkEsp'];
const el=(d,id)=>d.getElementById(id);
const num=x=>(x===null||x===undefined||x==='')?null:Number(x);
function moeda(x){
 const t=String(x===undefined||x===null?'':x).replace(/\u00a0/g,' ').replace(/[^0-9.,+-]/g,'').replace(/\./g,'').replace(',','.');
 return t===''?null:Number(t);
}
function preencher(d,input){
 const mode=el(d,'modoDas');mode.value=input.modoDas||'auto';
 mode.dispatchEvent(new Event('change',{bubbles:true}));
 const fator=el(d,'sujeitaFatorR');fator.value=input.sujeitaFatorR||'nao';
 fator.dispatchEvent(new Event('change',{bubbles:true}));
 ids.forEach(id=>{
  const e=el(d,id);if(!e)return;
  if(e.type==='checkbox')e.checked=!!input[id];
  else e.value=input[id]===null||input[id]===undefined?'':String(input[id]);
 });
}
function verificar(d,item){
 const input=item.entrada,expected=item.esperado;
 preencher(d,input);el(d,'calcular').click();
 const status=el(d,'status').textContent.trim();
 const bloqueado=expected.status_esperado==='BLOQUEAR';
 const previsto=bloqueado?'Cálculo bloqueado':
  expected.status_esperado==='CALCULAR_DECLARADO'?'Verificações declaradas':'Simulação preliminar';
 const erros=[],medidos=[];
 function comparar(nome,real,padrao,tolerancia){
  const a=num(real),b=num(padrao);
  if(a===null&&b===null)return;
  medidos.push(nome);
  if(a===null||b===null||!Number.isFinite(a)||Math.abs(a-b)>(tolerancia===undefined?.031:tolerancia))
   erros.push(nome+': esperado '+String(padrao)+' / obtido '+String(real));
 }
 if(status!==previsto)erros.push('Estado esperado: '+previsto+'; observado: '+status);
 if(bloqueado){
  if(!el(d,'results').classList.contains('hidden'))erros.push('Resultado não oculto após bloqueio');
 }else{
  if(el(d,'results').classList.contains('hidden'))erros.push('Cálculo ficou oculto');
  comparar('DAS integral',el(d,'dasIntegralManual').value,expected.das_integral);
  comparar('IBS/CBS DAS',el(d,'das').value,expected.ibs_cbs_das);
  comparar('CBS/IBS regular',moeda(el(d,'hybridVal').textContent),expected.regular_total);
  comparar('Diferença própria',moeda(el(d,'ownDelta').textContent),expected.delta_proprio);
  comparar('Crédito extra ao comprador',moeda(el(d,'buyerDelta').textContent),expected.credito_adicional_comprador,.051);
  comparar('Negociação bruta',moeda(el(d,'captureVal').textContent),expected.captura_bruta,.051);
  comparar('Resultado comercial',moeda(el(d,'scenarioDelta').textContent),expected.delta_com_negociacao,.051);
  comparar('Créditos 20% menores',moeda(el(d,'lowCase').textContent),expected.sensibilidade_menos_credito,.051);
  comparar('Créditos 20% maiores',moeda(el(d,'highCase').textContent),expected.sensibilidade_mais_credito,.051);
  if(expected.margem_projetada_pct!==null&&expected.margem_projetada_pct!==undefined)
   comparar('Margem projetada',moeda(el(d,'marginDelta').textContent),expected.margem_projetada_pct,.015);
  const memo=el(d,'memoriaDas').textContent;
  if(input.modoDas==='auto'){
   if(!memo.includes('Anexo '+expected.anexo_efetivo))erros.push('Anexo incorreto');
   if(!memo.includes('Faixa '+expected.faixa))erros.push('Faixa incorreta');
   const cbs=memo.match(/(?:^|\| )CBS\s+R\$\s*([\d.,]+)/);
   const ibs=memo.match(/(?:^|\| )IBS\s+R\$\s*([\d.,]+)/);
   if(!cbs)erros.push('CBS ausente da memória');
   else comparar('CBS no DAS',moeda(cbs[1]),expected.cbs_das);
   if(!ibs)erros.push('IBS ausente da memória');
   else comparar('IBS no DAS',moeda(ibs[1]),expected.ibs_das);
   if(!!expected.iss_cap!==memo.includes('Limite de ISS de 5% aplicado'))erros.push('Tratamento do limite ISS divergente');
  }
 }
 return {id:input.id,nome:input.empresa,previsto:expected.status_esperado,observado:status,
  ok:erros.length===0,erros,indicadores:medidos.length};
}
window.SD360QA={casos,preencher,verificar,version:'QA-20261019'};
if(new URLSearchParams(window.location.search).has('qa-runner'))return;
const style=doc.createElement('style');
style.textContent=[
'.sdqa-wrap{width:min(1160px,calc(100% - 48px));margin:20px auto 0}',
'.sdqa-card{border:1px solid #c9d5e0;background:white;border-radius:12px;color:#183148}',
'.sdqa-card summary{cursor:pointer;font-weight:750;color:#164367;padding:16px}',
'.sdqa-content{border-top:1px solid #e0e7ee;padding:18px}',
'.sdqa-note{color:#64798b;font-size:12px;margin:0 0 14px}',
'.sdqa-row{display:flex;align-items:end;flex-wrap:wrap;gap:9px}',
'.sdqa-field{flex:1 1 240px;display:grid;gap:5px;font-size:12px;font-weight:700}',
'.sdqa-field select{width:100%;min-height:42px;padding:9px;border:1px solid #c2d1df;border-radius:8px}',
'.sdqa-btn{cursor:pointer;border:1px solid #c2d1df;border-radius:8px;min-height:42px;padding:9px 12px;background:#f7f9fc;color:#193b57;font-size:12px;font-weight:700}',
'.sdqa-btn-primary{background:#19476d;color:white;border-color:#19476d}',
'.sdqa-btn:disabled{opacity:.5;cursor:not-allowed}',
'.sdqa-summary{margin:15px 0 9px;color:#304e65;font-size:13px;font-weight:750}',
'.sdqa-scroll{max-height:350px;overflow:auto;border:1px solid #dce6ed;border-radius:9px}',
'.sdqa-table{width:100%;border-collapse:collapse;font-size:12px;min-width:630px}',
'.sdqa-table th,.sdqa-table td{padding:10px;vertical-align:top;text-align:left;border-bottom:1px solid #e3e9ef}',
'.sdqa-table th{background:#eff4f8;position:sticky;top:0}',
'.sdqa-pass{color:#196b4f;font-weight:700}.sdqa-error{color:#a33f37;font-weight:700}',
'@media(max-width:650px){.sdqa-wrap{width:calc(100% - 28px)}.sdqa-content{padding:12px}.sdqa-btn{flex:1 1 120px}}'
].join('\n');
doc.head.appendChild(style);
const wrap=doc.createElement('div');wrap.className='sdqa-wrap';
wrap.innerHTML='<details class="sdqa-card" id="sdqa-details">'+
'<summary>Laboratório de testes | 28 empresas fictícias</summary>'+
'<div class="sdqa-content">'+
'<p class="sdqa-note">Use os cenários fictícios para preencher o formulário ou conferir automaticamente as respostas com o gabarito. As alíquotas do regime regular são premissas de teste, não parâmetros oficiais homologados.</p>'+
'<div class="sdqa-row"><div class="sdqa-field"><label for="sdqa-case">Cenário de teste</label><select id="sdqa-case"></select></div>'+
'<button type="button" class="sdqa-btn" id="sdqa-load">Carregar no formulário</button>'+
'<button type="button" class="sdqa-btn" id="sdqa-one">Testar selecionado</button>'+
'<button type="button" class="sdqa-btn sdqa-btn-primary" id="sdqa-all">Executar os 28 testes</button>'+
'<button type="button" class="sdqa-btn" id="sdqa-export" disabled>Exportar CSV</button></div>'+
'<div class="sdqa-summary" id="sdqa-summary" aria-live="polite">Nenhum teste executado nesta sessão.</div>'+
'<div class="sdqa-scroll"><table class="sdqa-table"><thead><tr><th>ID</th><th>Empresa</th><th>Esperado</th><th>Observado</th><th>Comparação</th></tr></thead>'+
'<tbody id="sdqa-results"><tr><td colspan="5">Selecione um cenário ou execute a bateria completa.</td></tr></tbody></table></div>'+
'</div></details>';
const main=doc.querySelector('main');
if(main)main.parentNode.insertBefore(wrap,main);else doc.body.prepend(wrap);
const sel=el(doc,'sdqa-case');
casos.forEach((item,i)=>{
 const opt=doc.createElement('option');opt.value=String(i);
 opt.textContent=item.entrada.id+' | '+item.entrada.empresa+' | '+item.entrada.objetivo;
 sel.appendChild(opt);
});
let ultimos=[];
function mostrar(resultados){
 ultimos=resultados.slice();
 const body=el(doc,'sdqa-results');body.replaceChildren();
 let ok=0;
 resultados.forEach(t=>{
  if(t.ok)ok++;
  const tr=doc.createElement('tr');
  const values=[t.id,t.nome,t.previsto,t.observado,t.ok?
   'APROVADO | '+t.indicadores+' indicadores':'DIVERGÊNCIA | '+t.erros.join(' | ')];
  values.forEach((value,i)=>{
   const td=doc.createElement('td');td.textContent=value;
   if(i===4)td.className=t.ok?'sdqa-pass':'sdqa-error';
   tr.appendChild(td);
  });
  body.appendChild(tr);
 });
 el(doc,'sdqa-summary').textContent=ok+'/'+resultados.length+
   ' aprovados; '+(resultados.length-ok)+' divergências. '+new Date().toLocaleString('pt-BR')+'.';
 el(doc,'sdqa-export').disabled=false;
}
function lock(active){
 ['sdqa-load','sdqa-one','sdqa-all','sdqa-case','sdqa-export'].forEach(id=>{
  el(doc,id).disabled=active||(id==='sdqa-export'&&!ultimos.length);
 });
}
el(doc,'sdqa-load').addEventListener('click',()=>{
 const item=casos[Number(sel.value)];if(!item)return;
 preencher(doc,item.entrada);el(doc,'calcular').click();
 el(doc,'sdqa-summary').textContent=item.entrada.id+
  ' carregado e calculado no formulário. Caso fictício, não comprova elegibilidade fiscal.';
 el(doc,'memoriaDas').scrollIntoView({block:'nearest',behavior:'smooth'});
});
async function executar(todos){
 lock(true);
 el(doc,'sdqa-summary').textContent='Executando '+(todos?'28 casos':'o caso selecionado')+' isoladamente...';
 let iframe;
 try{
  iframe=doc.createElement('iframe');iframe.title='Testes sintéticos isolados';
  iframe.hidden=true;iframe.setAttribute('aria-hidden','true');
  const target=new URL(window.location.href);target.searchParams.set('qa-runner','1');target.hash='';
  const ready=new Promise((resolve,reject)=>{
   iframe.addEventListener('load',resolve,{once:true});
   iframe.addEventListener('error',()=>reject(new Error('Erro ao carregar quadro de teste')),{once:true});
  });
  iframe.src=target.toString();doc.body.appendChild(iframe);
  await ready;
  const suite=iframe.contentWindow.SD360QA;
  if(!suite)throw Error('Módulo de teste indisponível no quadro isolado.');
  const lista=todos?casos:[casos[Number(sel.value)]];
  const resultados=lista.map(c=>suite.verificar(iframe.contentDocument,c));
  mostrar(resultados);
 }catch(error){el(doc,'sdqa-summary').textContent='Falha de execução: '+error.message;}
 finally{if(iframe)iframe.remove();lock(false);}
}
el(doc,'sdqa-one').addEventListener('click',()=>executar(false));
el(doc,'sdqa-all').addEventListener('click',()=>executar(true));
el(doc,'sdqa-export').addEventListener('click',()=>{
 if(!ultimos.length)return;
 const q=s=>'"'+String(s===null||s===undefined?'':s).replace(/"/g,'""')+'"';
 const header=['id','empresa','esperado','observado','aprovado','indicadores','divergencias'];
 const rows=[header.map(q).join(';')];
 ultimos.forEach(t=>rows.push([t.id,t.nome,t.previsto,t.observado,
   t.ok?'sim':'nao',t.indicadores,t.erros.join(' | ')].map(q).join(';')));
 const blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob);const a=doc.createElement('a');
 a.href=url;a.download='simples-decisao-resultados-testes.csv';
 doc.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
});
})();