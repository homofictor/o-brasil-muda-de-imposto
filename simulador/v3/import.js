window.brmiImport={files:[],candidates:[],docs:[]};
const BRMI_AUTOMATION_KEY='brmi_automation_mode';
function importAutomationMode(){
 const raw=localStorage.getItem(BRMI_AUTOMATION_KEY)||'recommended';
 return ['rigorous','recommended','maximum'].includes(raw)?raw:'recommended';
}
function automationModeLabel(mode=importAutomationMode()){
 return mode==='rigorous'?'Mais rigor':mode==='maximum'?'Máxima automação':'Recomendado';
}
function clearAutoImportedForMode(){
 const fields=new Set((brmiImport.candidates||[]).map(x=>x?.field).filter(Boolean));
 fields.forEach(id=>{
  if(id==='cnpj')return;
  const el=$(id);if(!el||el.dataset.userEdited==='1'||el.dataset.importAccepted==='1'||el.dataset.importVerified!=='1')return;
  el.value='';delete el.dataset.importVerified;delete el.dataset.importSource;delete el.dataset.importConfidence;delete el.dataset.importDerivedKey;delete el.dataset.sourceNote;
 });
}
window.getBrmiAutomationMode=importAutomationMode;
window.setBrmiAutomationMode=function(mode,{reapply=true}={}){
 const next=['rigorous','recommended','maximum'].includes(mode)?mode:'recommended';
 localStorage.setItem(BRMI_AUTOMATION_KEY,next);
 if(reapply&&brmiImport.candidates?.length){
  clearAutoImportedForMode();
  autoApplyDocumentCalculations();
  writeVerifiedAccountingProfit();
  updateEconomicMetricAvailability();
  if(typeof financialMetrics==='function')financialMetrics();
  if(typeof calculate==='function')calculate();
  renderImportCandidates();
 }
 document.dispatchEvent(new CustomEvent('brmi:automation-mode',{detail:{mode:next,label:automationModeLabel(next)}}));
 return next;
};

function importMarkup(){return `<section class="panel importPanel" id="importPanel">
 <div class="sectionTitle"><div><span>05</span><div><div class="importTitleTag">V3.2 · preenchimento inteligente</div><h2>Importar dados da empresa</h2></div></div><p>Envie o que tiver disponível. O simulador localiza números úteis, mostra a fonte, aplica automaticamente apenas dados seguros e mantém aproximações para revisão.</p></div>
 <div class="importDrop" id="importDrop" tabindex="0" role="button" aria-label="Selecionar documentos da empresa"><strong>Arraste Balanço, DRE ou relatórios do ERP</strong><p>Você pode combinar vários arquivos. Quanto mais informação consistente houver, menos campos precisarão ser preenchidos manualmente.</p><button id="importChooseBtn" type="button">Selecionar arquivos</button><small>Formatos: PDF com texto pesquisável, CSV, XLS e XLSX · múltiplos arquivos permitidos</small><input id="importFiles" type="file" multiple accept=".pdf,.csv,.xls,.xlsx,text/csv,application/pdf" hidden></div>
 <div class="importPrivacy"><b>🔒</b><div><strong>Processamento local nesta versão.</strong> Os arquivos são lidos no seu navegador para montar as sugestões e não são enviados ao servidor do simulador.</div></div>
 <div id="importProgress" class="importProgress" hidden><span class="importSpinner"></span><div><strong id="importProgressTitle">Analisando documentos...</strong><small id="importProgressText">Identificando estrutura e indicadores.</small></div></div>
 <div id="importFileList" class="importFileList"></div>
 <div id="importSummary" class="importSummary" hidden><div class="importSummaryHead"><div><h3>Informações encontradas</h3><p>Confira a origem e a confiança de cada sugestão antes de usar.</p></div><span id="importSummaryCount" class="importSummaryCount">0 sugestões</span></div><div id="importCandidateGroups" class="importCandidateGroups"></div><div class="importActions"><button class="importApplyHigh" id="importApplyHigh" type="button">Aplicar e confirmar sugestões seguras</button><button class="importClear" id="importClear" type="button">Limpar documentos e dados importados</button></div></div>
 <div id="importEmpty" class="importEmpty" hidden>Não encontramos indicadores suficientes nesse arquivo. Você pode manter o preenchimento manual ou adicionar outro documento.</div>
 </section>`}

function loadImportScript(src,test){if(test())return Promise.resolve();return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Não foi possível carregar o leitor necessário.'));document.head.appendChild(s)})}
async function ensureXlsx(){await loadImportScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',()=>typeof XLSX!=='undefined')}
async function ensurePdf(){await loadImportScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',()=>typeof pdfjsLib!=='undefined');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'}
function normImport(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim()}
function brNum(s){if(typeof s==='number')return s;const raw=String(s||'').trim(),paren=/^\(.*\)$/.test(raw);let x=raw.replace(/R\$|\s/g,'').replace(/[^0-9,.-]/g,'');if(!x)return NaN;if(x.includes(',')&&x.includes('.'))x=x.replace(/\./g,'').replace(',','.');else if(x.includes(','))x=x.replace(',','.');const n=Number(x);return paren&&Number.isFinite(n)?-Math.abs(n):n}
function fmtMoney(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2}).format(v)}
function fmtPct(v){return `${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1})}%`}
function extOf(name){return String(name||'').split('.').pop().toLowerCase()}
function importedCnpjDigits(v){return String(v||'').replace(/\D/g,'')}
function validImportedCnpj(v){const d=importedCnpjDigits(v);if(d.length!==14||/^(\d)\1{13}$/.test(d))return false;const digit=(base,weights)=>{const sum=base.split('').reduce((a,n,i)=>a+Number(n)*weights[i],0),r=sum%11;return r<2?0:11-r};return digit(d.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2])===Number(d[12])&&digit(d.slice(0,13),[6,5,4,3,2,9,8,7,6,5,4,3,2])===Number(d[13])}
function formatImportedCnpj(v){const d=importedCnpjDigits(v);return d.length===14?`${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`:String(v||'')}
function detectImportedCnpj(text,type){const source=String(text||''),re=/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,found=new Map();let m;while((m=re.exec(source))){const digits=importedCnpjDigits(m[0]);if(!validImportedCnpj(digits))continue;const context=normImport(source.slice(Math.max(0,m.index-140),Math.min(source.length,m.index+m[0].length+100)));let score=1;if(/cnpj/.test(context))score+=4;if(/entidade|nome empresarial|titular da escrituracao/.test(context))score+=6;if(/signatario|certificado|responsavel legal|contador/.test(context))score-=7;const item=found.get(digits)||{digits,count:0,score:0};item.count++;item.score+=score;found.set(digits,item)}const ranked=[...found.values()].sort((a,b)=>(b.score+b.count*2)-(a.score+a.count*2)),best=ranked[0],second=ranked[1];if(!best||!(best.count>=2||best.score>=8))return null;if(second&&(best.score+best.count*2)<=(second.score+second.count*2)+2)return null;return best.digits}
function csvRows(text){const first=(text.split(/\r?\n/)[0]||''),sep=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';const rows=[];let row=[],cur='',quote=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(quote&&n==='"'){cur+='"';i++}else quote=!quote}else if(c===sep&&!quote){row.push(cur);cur=''}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&n==='\n')i++;row.push(cur);if(row.some(v=>String(v).trim()))rows.push(row);row=[];cur=''}else cur+=c}row.push(cur);if(row.some(v=>String(v).trim()))rows.push(row);return rows}
function rowsText(rows){return rows.map(r=>r.map(v=>String(v??'')).join(' | ')).join('\n')}
function pdfItemsToText(items){const rows=[];for(const it of items||[]){const str=String(it.str||'').trim();if(!str)continue;const x=Number(it.transform?.[4]||0),y=Number(it.transform?.[5]||0);let row=rows.find(r=>Math.abs(r.y-y)<=1.5);if(!row){row={y,items:[]};rows.push(row)}row.items.push({x,str})}return rows.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n')}
async function ensureOcr(){await loadImportScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',()=>typeof Tesseract!=='undefined')}
async function ocrPdfPage(page){
 const viewport=page.getViewport({scale:1.8}),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:ctx,viewport}).promise;
 await ensureOcr();const result=await Tesseract.recognize(canvas,'por',{logger:()=>{}});return String(result?.data?.text||'')
}
function textLooksSparse(text){const s=String(text||'').replace(/\s+/g,' ').trim();return s.length<180||((s.match(/[A-Za-zÀ-ÿ]/g)||[]).length<80)}
async function readImportFile(file){
 const ext=extOf(file.name);
 if(ext==='csv'){let text=await file.text();return{rows:csvRows(text),text,type:'CSV',extraction:'structured'}}
 if(ext==='xls'||ext==='xlsx'){await ensureXlsx();const ab=await file.arrayBuffer(),wb=XLSX.read(ab,{type:'array'}),rows=[];wb.SheetNames.forEach(n=>{rows.push([`PLANILHA: ${n}`]);rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:''}))});return{rows,text:rowsText(rows),type:'Excel',extraction:'structured'}}
 if(ext==='pdf'){
  await ensurePdf();const ab=await file.arrayBuffer(),pdf=await pdfjsLib.getDocument({data:ab}).promise,pages=[],methods=[];
  for(let p=1;p<=pdf.numPages;p++){
   const page=await pdf.getPage(p),content=await page.getTextContent(),direct=pdfItemsToText(content.items);
   if(textLooksSparse(direct)){
    try{const ocr=await ocrPdfPage(page);pages.push(ocr.length>direct.length?ocr:direct);methods.push(ocr.length>direct.length?'ocr':'text')}
    catch(_){pages.push(direct);methods.push('text')}
   }else{pages.push(direct);methods.push('text')}
  }
  return{rows:null,text:pages.map((x,i)=>`PÁGINA ${i+1}\n${x}`).join('\n'),type:'PDF',extraction:methods.includes('ocr')?'text+ocr':'text'}
 }
 throw new Error('Formato não suportado.')
}
function detectDoc(text,rows){const t=normImport(text),balance=(/balanco patrimonial/.test(t)||((/ativo circulante/.test(t)||(/\bativo\b/.test(t)&&/\bcirculante\b/.test(t)))&&/\bpassivo\b/.test(t)&&/patrimonio liquido/.test(t))),dreTitle=/demonstracao\s+(?:d[eo]\s+)?resultado/.test(t),dre=dreTitle||(/receitas?\s+(?:bruta(?:s)?|operacional(?:is)?|liquida(?:s)?)/.test(t)&&(/lucro bruto|lucro liquido|resultado do exercicio|resultado antes|despesas operacionais|despesas financeiras|custos e despesas|ebitda|lajida/.test(t)));if(balance&&dre)return'Balanço + DRE';if(balance)return'Balanço';if(dre)return'DRE';if(rows&&/fornecedor|compra|entrada|contas a pagar/.test(t))return'Relatório de compras';if(rows&&/cliente|venda|faturamento|nota fiscal|contas a receber/.test(t))return'Relatório de vendas';if(/saldo anterior|saldo inicial/.test(t)&&/debito|debitos/.test(t)&&/credito|creditos/.test(t)&&/saldo atual|saldo final/.test(t))return'Balancete';if(/folha de pagamento|salarios|pro labore/.test(t))return'Folha / pessoal';return'Relatório'}
function importStatementSections(text){const source=String(text||''),bpStart=source.search(/balan[cç]o patrimonial/i),dreStart=source.search(/demonstra[cç][aã]o\s+(?:d[eo]\s+)?resultado/i);return{balance:bpStart>=0?source.slice(bpStart,dreStart>bpStart?dreStart:undefined):source,dre:dreStart>=0?source.slice(dreStart):source}}
function lineValue(text,labels,exclude=[]){const lines=String(text||'').split(/\r?\n/);for(const line of lines){const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;const matches=line.match(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|-?\d+(?:[.,]\d{1,2})?/g)||[];const nums=matches.map(brNum).filter(Number.isFinite);if(nums.length)return nums[nums.length-1]}return null}
function firstLineValue(text,labelGroups){for(const labels of labelGroups){const v=lineValue(text,labels);if(v!=null)return v}return null}
function lastLineValue(text,labels,exclude=[]){const lines=String(text||'').split(/\r?\n/);let found=null;for(const line of lines){const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;const matches=line.match(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|-?\d+(?:[.,]\d{1,2})?/g)||[],nums=matches.map(brNum).filter(Number.isFinite);if(nums.length)found=nums[nums.length-1]}return found}
function lastFirstLineValue(text,labelGroups){for(const labels of labelGroups){const v=lastLineValue(text,labels);if(v!=null)return v}return null}

function importNumberTokens(line){
 const matches=String(line||'').match(/\(?\s*(?:R\$\s*)?-?(?:\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*\)?/g)||[];
 return matches.map(brNum).filter(Number.isFinite)
}
function statementRows(text){
 const raw=String(text||'').split(/\r?\n/),rows=[];let pending='';
 for(const original of raw){
  const line=String(original||'').trim();if(!line)continue;
  const nums=importNumberTokens(line),n=normImport(line);
  const metadata=/^(entidade|periodo da escrituracao|periodo selecionado|numero de ordem do livro|descricao nota|balanco patrimonial|demonstracao de resultado)/.test(n);
  if(nums.length){
   rows.push((pending?pending+' ':'')+line);pending='';
  }else if(metadata){
   if(pending){rows.push(pending);pending=''}rows.push(line);
  }else{
   pending=pending?pending+' '+line:line;
   if(pending.length>220){rows.push(pending);pending=''}
  }
 }
 if(pending)rows.push(pending);return rows
}
function comparativeOrder(text){
 const lines=String(text||'').split(/\r?\n/).slice(0,60),head=normImport(lines.join(' '));
 if(/saldo inicial.*saldo final/.test(head)||/saldo anterior.*saldo atual/.test(head))return'latest-last';
 if(/saldo final.*saldo inicial/.test(head)||/saldo atual.*saldo anterior/.test(head))return'latest-first';
 for(const line of lines){
  const years=(line.match(/20\d{2}/g)||[]).map(Number),unique=[...new Set(years)];
  if(unique.length>=2){if(unique[0]>unique[1])return'latest-first';if(unique[0]<unique[1])return'latest-last'}
 }
 return null
}
function orderedLineValues(line,order){
 const nums=importNumberTokens(line);if(!nums.length)return{latest:null,prior:null,ordered:false};
 if(nums.length===1)return{latest:nums[0],prior:null,ordered:false};
 const pair=nums.slice(-2);
 if(order==='latest-last')return{latest:pair[1],prior:pair[0],ordered:true};
 if(order==='latest-first')return{latest:pair[0],prior:pair[1],ordered:true};
 /* Sem cabeçalho comparativo reconhecido, a última coluna numérica é o saldo.
    Isso evita confundir códigos de conta (11, 24, 123, 112025...) com valores. */
 return{latest:nums[nums.length-1],prior:null,ordered:false}
}
function accountingRowCode(line){
 const s=String(line||'').trim();if(!s||/^total\s*-/i.test(s))return'';
 const m=s.match(/^(\d+(?:\.\d+)*|\d{2,})(?:\s+\d+)?\s+/);return m?m[1].replace(/\D/g,''):''
}
function accountingSemanticText(line){
 let s=String(line||'').trim();
 s=s.replace(/^\d+(?:\.\d+)*(?:\s+\d+)?\s+/,'').replace(/^total\s*-\s*/i,'');
 return normImport(s)
}
function accountingRowIsTotal(line){return /^total\s*-/i.test(String(line||'').trim())}
function accountingSectionValue(text,sectionMatcher,childMatcher,exclude=[]){
 const order=comparativeOrder(text),rows=statementRows(text);let active=false;
 for(const row of rows){
  const n=accountingSemanticText(row),code=accountingRowCode(row);
  if(sectionMatcher(n)){active=true;continue}
  if(active&&code&&code.length<=2&&!sectionMatcher(n))break;
  if(active&&childMatcher(n)&&!exclude.some(x=>n.includes(x))){const v=orderedLineValues(row,order);if(v.latest!=null)return v}
 }
 return{latest:null,prior:null,ordered:false}
}
function latestLineValues(text,labels,exclude=[]){
 const order=comparativeOrder(text),lines=statementRows(text);
 for(const line of lines){
  const n=normImport(line);if(/^(demonstracao|periodo|ano\b|exercicio\b)/.test(n))continue;if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;
  return orderedLineValues(line,order)
 }
 return{latest:null,prior:null,ordered:false}
}
function latestLineValue(text,labels,exclude=[]){return latestLineValues(text,labels,exclude).latest}
function sectionLineValue(text,sectionLabels,childLabels,exclude=[]){
 const order=comparativeOrder(text),rows=statementRows(text);let section=false;
 for(const row of rows){const n=normImport(row);
  if(sectionLabels.some(x=>n===x||n.startsWith(x+' '))){section=true;continue}
  if(section&&/^(passivo|ativo|patrimonio liquido|permanente|nao circulante|passivo exigivel)/.test(n)&&!childLabels.some(x=>n.includes(x)))break;
  if(section&&childLabels.some(x=>n===x||n.startsWith(x+' '))&&!exclude.some(x=>n.includes(x))){const v=orderedLineValues(row,order);if(v.latest!=null)return v}
 }return{latest:null,prior:null,ordered:false}
}

function firstLatestLineValue(text,labelGroups,exclude=[]){for(const labels of labelGroups){const v=latestLineValue(text,labels,exclude);if(v!=null)return v}return null}
function signedLatestLineValue(text,labels,exclude=[]){
 const order=comparativeOrder(text),lines=statementRows(text);
 for(const line of lines){
  const n=accountingSemanticText(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;
  const vals=orderedLineValues(line,order);if(vals.latest==null)continue;
  const dc=String(line).match(/\s([DC])\s*$/i),base=vals.latest;
  if(dc)return dc[1].toUpperCase()==='D'?-Math.abs(base):Math.abs(base);
  return base
 }
 return null
}
function firstSignedLatestLineValue(text,labelGroups,exclude=[]){for(const labels of labelGroups){const v=signedLatestLineValue(text,labels,exclude);if(v!=null)return v}return null}
function sumAccountingLeafValues(text,matcher,exclude=[]){
 const order=comparativeOrder(text),rows=statementRows(text),hits=[];
 for(const row of rows){
  const n=accountingSemanticText(row);if(!matcher(n)||exclude.some(x=>n.includes(x))||accountingRowIsTotal(row))continue;
  const vals=orderedLineValues(row,order),code=accountingRowCode(row);if(vals.latest==null)continue;
  hits.push({code,value:Math.abs(vals.latest)})
 }
 if(!hits.length)return null;
 const coded=hits.filter(x=>x.code),use=coded.length?coded.filter(a=>!coded.some(b=>b!==a&&b.code.startsWith(a.code)&&b.code.length>a.code.length)):hits;
 return use.reduce((s,x)=>s+x.value,0)
}
function comparativeCategoryTotal(text,labelGroups,exclude=[]){
 const order=comparativeOrder(text),lines=statementRows(text);
 for(const labels of labelGroups){
  let latest=0,prior=0,count=0,priorCount=0;
  for(const line of lines){
   const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;
   const vals=orderedLineValues(line,order);if(vals.latest==null)continue;
   latest+=Math.abs(vals.latest);count++;if(vals.prior!=null){prior+=Math.abs(vals.prior);priorCount++}
  }
  if(count)return{end:latest,start:priorCount===count?prior:null,ordered:order!=null,count}
 }
 return{end:0,start:null,ordered:false,count:0}
}
function accountDepth(line){
 const s=String(line||'').trim(),m=s.match(/^((?:\d+[.\- ]){1,6}\d*)\s+/);
 if(m)return(m[1].match(/\d+/g)||[]).length;
 const lead=(String(line||'').match(/^\s*/)||[''])[0].length;return Math.floor(lead/2)+1
}
function hierarchicalCategoryTotal(text,matcher,exclude=[]){
 const order=comparativeOrder(text),rows=statementRows(text),hits=[];
 rows.forEach((row,index)=>{
  const n=accountingSemanticText(row);if(!matcher(n)||exclude.some(x=>n.includes(x)))return;
  const vals=orderedLineValues(row,order);if(vals.latest==null)return;
  hits.push({row,index,n,code:accountingRowCode(row),isTotal:accountingRowIsTotal(row),depth:accountDepth(row),vals})
 });
 if(!hits.length)return{end:0,start:null,count:0,method:'none'};
 const coded=hits.filter(h=>h.code&&!h.isTotal);
 if(coded.length){
  const parents=coded.filter(a=>coded.some(b=>b!==a&&b.code.startsWith(a.code)&&b.code.length>a.code.length));
  const use=parents.length?parents.filter(a=>!parents.some(p=>p!==a&&a.code.startsWith(p.code)&&a.code.length>p.code.length)):coded;
  const end=use.reduce((s,h)=>s+Math.abs(h.vals.latest),0),priorKnown=use.every(h=>h.vals.prior!=null),start=priorKnown?use.reduce((s,h)=>s+Math.abs(h.vals.prior),0):null;
  return{end,start,count:use.length,method:parents.length?'account-code-hierarchy':'account-code-lines'}
 }
 const totals=hits.filter(h=>h.isTotal);
 const pool=totals.length?totals:hits;
 const end=pool.reduce((s,h)=>s+Math.abs(h.vals.latest),0),priorKnown=pool.every(h=>h.vals.prior!=null),start=priorKnown?pool.reduce((s,h)=>s+Math.abs(h.vals.prior),0):null;
 return{end,start,count:pool.length,method:totals.length?'explicit-total':'lines'}
}
function accountingCanonicalMap(text,docType){
 const order=comparativeOrder(text),rows=statementRows(text),out=[];let section='',parent='';
 const rules=[
  ['asset.current.cash',/^(caixa|bancos conta|depositos bancarios)/],['asset.current.investments',/^(aplicacoes financeiras|titulos e valores mobiliarios)/],
  ['asset.current.receivables',/^(clientes|duplicatas a receber|contas a receber|valor(?:es)? a receber|financiamento das vendas|contas vinculadas com a fabrica)/],
  ['asset.current.inventory',/^(estoques?|mercadorias para revenda|produtos acabados|materias primas)/],
  ['asset.current.taxCredits',/^(impostos.*compensar|tributos a recuperar|impostos a recuperar)/],['asset.noncurrent.fixedAssets',/^imobilizado/],
  ['liability.current.suppliers',/^(fornecedor|fornecedores|contas a pagar.*fornecedores)/],['liability.tax',/^(impostos a pagar|tributos a recolher|impostos a recolher)/],
  ['liability.financialDebt',/^(emprestimos?|financiamentos?|mutuos?|arrendamento mercantil|leasing|parcelamentos? (?:fiscais|tributarios|de impostos|de tributos))/],
  ['equity',/^patrimonio liquido/],['income.grossRevenue',/^(receita bruta|faturamento bruto|vendas brutas)/],['income.netRevenue',/^(receita liquida|vendas liquidas)/],
  ['expense.directCosts',/^custos? diretos?/],['expense.indirectCosts',/^custos? indiretos?/],['expense.payroll',/^(mao de obra|salarios|ordenados|pessoal e encargos|despesas com pessoal)/],
  ['expense.admin',/^despesas? (?:gerais da )?administrativas?/],['expense.financial',/^(despesas? financeiras|juros passivos|encargos financeiros)/],
  ['expense.tax',/^despesas? tributarias/],['expense.depreciation',/^(depreciacao|amortizacao)/],['result.net',/^(resultado (?:do )?exercicio|lucro liquido)/]
 ];
 const allowed=(key,sec)=>{
  if(key.startsWith('asset.'))return sec==='asset';
  if(key.startsWith('liability.'))return sec==='liability';
  if(key==='equity')return sec==='equity';
  if(key.startsWith('income.')||key.startsWith('expense.')||key.startsWith('result.'))return sec==='income';
  return true
 };
 for(const row of rows){
  const n=accountingSemanticText(row),vals=orderedLineValues(row,order),code=accountingRowCode(row),isTotal=accountingRowIsTotal(row);
  if(/^ativo(?: |$)/.test(n)){section='asset';parent=/nao circulante/.test(n)?'asset.noncurrent':/circulante/.test(n)?'asset.current':'asset'}
  if(/^passivo(?: |$)/.test(n)){section='liability';parent=/nao circulante/.test(n)?'liability.noncurrent':/circulante/.test(n)?'liability.current':'liability'}
  if(/^(nao circulante|exigivel a longo prazo)(?: |$)/.test(n))parent=section+'.noncurrent';
  else if(/^circulante(?: |$)/.test(n))parent=section+'.current';
  if(/^patrimonio liquido(?: |$)/.test(n)){section='equity';parent='equity'}
  if(docType!=='Balanço'&&/^(receita|vendas|custos?|despesas?|resultado|lucro|impostos s vendas|impostos sobre vendas|provisoes)/.test(n)){section='income';parent='income'}
  let canonical=null;for(const [key,re] of rules){if(re.test(n)&&allowed(key,section)){canonical=key;break}}
  if(canonical&&vals.latest!=null)out.push({canonical,row,n,code,isTotal,latest:vals.latest,prior:vals.prior,ordered:vals.ordered,depth:accountDepth(row),section,parent});
 }
 return out
}
function canonicalTotal(map,key){
 const hits=map.filter(x=>x.canonical===key);if(!hits.length)return null;
 const coded=hits.filter(x=>x.code&&!x.isTotal);
 if(coded.length){
  const parents=coded.filter(a=>coded.some(b=>b!==a&&b.code.startsWith(a.code)&&b.code.length>a.code.length));
  const use=parents.length?parents.filter(a=>!parents.some(p=>p!==a&&a.code.startsWith(p.code)&&a.code.length>p.code.length)):coded;
  return{latest:use.reduce((s,x)=>s+Math.abs(x.latest),0),prior:use.every(x=>x.prior!=null)?use.reduce((s,x)=>s+Math.abs(x.prior),0):null,count:use.length,method:parents.length?'canonical-hierarchy':'canonical-lines'}
 }
 const totals=hits.filter(x=>x.isTotal),use=totals.length?totals:hits;
 return{latest:use.reduce((s,x)=>s+Math.abs(x.latest),0),prior:use.every(x=>x.prior!=null)?use.reduce((s,x)=>s+Math.abs(x.prior),0):null,count:use.length,method:totals.length?'canonical-total':'canonical-lines'}
}
function accountingAudit(map){
 const counts={};map.forEach(x=>counts[x.canonical]=(counts[x.canonical]||0)+1);
 return{classified:map.length,concepts:Object.keys(counts).length,counts}
}
function financialDebtBalances(text){
 const order=comparativeOrder(text),rows=statementRows(text);
 const make=()=>({specificEnd:0,specificStart:0,specificCount:0,specificPriorCount:0,broadEnd:0,broadStart:null,taxEnd:0,taxStart:0,taxCount:0,taxPriorCount:0});
 const sections={current:make(),noncurrent:make(),other:make()};let section='other',liabilitySeen=false;
 const addSpecific=(s,v)=>{s.specificEnd+=Math.abs(v.latest);s.specificCount++;if(v.prior!=null){s.specificStart+=Math.abs(v.prior);s.specificPriorCount++}};
 const addTax=(s,v)=>{s.taxEnd+=Math.abs(v.latest);s.taxCount++;if(v.prior!=null){s.taxStart+=Math.abs(v.prior);s.taxPriorCount++}};
 for(const row of rows){
  const n=normImport(row);
  if(n.includes('passivo e patrimonio liquido')){liabilitySeen=true;section='other';continue}
  if(n.includes('passivo nao circulante')||n.includes('exigivel a longo prazo')){liabilitySeen=true;section='noncurrent';continue}
  if(n.includes('passivo circulante')&&!n.includes('nao circulante')){liabilitySeen=true;section='current';continue}
  if(n.includes('patrimonio liquido')){if(liabilitySeen)section='other';continue}
  if(!liabilitySeen)continue;
  const vals=orderedLineValues(row,order);if(vals.latest==null)continue;
  const s=sections[section];
  const tax=/parcelament(o|os) (de )?(impostos|tributos)|parcelament(o|os) (fiscais|tributarios)/.test(n);
  const mutual=/mutuo|emprestimos? de socios|emprestimos? de pessoas ligadas|emprestimos? de partes relacionadas/.test(n);
  const specific=/emprestimos? e financiamentos?.*(banco|bancari|terceir)|financiamentos? bancari|emprestimos? bancari|arrendamento mercantil|leasing/.test(n);
  const broad=/(^| )emprestimos?( |$)|emprestimos? e financiamentos?/.test(n)&&!specific&&!mutual;
  if(tax){addTax(s,vals);continue}
  if(mutual||specific){addSpecific(s,vals);continue}
  if(broad){
   const end=Math.abs(vals.latest),prior=vals.prior==null?null:Math.abs(vals.prior);
   if(end>s.broadEnd){s.broadEnd=end;s.broadStart=prior}
  }
 }
 let end=0,start=0,startKnown=true,components=0;
 for(const s of Object.values(sections)){
  const specificStartKnown=s.specificCount===0||s.specificPriorCount===s.specificCount;
  const taxStartKnown=s.taxCount===0||s.taxPriorCount===s.taxCount;
  const coreEnd=Math.max(s.broadEnd,s.specificEnd);
  let coreStart=null;
  if(s.broadEnd>=s.specificEnd&&s.broadEnd>0)coreStart=s.broadStart;
  else if(s.specificEnd>0&&specificStartKnown)coreStart=s.specificStart;
  const sectionEnd=coreEnd+s.taxEnd;if(sectionEnd<=0)continue;
  components++;end+=sectionEnd;
  if(coreEnd>0&&coreStart==null)startKnown=false;else start+=(coreStart||0);
  if(s.taxEnd>0&&!taxStartKnown)startKnown=false;else start+=s.taxStart;
 }
 return{end,start:startKnown&&components?start:null,ordered:order!=null,components,order}
}

function detectTrialBalanceColumns(rows){
 if(!rows||rows.length<2)return null;
 for(let i=0;i<Math.min(35,rows.length);i++){
  const h=rows[i].map(normImport),find=(terms)=>h.findIndex(x=>terms.some(t=>x.includes(t)));
  const code=find(['codigo','cod. conta','cod conta','conta']),desc=find(['descricao','nome da conta','historico']),opening=find(['saldo anterior','saldo inicial']),debit=find(['debito','debitos']),credit=find(['credito','creditos']),closing=find(['saldo atual','saldo final','saldo do periodo']);
  if(desc>=0&&closing>=0&&(opening>=0||debit>=0||credit>=0))return{header:i,code,desc,opening,debit,credit,closing}
 }
 return null
}
function trialBalanceMetrics(rows){
 const cols=detectTrialBalanceColumns(rows);if(!cols)return null;
 const entries=rows.slice(cols.header+1).map(r=>({code:cols.code>=0?String(r[cols.code]||'').trim():'',desc:String(r[cols.desc]||'').trim(),opening:cols.opening>=0?brNum(r[cols.opening]):null,debit:cols.debit>=0?brNum(r[cols.debit]):null,credit:cols.credit>=0?brNum(r[cols.credit]):null,closing:brNum(r[cols.closing])})).filter(x=>x.desc&&Number.isFinite(x.closing));
 const pick=(patterns,exclude=[])=>entries.filter(x=>{const n=normImport(x.desc);return patterns.some(p=>n.includes(p))&&!exclude.some(p=>n.includes(p))});
 const aggregate=(patterns,exclude=[])=>{const hits=pick(patterns,exclude);if(!hits.length)return null;const coded=hits.filter(x=>x.code),parents=coded.filter(a=>coded.some(b=>b!==a&&b.code.startsWith(a.code)&&b.code.length>a.code.length));const use=parents.length?parents.filter(a=>!parents.some(p=>p!==a&&a.code.startsWith(p.code)&&a.code.length>p.code.length)):hits;return{closing:use.reduce((s,x)=>s+Math.abs(x.closing),0),opening:use.every(x=>Number.isFinite(x.opening))?use.reduce((s,x)=>s+Math.abs(x.opening),0):null,count:use.length,method:parents.length?'account-code':'description'}};
 const movement=(patterns,exclude=[],side='debit')=>{const hits=pick(patterns,exclude);if(!hits.length)return null;const coded=hits.filter(x=>x.code),parents=coded.filter(a=>coded.some(b=>b!==a&&b.code.startsWith(a.code)&&b.code.length>a.code.length)),use=parents.length?parents.filter(a=>!parents.some(p=>p!==a&&a.code.startsWith(p.code)&&a.code.length>p.code.length)):hits,key=side==='credit'?'credit':'debit',vals=use.map(x=>x[key]).filter(Number.isFinite);return vals.length?{value:vals.reduce((s,v)=>s+Math.abs(v),0),count:use.length,method:parents.length?'account-code':'description'}:null};
 return{cols,entries,receivables:aggregate(['clientes','duplicatas a receber','contas a receber'],['fornecedores']),inventory:aggregate(['estoque','mercadorias para revenda','produtos acabados','materias primas']),suppliers:aggregate(['fornecedores','contas a pagar fornecedores']),debt:aggregate(['emprestimos','financiamentos','mutuos','parcelamentos tributarios','parcelamentos fiscais']),cash:aggregate(['caixa','bancos conta movimento','bancos conta corrente'],['equivalentes']),investments:aggregate(['aplicacoes financeiras','liquidez imediata']),revenue:movement(['receita de vendas','receita de servicos','receita operacional','faturamento','vendas de mercadorias','vendas de produtos'],['deducoes','financeira','outras receitas'],'credit'),financeExpense:movement(['despesas financeiras','juros passivos','juros bancarios','encargos financeiros'],['receitas financeiras'],'debit'),payrollExpense:movement(['salarios','ordenados','pro labore','pessoal e encargos','mao de obra'],['a pagar'],'debit'),depreciationExpense:movement(['depreciacao','amortizacao'],['acumulada'],'debit'),operatingExpense:movement(['despesas operacionais','despesas administrativas','despesas comerciais'],['financeiras'],'debit'),salesTaxes:movement(['icms sobre vendas','iss sobre vendas','pis sobre vendas','cofins sobre vendas','ipi sobre vendas','tributos sobre vendas','impostos sobre vendas'],['a recuperar','credito'],'debit')}
}
function tabularMetrics(rows){
 if(!rows||rows.length<2)return{};let hi=-1;
 for(let i=0;i<Math.min(15,rows.length);i++){const h=rows[i].map(normImport);if(h.some(x=>/cliente|cpf|cnpj|documento|fornecedor|valor|total|regime/.test(x))){hi=i;break}}
 if(hi<0)return{};const headers=rows[hi].map(normImport),data=rows.slice(hi+1).filter(r=>r.some(v=>String(v).trim()));
 const find=(terms)=>headers.findIndex(h=>terms.some(t=>h.includes(t)));const docIdx=find(['cpf/cnpj','cpf cnpj','documento','cnpj','cpf']),clientIdx=find(['cliente','sacado','tomador']),supplierIdx=find(['fornecedor','emitente']),valueIdx=find(['valor total','valor','total','faturamento','liquido']),regimeIdx=find(['regime','tributacao','simples']);
 let b2bNum=0,totalNum=0,purchaseTotal=0,regular=0,supTotal=0;
 data.forEach(r=>{const value=valueIdx>=0?Math.abs(brNum(r[valueIdx])):1;if(!Number.isFinite(value)||value===0)return;if(docIdx>=0){const digits=String(r[docIdx]||'').replace(/\D/g,'');if(digits.length===14)b2bNum+=value;if(digits.length===11||digits.length===14)totalNum+=value}else if(clientIdx>=0){const c=normImport(r[clientIdx]);if(/pj|empresa|juridica|cnpj/.test(c))b2bNum+=value;if(c)totalNum+=value}if(supplierIdx>=0){purchaseTotal+=valueIdx>=0?value:0;supTotal+=value;if(regimeIdx>=0){const rg=normImport(r[regimeIdx]);if(/lucro real|presumido|regular|normal/.test(rg))regular+=value}}});
 const out={};if(totalNum>0)out.b2bPct=100*b2bNum/totalNum;if(purchaseTotal>0)out.purchaseTotal=purchaseTotal;if(supTotal>0&&regimeIdx>=0)out.regularSuppliersPct=100*regular/supTotal;return out
}
function accountingIntegrity(text){
 const asset=firstLatestLineValue(text,[['total do ativo'],['ativo total']]);
 const combined=firstLatestLineValue(text,[['passivo e patrimonio liquido'],['total do passivo e patrimonio liquido']]);
 if(asset!=null&&combined!=null){const a=Math.abs(asset),pc=Math.abs(combined),diff=Math.abs(a-pc),tol=Math.max(2,a*.005);return{known:true,ok:diff<=tol,asset:a,combined:pc,diff,method:'combined'}}
 const current=firstLatestLineValue(text,[['passivo circulante']]),noncurrent=firstLatestLineValue(text,[['passivo nao circulante'],['exigivel a longo prazo']]),equity=firstLatestLineValue(text,[['patrimonio liquido'],['total do patrimonio liquido']]);
 if(asset==null||equity==null||(current==null&&noncurrent==null))return{known:false,ok:null};
 const a=Math.abs(asset),p=Math.abs(current||0)+Math.abs(noncurrent||0),e=Math.abs(equity),diff=Math.abs(a-(p+e)),tol=Math.max(2,a*.005);
 return{known:true,ok:diff<=tol,asset:a,liability:p,equity:e,diff,method:'components'};
}
function extractionConfidence(base,parsed,integrity,relevant){
 let conf=base;
 if(parsed?.extraction==='text+ocr'&&conf==='high')conf='medium';
 if(relevant&&integrity?.known&&integrity.ok===false&&conf==='high')conf='medium';
 return conf;
}
function candidate(field,label,value,source,confidence,reason,display){if(field==='cnpj'){if(!validImportedCnpj(value))return null}else if(!Number.isFinite(value))return null;return{field,label,value,source,confidence,reason,display:display||(field==='cnpj'?formatImportedCnpj(value):(field.toLowerCase().includes('pct')||field==='realProfitMargin'?fmtPct(value):fmtMoney(value)))}}

function analyseImportDoc(file,parsed){
 const text=parsed.text,type=detectDoc(text,parsed.rows),tab=tabularMetrics(parsed.rows),trial=trialBalanceMetrics(parsed.rows),canonical=accountingCanonicalMap(text,type),canonicalAudit=accountingAudit(canonical),c=[],sections=importStatementSections(text),balanceDoc=type==='Balanço'||type==='Balanço + DRE',dreDoc=type==='DRE'||type==='Balanço + DRE',bpText=balanceDoc?sections.balance:text,dreText=dreDoc?sections.dre:text,integrity=balanceDoc?accountingIntegrity(bpText):{known:false,ok:null},conf=(base,relevant=false)=>extractionConfidence(base,parsed,integrity,relevant),importedCnpj=detectImportedCnpj(text,type),dreMonths=Math.max(1,Math.min(12,Number($('dreMonths')?.value)||12)),annualFactor=12/dreMonths;
 const revenueGross=firstLatestLineValue(dreText,[['receita bruta','receita operacional bruta','receita bruta de vendas','receita bruta de vendas e servicos','receita bruta com vendas','faturamento bruto','faturamento total','vendas brutas'],['servicos prestados','prestacao de servicos','vendas de mercadorias','vendas de produtos','receita de vendas','receita de servicos']]);
 const revenueNet=firstLatestLineValue(dreText,[['receita liquida','receita operacional liquida','receita liquida de vendas','receita liquida de vendas e servicos','vendas liquidas']]);
 const revenueOperational=firstLatestLineValue(dreText,[['receitas operacionais']]);
 const revenueForRbt12=revenueGross||(type==='Relatório de vendas'?revenueOperational||revenueNet:null);
 const deductions=Math.abs(firstLatestLineValue(dreText,[['deducoes da receita bruta','deducao de receita bruta','deducoes sobre vendas','deducao sobre vendas','deducoes da receita'],['impostos, devolucoes e abatimentos']])||0);
 const costs=firstLatestLineValue(dreText,[['cmv','cpv','csp','custo das mercadorias','custo dos produtos','custo dos servicos'],['custos das atividades empresariais'],['custos gerais','custos operacionais']]);
 const explicitCash=firstLatestLineValue(bpText,[['caixa e equivalentes','caixa e equivalentes de caixa'],['disponibilidades','disponivel'],['caixa bancos','caixa e bancos']]),cashBox=firstLatestLineValue(bpText,[['caixa geral'],['caixa']],['equivalentes']),banks=firstLatestLineValue(bpText,[['bancos conta movimento'],['bancos c/ movimento'],['bancos conta corrente'],['depositos bancarios a vista']]),cashComponents=((cashBox||0)+(banks||0))||null,cash=cashComponents!=null?cashComponents:explicitCash;
 const canonicalCash=canonicalTotal(canonical,'asset.current.cash'),canonicalInvestments=canonicalTotal(canonical,'asset.current.investments'),canonicalReceivables=canonicalTotal(canonical,'asset.current.receivables'),canonicalInventory=canonicalTotal(canonical,'asset.current.inventory'),canonicalSuppliers=canonicalTotal(canonical,'liability.current.suppliers'),canonicalDebt=canonicalTotal(canonical,'liability.financialDebt');
 const investments=firstLatestLineValue(bpText,[['aplicacoes financeiras de liquidez imediata','aplicacoes financeiras imediatas'],['aplicacoes de liquidez imediata','investimentos de liquidez imediata'],['aplicacoes financeiras','titulos e valores mobiliarios']],['caixa e equivalentes','longo prazo']);
 const currentAssetsDirect=latestLineValues(bpText,['ativo circulante'],['total do ativo','nao circulante']),currentAssetsCtx=currentAssetsDirect.latest==null?sectionLineValue(bpText,['ativo'],['circulante'],['nao circulante']):currentAssetsDirect,currentAssets=currentAssetsCtx.latest;
 const currentLiabilitiesDirect=latestLineValues(bpText,['passivo circulante'],['nao circulante']),currentLiabilitiesCtx=currentLiabilitiesDirect.latest==null?sectionLineValue(bpText,['passivo'],['circulante'],['nao circulante']):currentLiabilitiesDirect,currentLiabilities=currentLiabilitiesCtx.latest;
 const totalAssets=firstLatestLineValue(bpText,[['ativo total'],['total do ativo'],['ativo']],['circulante','permanente','imobilizado']);
 const equity=firstLatestLineValue(bpText,[['patrimonio liquido']]);
 const fixedAssets=firstLatestLineValue(bpText,[['imobilizado']]);
 const taxesRecoverable=firstLatestLineValue(bpText,[['impostos diversos a compensar','tributos a recuperar','impostos a recuperar']]);
 const taxesPayable=firstLatestLineValue(bpText,[['imposto a pagar','impostos a pagar','tributos a recolher','impostos a recolher']]);
 const directCosts=firstLatestLineValue(dreText,[['custos diretos']]);
 const indirectCosts=firstLatestLineValue(dreText,[['custos indiretos da producao','custos indiretos']]);
 const adminExpenses=firstLatestLineValue(dreText,[['despesas gerais da administracao','despesas administrativas']]);
 const taxExpenses=firstLatestLineValue(dreText,[['despesas tributarias']]);
 const pretaxProfit=firstSignedLatestLineValue(dreText,[['lucro liquido antes provisao irpj e csll','lucro liquido antes da provisao irpj e csll','lucro antes do irpj e csll','lucro antes do irpj','lucro antes do imposto de renda','resultado antes do irpj','resultado antes dos tributos sobre o lucro','resultado antes dos impostos sobre o lucro'],['lucro antes dos tributos','resultado antes dos tributos']]);
 const netProfitDirect=firstSignedLatestLineValue(dreText,[['lucro liquido do exercicio','resultado liquido do exercicio','resultado do exercicio','resultado exercicio'],['lucro liquido','resultado liquido']],['antes']);
 const netProfit=netProfitDirect!=null?netProfitDirect:firstSignedLatestLineValue(dreText,[['contas de resultados']]);
 const irpjExpense=Math.abs(firstLatestLineValue(dreText,[['provisao p imposto de renda','provisao para imposto de renda','provisao para irpj','provisao irpj','imposto de renda corrente','irpj corrente','despesa de irpj'],['imposto de renda']],['antes','contribuicao social'])||0);
 const csllExpense=Math.abs(firstLatestLineValue(dreText,[['provisao p contribuicao social','provisao para contribuicao social','provisao para csll','provisao csll','contribuicao social corrente','csll corrente','despesa de csll'],['contribuicao social sobre o lucro','csll']],['antes','imposto de renda'])||0);
 const combinedProfitTaxExpense=Math.abs(firstLatestLineValue(dreText,[['provisao p irpj e contribuicao social','provisao para irpj e contribuicao social','provisao p irpj e csll','provisao para irpj e csll','irpj e contribuicao social']],['antes'])||0);
 const profitTaxExpense=(irpjExpense+csllExpense)>0?(irpjExpense+csllExpense):combinedProfitTaxExpense;
 const accountingProfit=pretaxProfit!=null?pretaxProfit:(netProfit!=null?netProfit+profitTaxExpense:null);
 const payrollCosts=latestLineValue(dreText,['custos com pessoal','mao de obra e encargos','custos de pessoal']),payrollExpenses=latestLineValue(dreText,['despesas com pessoal','despesas de pessoal']),directLabor=latestLineValue(dreText,['mao de obra direta']),indirectLabor=latestLineValue(dreText,['mao de obra indireta']),payroll=(payrollCosts||0)+(payrollExpenses||0)||((directLabor||0)+(indirectLabor||0))||latestLineValue(dreText,['folha de pagamento','salarios e encargos','salarios ordenados e encargos','pessoal e encargos','remuneracoes e encargos']);
 const debtBalances=financialDebtBalances(bpText),debtEnd=debtBalances.end,debtStart=debtBalances.start,debtOrdered=debtBalances.ordered;
 const unclassifiedLongTermCtx=accountingSectionValue(bpText,n=>/^passivo nao circulante\b/.test(n),n=>/^obrigacoes a pagar\b/.test(n),['emprestimo','financiamento','mutuo','parcelamento']),unclassifiedLongTerm=unclassifiedLongTermCtx?.latest==null?0:Math.abs(unclassifiedLongTermCtx.latest);
 const financingSales=Math.abs(firstLatestLineValue(bpText,[['financiamento das vendas']])||0),factoryLinkedReceivables=Math.abs(firstLatestLineValue(bpText,[['contas vinculadas com a fabrica']])||0);
 const receivables=hierarchicalCategoryTotal(bpText,n=>/clientes|duplicatas a receber|contas a receber|valor(?:es)? a receber|financiamento das vendas|contas vinculadas com a fabrica/.test(n),['provisao','perdas estimadas','longo prazo']);
 const inventory=hierarchicalCategoryTotal(bpText,n=>/estoques?|mercadorias para revenda|produtos acabados|materias primas/.test(n),['provisao']);
 const suppliers=hierarchicalCategoryTotal(bpText,n=>/fornecedores|contas a pagar a fornecedores/.test(n),['adiantamento']);
 const interestRaw=firstLatestLineValue(dreText,[['juros e encargos da divida','juros e encargos financeiros'],['juros sobre emprestimos','juros de emprestimos','juros de empréstimos'],['juros sobre financiamentos','juros de financiamentos'],['encargos de emprestimos','encargos de financiamentos'],['encargos financeiros de emprestimos','encargos financeiros de financiamentos'],['juros passivos','juros bancarios','juros bancários']]);
 const genericFinanceRaw=latestLineValue(dreText,['despesas financeiras'],['receitas financeiras','resultado financeiro']);
 const interest=interestRaw==null?null:Math.abs(interestRaw),genericFinance=genericFinanceRaw==null?null:Math.abs(genericFinanceRaw);
 const taxExclude=['a recuperar','credito','diferido'];
 const currentPisCofinsRaw=sumAccountingLeafValues(dreText,n=>/^(pis|cofins)(?:\b|\/)/.test(n),taxExclude)
  ??firstLatestLineValue(dreText,[['pis e cofins sobre vendas','pis/cofins sobre vendas','pis e cofins s/ vendas'],['pis e cofins']],taxExclude);
 const currentIcmsRaw=sumAccountingLeafValues(dreText,n=>/^icms(?:\b|\/)/.test(n),taxExclude)
  ??firstLatestLineValue(dreText,[['icms sobre vendas','icms s/ vendas','icms incidente sobre vendas']],taxExclude);
 const currentIssRaw=sumAccountingLeafValues(dreText,n=>/^iss(?:\b|\/)/.test(n),taxExclude)
  ??firstLatestLineValue(dreText,[['iss sobre vendas','iss s/ vendas','iss incidente sobre vendas']],taxExclude);
 const currentIpiRaw=sumAccountingLeafValues(dreText,n=>/^ipi(?:\b|\/)/.test(n),taxExclude)
  ??firstLatestLineValue(dreText,[['ipi sobre vendas','ipi s/ vendas','ipi incidente sobre vendas']],taxExclude);
 /* Perfil automotivo: separa veiculos novos, usados, pecas, servicos e comissoes.
    Os custos da DRE sao uma proxy historica da base de aquisicoes do cenario,
    nao uma compra fiscal confirmada. */
 const autoValue=(labels,exclude=[])=>Math.abs(firstLatestLineValue(dreText,[labels],exclude)||0)*annualFactor;
 const automotiveRevenue={
  newVehicles:autoValue(['veiculos novos'],['custos','custo','estoque','impostos']),
  usedVehicles:autoValue(['veiculos seminovos','veiculo seminovo','veiculos usados','veiculo usado'],['custos','custo','estoque','impostos','pis','cofins','icms']),
  parts:autoValue(['vendas pecas','venda pecas','pecas/acessorios/produtos diversos'],['custos','custo','estoque','impostos','icms','pis','cofins']),
  services:autoValue(['venda servicos','receita de servicos'],['custos','custo','impostos','iss','pis','cofins']),
  commissions:autoValue(['comissoes recebidas','receita de comissoes'],['impostos'])
 };
 const automotiveCosts={
  newVehicles:autoValue(['custos veiculos novos']),
  usedVehicles:autoValue(['custos veiculos seminovos','custo veiculos seminovos','custos veiculos usados','custo veiculos usados']),
  parts:autoValue(['custos pecas','custo pecas']),
  services:autoValue(['custos servicos','custo servicos'])
 };
 const automotiveRevenueTotal=Object.values(automotiveRevenue).reduce((s,v)=>s+v,0);
 const automotiveCostTotal=Object.values(automotiveCosts).reduce((s,v)=>s+v,0);
 const annualGrossRevenue=revenueGross>0?Math.abs(revenueGross)*annualFactor:0;
 const automotiveDetail=(dreDoc&&automotiveRevenueTotal>0&&automotiveCostTotal>0)?{
  source:file.name,
  revenue:automotiveRevenue,
  costs:automotiveCosts,
  revenueTotal:automotiveRevenueTotal,
  costTotal:automotiveCostTotal,
  revenueCoverage:annualGrossRevenue>0?automotiveRevenueTotal/annualGrossRevenue:null,
  usedVehiclesMention:automotiveRevenue.usedVehicles>0||automotiveCosts.usedVehicles>0,
  basis:'DRE historica',
  confidence:'medium'
 }:null;
 const taxTotalRaw=firstLatestLineValue(dreText,[['tributos incidentes sobre vendas'],['impostos incidentes sobre vendas'],['tributos sobre vendas'],['impostos sobre vendas'],['impostos s/ vendas','tributos s/ vendas'],['deducoes tributarias']]);
 let consumptionTaxes=taxTotalRaw==null?0:Math.abs(taxTotalRaw),taxConfidence=taxTotalRaw!=null?'high':null,taxReason=taxTotalRaw!=null?'Total de tributos/impostos incidentes sobre vendas identificado na DRE.':'';
 if(!consumptionTaxes){
  const vals=[currentPisCofinsRaw,currentIcmsRaw,currentIssRaw,currentIpiRaw].filter(v=>v!=null).map(v=>Math.abs(v));
  if(vals.length){consumptionTaxes=vals.reduce((s,v)=>s+v,0);taxConfidence='medium';taxReason='Tributos sobre vendas somados a partir das contas identificadas na DRE.'}
 }
 if(!consumptionTaxes&&deductions>0){consumptionTaxes=deductions;taxConfidence='low';taxReason='Aproximação pela linha total de deduções da receita bruta. Pode incluir devoluções, abatimentos e descontos, portanto exige revisão.'}
 const explicitEbitda=firstSignedLatestLineValue(dreText,[['ebitda'],['lajida']]);
 const operatingBeforeFinance=firstSignedLatestLineValue(dreText,[['resultado antes do resultado financeiro e dos tributos','resultado antes do resultado financeiro','lucro operacional antes do resultado financeiro']]);
 const operatingProfit=operatingBeforeFinance!=null?operatingBeforeFinance:firstSignedLatestLineValue(dreText,[['resultado operacional','lucro operacional']]);
 const depreciation=Math.abs(firstLatestLineValue(dreText,[['depreciacao e amortizacao','depreciacoes e amortizacoes'],['depreciacao','depreciacoes']])||0);
 const amortization=Math.abs(firstLatestLineValue(dreText,[['amortizacao','amortizacoes']],['depreciacao e amortizacao','depreciacoes e amortizacoes'])||0);
 const operatingCostsForEbitda=Math.abs(firstLatestLineValue(dreText,[['custos operacionais'],['custos das mercadorias e servicos']])||0);
 const operatingExpensesForEbitda=Math.abs(firstLatestLineValue(dreText,[['despesas operacionais']])||0);
 const otherOperatingResult=firstSignedLatestLineValue(dreText,[['outros resultados operacionais']]);
 const reconstructedOperatingProfit=operatingProfit==null&&revenueGross>0&&consumptionTaxes>=0&&operatingCostsForEbitda>0&&operatingExpensesForEbitda>0
  ?Math.abs(revenueGross)-Math.abs(consumptionTaxes)-operatingCostsForEbitda-operatingExpensesForEbitda+(otherOperatingResult||0)
  :null;
 const ebitdaBase=operatingProfit!=null?operatingProfit:reconstructedOperatingProfit;
 const ebitda=explicitEbitda!=null?explicitEbitda:(ebitdaBase!=null?ebitdaBase+depreciation+amortization:null);
 const revenueNetForMargin=revenueNet>0?Math.abs(revenueNet):(revenueGross>0?Math.max(0,Math.abs(revenueGross)-Math.abs(consumptionTaxes||deductions||0)):0);const ebitdaMargin=ebitda!=null&&revenueNetForMargin>0?100*ebitda/revenueNetForMargin:null;
  if(trial){
  const annual=12/dreMonths,src=file.name,quality=x=>conf(x?.method==='account-code'?'high':'medium');
  if(trial.revenue?.value>0)c.push(candidate('rbt12','Faturamento em 12 meses (RBT12)',trial.revenue.value*annual,src,quality(trial.revenue),`Receitas reconstruídas pelos créditos do balancete e anualizadas a partir de ${dreMonths} meses. Revise se houver lançamentos de encerramento ou transferências internas.`,fmtMoney(trial.revenue.value*annual)));
  if(trial.financeExpense?.value>0)c.push(candidate('interestExpense','Despesas financeiras da dívida',trial.financeExpense.value*annual,src,quality(trial.financeExpense),`Despesas financeiras reconstruídas pela movimentação a débito do balancete e anualizadas a partir de ${dreMonths} meses.`,fmtMoney(trial.financeExpense.value*annual)));
  if(trial.payrollExpense?.value>0)c.push(candidate('monthlyPayroll','Folha mensal estimada',trial.payrollExpense.value/dreMonths,src,'medium',`Despesas de pessoal identificadas pela movimentação a débito do balancete, divididas pelos ${dreMonths} meses do período. Confirme a composição válida para o Fator R.`,fmtMoney(trial.payrollExpense.value/dreMonths)));
  if(trial.depreciationExpense?.value>0)trial.estimatedDAAnnual=trial.depreciationExpense.value*annual;
  if(trial.salesTaxes?.value>0)c.push(candidate('currentConsumptionTaxAnnual','Carga atual de tributos sobre consumo',trial.salesTaxes.value*annual,src,quality(trial.salesTaxes),`Tributos sobre vendas reconstruídos pela movimentação a débito do balancete e anualizados a partir de ${dreMonths} meses.`,fmtMoney(trial.salesTaxes.value*annual)));
 }
 if(trial){
  const tc=trial.cash,ti=trial.investments,tr=trial.receivables,ts=trial.inventory,tf=trial.suppliers,td=trial.debt,reason=trial.cols.code>=0?'Balancete estruturado por código de conta, preservando contas sintéticas e evitando dupla contagem.':'Balancete reconhecido por descrição e colunas de saldo.';
  if(tc?.closing>0)c.push(candidate('cashAndEquivalents','Caixa e bancos',tc.closing,file.name,conf(tc.method==='account-code'?'high':'medium'),reason,fmtMoney(tc.closing)));
  if(ti?.closing>0)c.push(candidate('liquidInvestments','Aplicações de liquidez imediata',ti.closing,file.name,conf(ti.method==='account-code'?'high':'medium'),reason,fmtMoney(ti.closing)));
  if(td?.closing>0)c.push(candidate('debtEnd','Dívida financeira identificada',td.closing,file.name,conf(td.method==='account-code'?'high':'medium'),reason,fmtMoney(td.closing)));
  if(td?.opening!=null)c.push(candidate('debtStart','Dívida financeira identificada no início',td.opening,file.name,conf(td.method==='account-code'?'high':'medium'),reason,fmtMoney(td.opening)));
  if(tr?.closing>0)c.push(candidate('accountsReceivable','Valores a receber no curto prazo',tr.closing,file.name,conf(tr.method==='account-code'?'high':'medium'),reason,fmtMoney(tr.closing)));
  if(ts?.closing>0)c.push(candidate('inventory','Estoques',ts.closing,file.name,conf(ts.method==='account-code'?'high':'medium'),reason,fmtMoney(ts.closing)));
  if(tf?.closing>0)c.push(candidate('suppliersPayable','Fornecedores',tf.closing,file.name,conf(tf.method==='account-code'?'high':'medium'),reason,fmtMoney(tf.closing)));
 }
 if(totalAssets!=null&&balanceDoc)c.push(candidate('totalAssets','Ativo total',Math.abs(totalAssets),file.name,conf('high',true),'Total do ativo localizado no balanço.',fmtMoney(Math.abs(totalAssets))));
 if(equity!=null&&balanceDoc)c.push(candidate('equity','Patrimônio líquido',Math.abs(equity),file.name,conf('high',true),'Patrimônio líquido localizado no balanço.',fmtMoney(Math.abs(equity))));
 if(fixedAssets!=null&&balanceDoc)c.push(candidate('fixedAssets','Imobilizado',Math.abs(fixedAssets),file.name,conf('high',true),'Saldo do imobilizado localizado no balanço.',fmtMoney(Math.abs(fixedAssets))));
 if(taxesRecoverable!=null&&balanceDoc)c.push(candidate('taxesRecoverable','Tributos a recuperar/compensar',Math.abs(taxesRecoverable),file.name,conf('high',true),'Créditos tributários apresentados no ativo.',fmtMoney(Math.abs(taxesRecoverable))));
 if(taxesPayable!=null&&balanceDoc)c.push(candidate('taxesPayable','Tributos a pagar/recolher',Math.abs(taxesPayable),file.name,conf('high',true),'Obrigações tributárias apresentadas no passivo.',fmtMoney(Math.abs(taxesPayable))));
 if(directCosts!=null&&dreDoc)c.push(candidate('directCosts','Custos diretos',Math.abs(directCosts),file.name,conf('high'),'Custos diretos identificados na DRE.',fmtMoney(Math.abs(directCosts))));
 if(indirectCosts!=null&&dreDoc)c.push(candidate('indirectCosts','Custos indiretos',Math.abs(indirectCosts),file.name,conf('high'),'Custos indiretos identificados na DRE.',fmtMoney(Math.abs(indirectCosts))));
 if(adminExpenses!=null&&dreDoc)c.push(candidate('adminExpenses','Despesas administrativas',Math.abs(adminExpenses),file.name,conf('high'),'Despesas administrativas identificadas na DRE.',fmtMoney(Math.abs(adminExpenses))));
 if(taxExpenses!=null&&dreDoc)c.push(candidate('taxExpenses','Despesas tributárias',Math.abs(taxExpenses),file.name,conf('high'),'Despesas tributárias identificadas na DRE. Não são tratadas automaticamente como tributos sobre consumo.',fmtMoney(Math.abs(taxExpenses))));
 if(netProfit!=null&&dreDoc)c.push(candidate('netProfit','Resultado do exercício',netProfit,file.name,conf('high'),'Resultado do exercício localizado na DRE.',fmtMoney(netProfit)));
 const canonicalAdds=[
  ['cashAndEquivalents','Caixa e bancos',canonicalCash],['liquidInvestments','Aplicações financeiras',canonicalInvestments],
  ['accountsReceivable','Valores a receber no curto prazo',canonicalReceivables],['inventory','Estoques',canonicalInventory],
  ['suppliersPayable','Fornecedores',canonicalSuppliers],['debtEnd','Dívida financeira identificada',canonicalDebt]
 ];
 for(const [field,label,data] of canonicalAdds){
  if(!(data?.latest>0)||c.some(x=>x&&x.field===field))continue;
  let reason='Classificação pelo mapa contábil canônico, com hierarquia e prevenção de dupla contagem.';
  if(field==='accountsReceivable'&&financingSales>0)reason+=` O grupo inclui ${fmtMoney(financingSales)} em financiamento das vendas${factoryLinkedReceivables>0?` e ${fmtMoney(factoryLinkedReceivables)} em contas vinculadas com a fábrica`:''}; por isso o rótulo não é limitado a clientes.`;
  if(field==='debtEnd'&&unclassifiedLongTerm>0)reason+=` Há ainda ${fmtMoney(unclassifiedLongTerm)} em obrigações a pagar no passivo não circulante cuja natureza financeira não foi identificada; esse valor não foi incluído na dívida.`;
  const item=candidate(field,label,data.latest,file.name,conf(data.method==='canonical-hierarchy'?'high':'medium',balanceDoc),reason,fmtMoney(data.latest));if(item){if(field==='debtEnd')item.unclassifiedLongTerm=unclassifiedLongTerm;c.push(item)}
 }
 if(importedCnpj)c.push(candidate('cnpj','CNPJ da empresa',importedCnpj,file.name,conf('high'),'CNPJ validado e identificado no cabeçalho da demonstração contábil.',formatImportedCnpj(importedCnpj)));
 if(revenueForRbt12>0)c.push(candidate('rbt12','Faturamento em 12 meses (RBT12)',Math.abs(revenueForRbt12),file.name,conf(revenueGross!=null?'high':'medium'),revenueGross!=null?'Receita bruta/faturamento localizado no documento.':'Total de vendas localizado no relatório comercial.',fmtMoney(Math.abs(revenueForRbt12))));
 if(dreDoc&&revenueGross>0&&costs!=null&&Math.abs(costs)>0){
  const costPct=100*Math.abs(costs)/Math.abs(revenueGross);
  if(costPct>0&&costPct<=120)c.push(candidate('purchasesPct','Aquisições e despesas sobre faturamento · proxy pela DRE',costPct,file.name,'medium','Proxy calculada por custos operacionais/CMV/CPV/CSP ÷ receita bruta. Ajuda a revisar a estimativa setorial, mas não equivale necessariamente às compras creditáveis do período porque pode haver variação de estoques e itens sem direito a crédito.',fmtPct(costPct)));
 }
 if(cash!=null&&balanceDoc)c.push(candidate('cashAndEquivalents','Caixa e bancos',Math.abs(cash),file.name,conf('high',true),cashComponents!=null?'Caixa e bancos conta movimento somados sem duplicar aplicações financeiras.':'Total de caixa e equivalentes usado porque o balanço não detalhou caixa e bancos separadamente.',fmtMoney(Math.abs(cash))));
 if(investments!=null&&Math.abs(investments)>0&&balanceDoc&&(cashComponents!=null||explicitCash==null))c.push(candidate('liquidInvestments','Aplicações de liquidez imediata',Math.abs(investments),file.name,conf('medium',true),'Aplicações financeiras localizadas separadamente do caixa e bancos. Confirme se possuem liquidez imediata.',fmtMoney(Math.abs(investments))));
 if(currentAssets!=null&&Math.abs(currentAssets)>0&&balanceDoc)c.push(candidate('currentAssets','Ativo circulante',Math.abs(currentAssets),file.name,conf('high',true),'Total do ativo circulante localizado no balanço.',fmtMoney(Math.abs(currentAssets))));
 if(receivables.end>0&&balanceDoc&&!c.some(x=>x?.field==='accountsReceivable')){const reason='Subtotal de valores a receber no curto prazo consolidado respeitando a hierarquia das contas para evitar dupla contagem.'+(financingSales>0?` Inclui ${fmtMoney(financingSales)} em financiamento das vendas`:'')+(factoryLinkedReceivables>0?` e ${fmtMoney(factoryLinkedReceivables)} em contas vinculadas com a fábrica`:'')+'.';c.push(candidate('accountsReceivable','Valores a receber no curto prazo',receivables.end,file.name,conf(receivables.method==='hierarchy'?'high':'medium',true),reason,fmtMoney(receivables.end)))}
 if(inventory.end>0&&balanceDoc&&!c.some(x=>x?.field==='inventory'))c.push(candidate('inventory','Estoques',inventory.end,file.name,conf(inventory.method==='hierarchy'?'high':'medium',true),'Saldo de estoques consolidado sem somar simultaneamente subtotal e contas analíticas.',fmtMoney(inventory.end)));
 if(suppliers.end>0&&balanceDoc&&!c.some(x=>x?.field==='suppliersPayable'))c.push(candidate('suppliersPayable','Fornecedores',suppliers.end,file.name,conf(suppliers.method==='hierarchy'?'high':'medium',true),'Saldo de fornecedores consolidado respeitando subtotais e contas analíticas.',fmtMoney(suppliers.end)));
 if(currentLiabilities!=null&&Math.abs(currentLiabilities)>0&&balanceDoc)c.push(candidate('currentLiabilities','Passivo circulante',Math.abs(currentLiabilities),file.name,conf('high',true),'Total do passivo circulante localizado no balanço.',fmtMoney(Math.abs(currentLiabilities))));
 if(debtEnd>0&&balanceDoc&&!c.some(x=>x?.field==='debtEnd')){const reason='Soma apenas das obrigações cuja natureza financeira foi identificada no balanço, como empréstimos, financiamentos, parcelamentos ou mútuos.'+(unclassifiedLongTerm>0?` Há ${fmtMoney(unclassifiedLongTerm)} em obrigações a pagar no passivo não circulante sem natureza financeira identificada; o valor ficou fora da dívida até confirmação.`:'');const item=candidate('debtEnd','Dívida financeira identificada',debtEnd,file.name,conf(debtOrdered?'high':'medium',true),reason,fmtMoney(debtEnd));if(item){item.unclassifiedLongTerm=unclassifiedLongTerm;c.push(item)}}
 if(debtStart!=null&&debtStart>=0&&balanceDoc)c.push(candidate('debtStart','Dívida financeira identificada no início',debtStart,file.name,conf(debtOrdered?'high':'medium',true),'Saldo inicial das mesmas obrigações financeiras utilizadas na dívida final.',fmtMoney(debtStart)));
 if(interest!=null&&interest>0&&dreDoc){
  const item=candidate('interestExpense','Juros e encargos da dívida',interest,file.name,conf('high'),'Conta específica de juros/encargos de empréstimos ou financiamentos localizada na DRE.',fmtMoney(interest));if(item){item.usageConfidence='high';c.push(item)}
 }else if(genericFinance!=null&&genericFinance>0&&dreDoc){
  const item=candidate('interestExpense','Despesas financeiras da DRE',genericFinance,file.name,conf('high'),'O valor da conta de despesas financeiras foi identificado com alta confiança. Seu uso como aproximação do custo da dívida exige revisão, porque a conta pode conter itens não vinculados a empréstimos, financiamentos, parcelamentos ou mútuos.',fmtMoney(genericFinance));if(item){item.usageConfidence='medium';item.requiresUsageReview=true;c.push(item)}
 }
 if(accountingProfit!=null&&dreDoc){
  const annualProfit=accountingProfit*annualFactor,fiscalMismatch=accountingProfit<0&&profitTaxExpense>0;
  const reconstructed=pretaxProfit==null&&netProfit!=null;
  const reason=pretaxProfit!=null?'Resultado antes de IRPJ/CSLL identificado diretamente na DRE.':reconstructed&&profitTaxExpense>0?`Resultado antes de IRPJ/CSLL reconstruído a partir do resultado final (${fmtMoney(netProfit)}) acrescido da provisão de IRPJ/CSLL (${fmtMoney(profitTaxExpense)}).`:'Resultado final da DRE usado como referência porque não foi localizada provisão relevante de IRPJ/CSLL.';
  const fullReason=reason+(fiscalMismatch?' A DRE registra resultado contábil negativo e provisão de IRPJ/CSLL; confirme a apuração fiscal antes de assumir base fiscal zero.':'')+(dreMonths<12?` Anualizado a partir de ${dreMonths} meses.`:'');
  const item=candidate('realAccountingProfitAnnual','Resultado contábil histórico antes de IRPJ e CSLL',annualProfit,file.name,conf(pretaxProfit!=null?'high':'medium'),fullReason,fmtMoney(annualProfit));if(item){item.fiscalMismatch=fiscalMismatch;item.irpjExpense=irpjExpense*annualFactor;item.csllExpense=csllExpense*annualFactor;item.combinedProfitTaxExpense=combinedProfitTaxExpense*annualFactor;c.push(item)}
 }
 if(consumptionTaxes>0&&dreDoc){const annualTaxes=consumptionTaxes*annualFactor,taxRate=revenueGross?100*consumptionTaxes/Math.abs(revenueGross):null;const rateText=taxRate!=null&&Number.isFinite(taxRate)?` Equivale a aproximadamente ${fmtPct(taxRate)} da receita bruta.`:'';c.push(candidate('currentConsumptionTaxAnnual','Carga atual de tributos sobre consumo',annualTaxes,file.name,conf(taxConfidence),taxReason+rateText+(dreMonths<12?` Valor anualizado a partir de ${dreMonths} meses.`:''),fmtMoney(annualTaxes)))}
 if(dreDoc){
  const pushTaxDetail=(field,label,value)=>{if(value==null||!Number.isFinite(value)||Math.abs(value)<=0)return;const annual=Math.abs(value)*annualFactor;c.push(candidate(field,label,annual,file.name,conf('high'),`Conta específica de ${label.toLowerCase()} identificada na DRE.${dreMonths<12?` Valor anualizado a partir de ${dreMonths} meses.`:''}`,fmtMoney(annual)))};
  pushTaxDetail('currentPisCofinsAnnual','PIS/Cofins atuais',currentPisCofinsRaw);
  pushTaxDetail('currentIcmsAnnual','ICMS atual',currentIcmsRaw);
  pushTaxDetail('currentIssAnnual','ISS atual',currentIssRaw);
  pushTaxDetail('currentOtherConsumptionAnnual','IPI / outros tributos de consumo',currentIpiRaw);
  const legacyTaxParts=[currentIcmsRaw,currentIssRaw].filter(v=>v!=null&&Number.isFinite(v));
  if(revenueGross>0&&legacyTaxParts.length){
   const legacyTaxAnnual=legacyTaxParts.reduce((s,v)=>s+Math.abs(v),0)*annualFactor,annualGross=Math.abs(revenueGross)*annualFactor,legacyPct=annualGross>0?100*legacyTaxAnnual/annualGross:null;
   if(legacyPct!=null&&legacyPct>=0&&legacyPct<=30)c.push(candidate('legacyRate','Carga efetiva atual de ICMS/ISS',legacyPct,file.name,conf('high'),'Calculada diretamente pela DRE como ICMS + ISS identificados nas vendas ÷ receita bruta. Quando disponível, esta evidência contábil deve substituir a sugestão setorial genérica usada na transição de 2027 a 2032.',fmtPct(legacyPct)));
  }
 }
 if(ebitdaMargin!=null&&Number.isFinite(ebitdaMargin)&&dreDoc){
  const marginConfidence=(explicitEbitda!=null||operatingBeforeFinance!=null)?'high':'medium';
  const marginReason=explicitEbitda!=null?'EBITDA identificado diretamente e dividido pela receita líquida.':operatingBeforeFinance!=null?'Resultado antes do resultado financeiro acrescido de depreciação e amortização, dividido pela receita líquida.':reconstructedOperatingProfit!=null?`EBITDA reconstruído pela DRE: receita bruta menos tributos sobre vendas, custos operacionais, despesas operacionais e outros resultados operacionais, com adição de depreciação/amortização. EBITDA estimado: ${fmtMoney(ebitda)}; receita líquida estimada: ${fmtMoney(revenueNetForMargin)}.`:'EBITDA aproximado pelo resultado operacional acrescido de depreciação e amortização, dividido pela receita líquida.';
  const item=candidate('currentOperatingMarginPct','Margem EBITDA atual',ebitdaMargin,file.name,conf(marginConfidence),marginReason,fmtPct(ebitdaMargin));if(item){item.ebitdaAnnual=ebitda*annualFactor;item.ebitdaReconstructed=reconstructedOperatingProfit!=null;c.push(item)}
 }
 if(payroll)c.push(candidate('monthlyPayroll','Folha mensal estimada',dreDoc?Math.abs(payroll)/dreMonths:Math.abs(payroll),file.name,conf('medium'),dreDoc?`Valor de pessoal dividido pelos ${dreMonths} meses cobertos pela DRE. Confirme a composição válida para o Fator R.`:'Valor de folha localizado no relatório. Confirme a periodicidade.',fmtMoney(dreDoc?Math.abs(payroll)/dreMonths:Math.abs(payroll))));
 if(tab.b2bPct!=null)c.push(candidate('b2bPct','Vendas para clientes PJ (B2B)',tab.b2bPct,file.name,conf('high'),'Calculado pelos documentos CPF/CNPJ ou identificação de clientes nas linhas do relatório.',fmtPct(tab.b2bPct)));
 if(tab.regularSuppliersPct!=null)c.push(candidate('regularSuppliersPct','Fornecedores no regime regular',tab.regularSuppliersPct,file.name,conf('medium'),'Calculado pelas linhas que identificam o regime dos fornecedores.',fmtPct(tab.regularSuppliersPct)));
 const usedVehiclesMention=/veiculos seminovos|veiculo seminovo|veiculos usados|veiculo usado/.test(normImport(dreText));
 return{file:file.name,type,text,candidates:c,cnpj:importedCnpj,extraction:parsed.extraction||'text',integrity,canonicalAudit,canonical,revenueGross:revenueGross==null?null:Math.abs(revenueGross),revenueNet:revenueNet==null?null:Math.abs(revenueNet),purchaseTotal:tab.purchaseTotal||((type==='Relatório de compras'&&costs)?Math.abs(costs):null),usedVehiclesMention,automotiveDetail}
}
function buildCrossCandidates(docs,candidates){
 const confScore={high:3,medium:2,low:1},typeScore={'Balanço + DRE':4,'DRE':3,'Balanço':3,'Balancete':3,'Relatório de vendas':2,'Relatório de compras':2,'Relatório':1},docByFile=Object.fromEntries(docs.map(d=>[d.file,d]));
 candidates.forEach(x=>{const d=docByFile[x.source];x.sourceQuality=(confScore[x.confidence]||0)*10+(typeScore[d?.type]||0)+(d?.integrity?.ok===true?2:0)-(d?.integrity?.ok===false?3:0)+(d?.extraction==='structured'?2:d?.extraction==='text+ocr'?-1:0)});
 const revs=candidates.filter(x=>x.field==='rbt12').sort((a,b)=>(b.sourceQuality||0)-(a.sourceQuality||0)),base=revs[0]?.value||(num('rbt12')>0?num('rbt12'):null);
 if(base>0)docs.forEach(d=>{if(d.purchaseTotal>0){const p=100*d.purchaseTotal/base;if(p>=0&&p<=300)candidates.push(candidate('purchasesPct','Compras/insumos sobre o faturamento',p,d.file,'medium','Compras/custos encontrados divididos pelo faturamento importado. CMV/CPV/CSP pode não ser igual a compras creditáveis.',fmtPct(p)))}});

 const dreDoc=docs.find(d=>d.type==='DRE'||d.type==='Balanço + DRE'),bpDoc=docs.find(d=>d.type==='Balanço'||d.type==='Balanço + DRE');
 if(!dreDoc)return candidates;
 const months=Math.max(1,Math.min(12,Number($('dreMonths')?.value)||12)),dreText=typeof importStatementSections==='function'?importStatementSections(dreDoc.text).dre:dreDoc.text,bpText=bpDoc?(typeof importStatementSections==='function'?importStatementSections(bpDoc.text).balance:bpDoc.text):'';
 const latest=(text,groups,exclude=[])=>typeof firstLatestLineValue==='function'?firstLatestLineValue(text,groups,exclude):null;
 const exists=field=>candidates.some(x=>x.field===field);

 const gross=latest(dreText,[['receita bruta','receita operacional bruta','faturamento bruto','faturamento total'],['receita de vendas','receita de servicos','receita de serviços']]);
 const net=latest(dreText,[['receita liquida','receita operacional liquida','receita líquida','receita operacional líquida']]);
 const explicitTax=latest(dreText,[['tributos incidentes sobre vendas','impostos incidentes sobre vendas'],['tributos sobre vendas','impostos sobre vendas'],['pis sobre vendas','cofins sobre vendas','icms sobre vendas','iss sobre vendas','ipi sobre vendas']],['a recuperar','credito','crédito']);
 const deductions=latest(dreText,[['deducoes da receita bruta','deduções da receita bruta','deducoes sobre vendas','deduções sobre vendas'],['impostos, devolucoes e abatimentos','impostos, devoluções e abatimentos']]);
 if(!exists('currentConsumptionTaxAnnual')){
  let tax=null,confidence='low',reason='';
  if(explicitTax!=null){tax=Math.abs(explicitTax)*(12/months);confidence='high';reason='Tributos incidentes sobre vendas identificados diretamente na DRE e anualizados para a mesma base do diagnóstico.'}
  else if(deductions!=null){tax=Math.abs(deductions)*(12/months);reason='Aproximação pelas deduções da receita bruta. Pode conter devoluções, abatimentos e descontos, por isso o valor deve ser revisado.'}
  else if(gross!=null&&net!=null&&Math.abs(gross)>Math.abs(net)){tax=(Math.abs(gross)-Math.abs(net))*(12/months);reason='Aproximação pela diferença entre receita bruta e receita líquida da DRE. Pode incluir devoluções e abatimentos além de tributos.'}
  else if(net!=null){
   const netAnnual=Math.abs(net)*(12/months),grossField=Math.max(0,num('rbt12'));
   if(grossField>netAnnual&&grossField<=netAnnual*1.5){tax=grossField-netAnnual;reason='Aproximação pela diferença entre o faturamento bruto informado na etapa Empresa e a receita líquida importada da DRE.'}
  }
  if(tax!=null&&tax>0)candidates.push(candidate('currentConsumptionTaxAnnual','Carga atual líquida de tributos sobre consumo',tax,dreDoc.file,confidence,reason,fmtMoney(tax)));
 }

 if(!exists('currentOperatingMarginPct')&&net!=null&&Math.abs(net)>0){
  const explicitEbitda=latest(dreText,[['ebitda'],['lajida']]);
  let ebitda=explicitEbitda,confidence=explicitEbitda!=null?'high':'medium',reason=explicitEbitda!=null?'EBITDA/LAJIDA identificado diretamente na DRE.':'';
  if(ebitda==null){
   const op=latest(dreText,[['resultado antes do resultado financeiro e dos tributos','resultado antes do resultado financeiro','lucro operacional antes do resultado financeiro'],['lucro operacional','resultado operacional']]);
   const pretax=latest(dreText,[['lucro liquido antes provisao irpj e csll','lucro liquido antes da provisao irpj e csll','lucro antes do irpj e csll','resultado antes do irpj e csll','resultado antes dos tributos sobre o lucro']]);
   const finExp=Math.abs(latest(dreText,[['despesas financeiras']],['receitas financeiras','resultado financeiro'])||0),finRev=Math.abs(latest(dreText,[['receitas financeiras']],['despesas financeiras'])||0),other=latest(dreText,[['outras receitas e despesas','outras receitas/despesas','outras receitas/despesas operacionais']])||0;
   const ebit=op!=null?op:(pretax!=null?pretax+finExp-finRev-other:null);
   let da=0,daKnown=false,daReason='';
   const depDre=Math.abs(latest(dreText,[['depreciacao e amortizacao','depreciações e amortizações','depreciacoes e amortizacoes'],['depreciacao','depreciações','depreciacoes']])||0),amortDre=Math.abs(latest(dreText,[['amortizacao','amortizações','amortizacoes']],['depreciacao e amortizacao','depreciacoes e amortizacoes'])||0);
   if(depDre>0||amortDre>0){da=depDre+amortDre;daKnown=true;daReason='depreciação e amortização identificadas na DRE';confidence='high'}
   else if(bpText&&typeof latestLineValues==='function'){
    const dep=latestLineValues(bpText,['depreciacao acumulada','depreciação acumulada']),am=latestLineValues(bpText,['amortizacao acumulada','amortização acumulada']);
    const depDelta=dep.latest!=null&&dep.prior!=null?Math.max(0,Math.abs(dep.latest)-Math.abs(dep.prior)):0,amDelta=am.latest!=null&&am.prior!=null?Math.max(0,Math.abs(am.latest)-Math.abs(am.prior)):0;
    if(depDelta>0||amDelta>0){da=depDelta+amDelta;daKnown=true;daReason='variação da depreciação/amortização acumulada do BP usada como aproximação';confidence='medium'}
   }
   if(ebit!=null&&daKnown){ebitda=ebit+da;reason=`EBIT reconstruído antes do resultado financeiro, acrescido de ${daReason}. Revise se houver baixas ou reclassificações relevantes de ativos.`}
  }
  if(ebitda!=null){
   const annualEbitda=ebitda*(12/months),annualNet=Math.abs(net)*(12/months),margin=100*annualEbitda/annualNet;
   if(Number.isFinite(margin)){
    const detail=(reason?reason+' ':'')+`EBITDA anual estimado em ${fmtMoney(annualEbitda)} sobre receita líquida anual de ${fmtMoney(annualNet)}.`;
    candidates.push(candidate('currentOperatingMarginPct','Margem EBITDA atual',margin,[dreDoc.file,bpDoc?.file].filter(Boolean).join(' + '),confidence,detail,fmtPct(margin)))
   }
  }
 }
 return candidates
}
function groupedImportCandidates(){
 const raw=brmiImport.candidates.reduce((a,c,i)=>{c._index=i;(a[c.field]||(a[c.field]=[])).push(c);return a},{}),rank={high:3,medium:2,low:1},out={};
 Object.entries(raw).forEach(([field,arr])=>{
  const unique=[];
  arr.forEach(item=>{
   let same=unique.find(x=>candidateValuesEqual(x,item));
   if(!same){unique.push({...item,_index:item._index,_sources:[item.source].filter(Boolean),_reasons:[item.reason].filter(Boolean)});return}
   const sources=[...new Set([...(same._sources||[]),item.source].filter(Boolean))],reasons=[...new Set([...(same._reasons||[]),item.reason].filter(Boolean))],accepted=!!(same.accepted||item.accepted),applied=!!(same.applied||item.applied);
   if((rank[item.confidence]||0)>(rank[same.confidence]||0)||(Number(item.sourceQuality)||0)>(Number(same.sourceQuality)||0)){const keep={_sources:sources,_reasons:reasons,accepted,applied};Object.assign(same,item,keep)}
   else{same._sources=sources;same._reasons=reasons;same.accepted=accepted;same.applied=applied}
  });
  unique.forEach(item=>{const sources=item._sources||[];if(sources.length)item.source=sources.join(' + ');if(sources.length>1)item.reason=((item._reasons||[])[0]||item.reason||'')+' Mesmo valor localizado em '+sources.length+' fontes.'});
  out[field]=unique;
 });
 return out
}
function conflictGroup(arr){if(arr.length<2)return false;if(arr[0]?.field==='cnpj')return new Set(arr.map(x=>importedCnpjDigits(x.value))).size>1;const vals=arr.map(x=>x.value).filter(Number.isFinite),max=Math.max(...vals),min=Math.min(...vals);return max>0&&(max-min)/max>.05}
function renderImportFiles(){const el=$('importFileList');if(!el)return;el.innerHTML=brmiImport.files.map(f=>`<div class="importFile"><span class="importFileIcon">${f.ext.toUpperCase()}</span><div><strong>${f.name}</strong><small>${f.type||'Aguardando análise'}</small></div><span class="importFileStatus ${f.statusClass||''}">${f.status||'Pendente'}</span></div>`).join('')}
function importCandidateButtonState(c){
 if(c.accepted)return{label:'Aplicado ✓',disabled:true,cls:'importApplied'};
 if(c.applied)return{label:'Confirmar este valor',disabled:false,cls:'importAutoFilled'};
 return{label:'Usar este valor',disabled:false,cls:''}
}
function syncApplyHighButtonState(groups=groupedImportCandidates()){
 const btn=$('importApplyHigh');if(!btn)return;
 let eligible=0,accepted=0,conflicts=0;
 Object.values(groups).forEach(arr=>{const high=arr.filter(c=>c.confidence==='high'&&c.usageConfidence!=='medium'&&!c.requiresUsageReview);if(!high.length)return;if(conflictGroup(high)){conflicts++;return}eligible++;if(high[0].accepted)accepted++});
 btn.classList.remove('isPressing','importApplyDone','importApplyEmpty');btn.removeAttribute('aria-busy');
 if(!eligible){btn.disabled=true;btn.classList.add('importApplyEmpty');btn.textContent='Nenhuma sugestão de alta confiança'}
 else if(accepted===eligible){btn.disabled=true;btn.classList.add('importApplyDone');btn.textContent=accepted+' '+(accepted===1?'sugestão aplicada':'sugestões aplicadas')+' ✓'}
 else{btn.disabled=false;btn.textContent='Aplicar e confirmar '+(eligible-accepted)+' '+((eligible-accepted)===1?'sugestão segura':'sugestões seguras')}
 btn.title=conflicts?conflicts+' grupo(s) com valores divergentes ficaram para revisão manual.':'';
}
function renderImportCandidates(){
 const summary=$('importSummary'),empty=$('importEmpty'),groups=groupedImportCandidates(),keys=Object.keys(groups);
 if(!keys.length){if(summary)summary.hidden=true;if(empty)empty.hidden=false;syncApplyHighButtonState(groups);return}
 if(empty)empty.hidden=true;if(summary)summary.hidden=false;
 const uniqueCount=Object.values(groups).reduce((n,arr)=>n+arr.length,0);if($('importSummaryCount'))$('importSummaryCount').textContent=uniqueCount+' '+(uniqueCount===1?'sugestão':'sugestões');
 const root=$('importCandidateGroups');
 root.innerHTML=keys.map(field=>{const arr=groups[field],conflict=conflictGroup(arr);return '<div class="importGroup"><div class="importGroupHead"><strong>'+arr[0].label+'</strong><span class="'+(conflict?'conflict':'')+'">'+(conflict?'VALORES DIVERGENTES':arr.length===1&&(arr[0]._sources||[]).length>1?'MESMO VALOR EM VÁRIAS FONTES':'FONTE LOCALIZADA')+'</span></div><div class="importCandidates">'+arr.map(c=>{const s=importCandidateButtonState(c);return '<div class="importCandidate"><div class="importCandidateMain"><strong>'+c.display+'</strong><small>'+c.reason+'</small><div class="importMeta"><span>'+c.source+'</span><span class="'+c.confidence+'">confiança '+(c.confidence==='high'?'alta':c.confidence==='medium'?'média':'baixa')+'</span>'+(c.applied&&!c.accepted?'<span class="auto">preenchido automaticamente · aguarda confirmação</span>':'')+'</div></div><button type="button" data-import-index="'+c._index+'" '+(s.disabled?'disabled':'')+' class="'+s.cls+'">'+s.label+'</button></div>'}).join('')+'</div></div>'}).join('');
 root.querySelectorAll('[data-import-index]').forEach(b=>b.addEventListener('click',()=>applyImportCandidate(Number(b.dataset.importIndex),b)));
 syncApplyHighButtonState(groups)
}function candidateValuesEqual(a,b){
 if(!a||!b||a.field!==b.field)return false;
 if(a.field==='cnpj')return importedCnpjDigits(a.value)===importedCnpjDigits(b.value);
 if(!Number.isFinite(a.value)||!Number.isFinite(b.value))return false;
 return Math.abs(a.value-b.value)<=Math.max(.01,Math.abs(a.value)*.000001);
}
function syncImportCandidateButtons(field,activeIndex){
 const activeItem=brmiImport.candidates[activeIndex];
 brmiImport.candidates.forEach(item=>{if(!item||item.field!==field)return;const active=candidateValuesEqual(item,activeItem);item.applied=active;item.accepted=active?!!activeItem?.accepted:false});
 document.querySelectorAll('[data-import-index]').forEach(btn=>{const idx=Number(btn.dataset.importIndex),item=brmiImport.candidates[idx];if(!item||item.field!==field)return;const s=importCandidateButtonState(item);btn.textContent=s.label;btn.classList.toggle('importApplied',s.cls==='importApplied');btn.classList.toggle('importAutoFilled',s.cls==='importAutoFilled');btn.disabled=s.disabled});
 syncApplyHighButtonState()
}
function applyImportCandidate(i,button){
 const c=brmiImport.candidates[i];if(!c)return false;
 const explicit=!!button,buttonEl=button&&typeof button==='object'&&button.classList?button:null,el=$(c.field);
 if(!el){
  if(explicit){
   c.applied=true;c.accepted=true;
   if(buttonEl){buttonEl.textContent='Confirmado ✓';buttonEl.classList.add('importApplied');buttonEl.disabled=true}
   document.dispatchEvent(new CustomEvent('brmi:auxiliary-import-accepted',{detail:{field:c.field,value:c.value,source:c.source,confidence:c.confidence}}));
   return true
  }
  return false
 }
 const currentText=String(el.value||'').trim(),currentValue=typeof parseMoneyValue==='function'?parseMoneyValue(currentText):Number(currentText||0),alreadyImported=el.dataset.importVerified==='1'||el.dataset.importSource;
 if(!explicit&&(el.dataset.userEdited==='1'||el.dataset.importAccepted==='1'))return false;
 const replaceableSectorSuggestion=c.field==='legacyRate'&&el.dataset.autoSuggested==='1'&&el.dataset.userEdited!=='1';
 if(!explicit&&currentText&&!alreadyImported&&Number.isFinite(currentValue)&&Math.abs(currentValue)>.000001&&c.field!=='cnpj'&&!replaceableSectorSuggestion)return false;
 if(explicit){delete el.dataset.userEdited;el.dataset.importAccepted='1';c.accepted=true}
 if(c.field==='cnpj'){el.value=typeof normalizeCnpjInput==='function'?normalizeCnpjInput(c.value):formatImportedCnpj(c.value);el.dataset.importVerified='1';el.dataset.importSource=c.source||'';if(typeof markFieldAuto==='function')markFieldAuto('cnpj','IMPORTADO');syncImportCandidateButtons(c.field,i);if(typeof lookupCnpj==='function')lookupCnpj();return true}
 if(typeof setMoneyInputValue==='function'&&el.closest?.('.money'))setMoneyInputValue(el,c.value);else el.value=Math.round(c.value*100)/100;
 el.dataset.importVerified='1';el.dataset.importSource=c.source||'Documento importado';el.dataset.importConfidence=c.confidence||'';if(c.usageConfidence)el.dataset.importUsageConfidence=c.usageConfidence;else delete el.dataset.importUsageConfidence;if(c.ebitdaAnnual!=null)el.dataset.importEbitdaAnnual=String(c.ebitdaAnnual);else delete el.dataset.importEbitdaAnnual;if(c.fiscalMismatch)el.dataset.importFiscalMismatch='1';else delete el.dataset.importFiscalMismatch;if(c.irpjExpense!=null)el.dataset.importIrpjExpense=String(c.irpjExpense);else delete el.dataset.importIrpjExpense;if(c.csllExpense!=null)el.dataset.importCsllExpense=String(c.csllExpense);else delete el.dataset.importCsllExpense;if(c.derivedKey)el.dataset.importDerivedKey=c.derivedKey;else delete el.dataset.importDerivedKey;
 if(c.field==='legacyRate'){el.dataset.autoSuggested='0';delete el.dataset.userEdited;const note=el.closest?.('.field')?.querySelector('small');if(note)note.textContent='Calculado diretamente da DRE pela relação ICMS + ISS sobre a receita bruta. Revise apenas se a demonstração não refletir a carga efetiva da operação.'}
 if(c.field==='currentConsumptionTaxAnnual'&&$('currentConsumptionMode')){$('currentConsumptionMode').value='manual';el.readOnly=false;el.dataset.sourceNote=c.reason||'';if($('currentConsumptionTaxSource'))$('currentConsumptionTaxSource').textContent='Calculado a partir da DRE importada. '+(c.reason||'Revise a origem antes de concluir.')}
 if(c.field==='rbt12'&&$('revenueSync')?.checked&&typeof syncRevenue==='function'){syncRevenue('annual');if(typeof markFieldDerived==='function')markFieldDerived('monthlyRevenue','CALCULADO')}
 if(c.field==='monthlyRevenue'&&$('revenueSync')?.checked&&typeof syncRevenue==='function'){syncRevenue('monthly');if(typeof markFieldDerived==='function')markFieldDerived('rbt12','CALCULADO')}
 if(c.usageConfidence==='medium'&&typeof markFieldPending==='function')markFieldPending(c.field,'REVISAR USO');else if(typeof markFieldAuto==='function')markFieldAuto(c.field,c.confidence==='high'?'IMPORTADO':c.confidence==='medium'?'CALCULADO':'REVISAR');
 if(c.field==='interestExpense'&&c.usageConfidence==='medium'&&$('financeRateSource'))$('financeRateSource').textContent='Despesa financeira contábil identificada com alta confiança. O uso como aproximação do custo da dívida exige revisão dos componentes da conta.';
 try{el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}
 if(typeof financialMetrics==='function')financialMetrics();if(typeof refreshEligibilityUi==='function')refreshEligibilityUi();
 if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('import');if(typeof refreshAllFieldStates==='function')refreshAllFieldStates();syncImportCandidateButtons(c.field,i);return true
}
async function applyHighConfidenceCandidates(){
 const btn=$('importApplyHigh');
 if(btn){btn.disabled=true;btn.classList.add('isPressing');btn.setAttribute('aria-busy','true');btn.textContent='Aplicando...'}
 await new Promise(r=>setTimeout(r,140));
 const groups=groupedImportCandidates();let applied=0,skipped=0;
 Object.values(groups).forEach(arr=>{const high=arr.filter(c=>c.confidence==='high'&&c.usageConfidence!=='medium'&&!c.requiresUsageReview);if(!high.length)return;if(conflictGroup(high)){skipped++;return}if(high[0].accepted)return;if(applyImportCandidate(high[0]._index,true))applied++});
 renderImportCandidates();
 if(btn&&applied===0&&skipped){btn.disabled=false;btn.classList.remove('isPressing');btn.removeAttribute('aria-busy');btn.textContent='Revisar valores divergentes';btn.title=skipped+' grupo(s) com valores divergentes precisam de escolha manual.'}
}

function autoApplyDocumentCalculations(){
 const groups=groupedImportCandidates(),mode=importAutomationMode(),score={high:3,medium:2,low:1};
 const recommendedFields=new Set(['rbt12','cashAndEquivalents','currentAssets','currentLiabilities','currentConsumptionTaxAnnual','currentOperatingMarginPct','realAccountingProfitAnnual','debtStart','debtEnd','interestExpense','legacyRate']);
 const fields=mode==='maximum'?Object.keys(groups).filter(f=>f!=='cnpj'):[...recommendedFields];
 fields.forEach(field=>{
  const arr=groups[field]||[];if(!arr.length||conflictGroup(arr))return;
  const ranked=[...arr].sort((a,b)=>(b.sourceQuality||score[b.confidence]||0)-(a.sourceQuality||score[a.confidence]||0));
  const best=ranked[0];if(!best)return;
  if(best.usageConfidence==='medium'||best.requiresUsageReview)return;
  if(mode==='rigorous'&&best.confidence!=='high')return;
  if(mode==='recommended'){
   if(['rbt12','cashAndEquivalents','currentAssets','currentLiabilities','interestExpense'].includes(field)&&best.confidence!=='high')return;
   if(['debtStart','debtEnd','realAccountingProfitAnnual'].includes(field)&&best.confidence==='low')return;
  }
  applyImportCandidate(best._index);
 });
 if(typeof financialMetrics==='function')financialMetrics();
 document.dispatchEvent(new CustomEvent('brmi:automation-applied',{detail:{mode}}));
}

function updateEconomicMetricAvailability(){
 const hasDre=brmiImport.docs.some(d=>d.type==='DRE'||d.type==='Balanço + DRE'),groups=groupedImportCandidates();
 if(!hasDre)return;
 const tax=$('currentConsumptionTaxAnnual'),taxSource=$('currentConsumptionTaxSource');
 if(tax&&!(groups.currentConsumptionTaxAnnual||[]).length){
  const manualTax=String(tax.value||'').trim()!==''&&tax.dataset.importVerified!=='1';
  if(!manualTax){tax.value='';tax.placeholder='DRE sem abertura suficiente';if(typeof markFieldPending==='function')markFieldPending('currentConsumptionTaxAnnual','DADOS INSUFICIENTES')}
  if(taxSource)taxSource.textContent=manualTax?'Valor manual preservado. A DRE importada não contém abertura suficiente para validá-lo.':'A DRE foi importada, mas não apresenta receita bruta, deduções ou tributos sobre vendas em nível suficiente para calcular a carga atual sem inventar uma premissa. Informe um relatório fiscal/contábil mais detalhado.';
 }
 const margin=$('currentOperatingMarginPct');
 if(margin&&!(groups.currentOperatingMarginPct||[]).length){
  const manualMargin=String(margin.value||'').trim()!==''&&margin.dataset.importVerified!=='1';
  if(!manualMargin){margin.value='';margin.placeholder='DRE sem base suficiente';if(typeof markFieldPending==='function')markFieldPending('currentOperatingMarginPct','DADOS INSUFICIENTES')}
  const note=margin.closest('.field')?.querySelector('small');if(note)note.textContent=manualMargin?'Margem manual preservada. Os documentos importados não permitiram validá-la automaticamente.':'O sistema tentou reconstruir o EBITDA pela DRE e pelo BP, mas faltaram dados de resultado operacional e/ou depreciação e amortização.';
 }
}


function clearLegacyNetRevenueAsGross(){
 const q=brmiImport.revenueQuality,annual=$('rbt12');if(!q||q.status!=='net-only'||!annual||annual.dataset.userEdited==='1')return false;
 const months=Math.max(1,Math.min(12,Number($('dreMonths')?.value)||12)),annualNet=Number(q.net||0)*(12/months),current=num('rbt12');
 if(!(annualNet>0&&Math.abs(current-annualNet)<1))return false;
 annual.value='';delete annual.dataset.importVerified;delete annual.dataset.importSource;delete annual.dataset.importDerivedKey;
 const monthly=$('monthlyRevenue');if(monthly&&$('revenueSync')?.checked)monthly.value='';
 if(typeof markFieldPending==='function'){markFieldPending('rbt12','CONFIRMAR BRUTO');markFieldPending('monthlyRevenue','CONFIRMAR BRUTO')}
 q.cleanedLegacyNet=true;q.annualNet=annualNet;
 try{const saved=JSON.parse(localStorage.getItem('brmi_v3')||'{}');delete saved.rbt12;if($('revenueSync')?.checked)delete saved.monthlyRevenue;localStorage.setItem('brmi_v3',JSON.stringify(saved))}catch(_){}
 return true;
}
function refreshNetToGrossTaxApproximation(){
 const q=brmiImport.revenueQuality;if(!q||q.status!=='net-only')return null;
 brmiImport.candidates=brmiImport.candidates.filter(x=>x?.derivedKey!=='gross-net-tax');
 const tax=$('currentConsumptionTaxAnnual');
 if(tax?.dataset?.importDerivedKey==='gross-net-tax'){tax.value='';delete tax.dataset.importVerified;delete tax.dataset.importSource;delete tax.dataset.importDerivedKey;delete tax.dataset.sourceNote}
 const explicit=brmiImport.candidates.some(x=>x?.field==='currentConsumptionTaxAnnual');
 if(explicit)return null;
 const months=Math.max(1,Math.min(12,Number($('dreMonths')?.value)||12)),annualNet=Number(q.net||0)*(12/months),gross=num('rbt12');
 if(!(gross>annualNet&&gross<=annualNet*1.5))return null;
 const approx=candidate('currentConsumptionTaxAnnual','Carga atual líquida de tributos sobre consumo',gross-annualNet,String(q.source||'DRE')+' + faturamento bruto informado','low','Aproximação pela diferença entre faturamento bruto e Receita Líquida da DRE. Essa diferença pode incluir devoluções, abatimentos e descontos além de tributos; revise antes de concluir.',fmtMoney(gross-annualNet));
 if(!approx)return null;approx.derivedKey='gross-net-tax';brmiImport.candidates.push(approx);groupedImportCandidates();
 const idx=brmiImport.candidates.indexOf(approx);applyImportCandidate(idx);renderImportCandidates();return approx.value;
}
function clearImportedDocumentValues(){
 const fields=new Set((brmiImport.candidates||[]).map(x=>x?.field).filter(Boolean));['realAccountingProfitAnnual','currentConsumptionTaxAnnual','currentPisCofinsAnnual','currentIcmsAnnual','currentIssAnnual','currentOtherConsumptionAnnual','currentOperatingMarginPct','debtStart','debtEnd','interestExpense','cashAndEquivalents','liquidInvestments','currentAssets','currentLiabilities'].forEach(x=>fields.add(x));
 const cleared=[];
 fields.forEach(id=>{if(id==='cnpj')return;const el=$(id);if(!el||el.dataset.userEdited==='1'||el.dataset.importVerified!=='1')return;el.value='';delete el.dataset.importVerified;delete el.dataset.importSource;delete el.dataset.importConfidence;delete el.dataset.importAccepted;delete el.dataset.importUsageConfidence;delete el.dataset.importEbitdaAnnual;delete el.dataset.importFiscalMismatch;delete el.dataset.importIrpjExpense;delete el.dataset.importCsllExpense;delete el.dataset.importDerivedKey;delete el.dataset.sourceNote;cleared.push(id);if(typeof markFieldPending==='function')markFieldPending(id,'REVISAR')});
 if(cleared.includes('rbt12')&&$('revenueSync')?.checked&&$('monthlyRevenue')){$('monthlyRevenue').value='';cleared.push('monthlyRevenue')}
 try{const saved=JSON.parse(localStorage.getItem('brmi_v3')||'{}');cleared.forEach(id=>delete saved[id]);localStorage.setItem('brmi_v3',JSON.stringify(saved))}catch(_){}
 brmiImport.verifiedAccountingProfit=null;brmiImport.revenueQuality=null;
 if(typeof financialMetrics==='function')financialMetrics();if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('import-clear');
 return cleared;
}
function bindImportedCompanyIntegrity(){
 const el=$('cnpj');if(!el||el.dataset.importCompanyBound)return;el.dataset.importCompanyBound='1';
 el.addEventListener('input',e=>{if(!e.isTrusted||!brmiImport.docs?.length)return;const raw=importedCnpjDigits(el.value);if(raw.length!==14)return;const ids=[...new Set(brmiImport.docs.map(d=>d.cnpj).filter(Boolean))];if(ids.length!==1||ids[0]===raw)return;clearImportedDocumentValues();brmiImport.files=[];brmiImport.docs=[];brmiImport.candidates=[];brmiImport.lastLookupCnpj=null;renderImportFiles();if($('importSummary'))$('importSummary').hidden=true;const status=$('lookupStatus');if(status){status.className='status';status.textContent='O CNPJ foi alterado. Os valores vinculados aos documentos da empresa anterior foram descartados; importe os documentos da nova empresa.'}});
}

function bestVerifiedAccountingProfit(){
 const items=(brmiImport.candidates||[]).filter(x=>x?.field==='realAccountingProfitAnnual'&&Number.isFinite(x.value));
 if(!items.length)return null;
 const score={high:3,medium:2,low:1},ranked=[...items].sort((a,b)=>(score[b.confidence]||0)-(score[a.confidence]||0)),best=ranked[0],peers=ranked.filter(x=>x.confidence===best.confidence);
 if(peers.length>1){
  const vals=peers.map(x=>x.value),max=Math.max(...vals),min=Math.min(...vals);
  if(max>0&&(max-min)/max>.05)return null;
 }
 return best;
}
function writeVerifiedAccountingProfit(){
 const best=bestVerifiedAccountingProfit(),el=$('realAccountingProfitAnnual');if(!best||!el)return null;
 const currentText=String(el.value||'').trim(),alreadyImported=el.dataset.importVerified==='1',currentValue=typeof parseMoneyValue==='function'?parseMoneyValue(currentText):Number(currentText||0);
 if(el.dataset.userEdited==='1')return null;
 if(currentText&&!alreadyImported&&Number.isFinite(currentValue)&&Math.abs(currentValue)>.000001)return null;
 if(typeof setMoneyInputValue==='function')setMoneyInputValue(el,best.value);else el.value=Math.round(best.value*100)/100;
 el.dataset.importVerified='1';el.dataset.importSource=best.source||'DRE importada';el.dataset.importConfidence=best.confidence||'';
 if(best.fiscalMismatch)el.dataset.importFiscalMismatch='1';else delete el.dataset.importFiscalMismatch;
 if(best.irpjExpense!=null)el.dataset.importIrpjExpense=String(best.irpjExpense);else delete el.dataset.importIrpjExpense;
 if(best.csllExpense!=null)el.dataset.importCsllExpense=String(best.csllExpense);else delete el.dataset.importCsllExpense;
 brmiImport.verifiedAccountingProfit={value:best.value,source:best.source||'DRE importada',confidence:best.confidence,fiscalMismatch:!!best.fiscalMismatch,irpjExpense:best.irpjExpense||0,csllExpense:best.csllExpense||0};
 try{
  const saved=JSON.parse(localStorage.getItem('brmi_v3')||'{}');saved.realAccountingProfitAnnual=String(el.value);localStorage.setItem('brmi_v3',JSON.stringify(saved));
 }catch(_){}
 try{el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}
 if(typeof markFieldAuto==='function')markFieldAuto('realAccountingProfitAnnual','IMPORTADO');
 const idx=best._index!=null?best._index:brmiImport.candidates.indexOf(best);if(idx>=0)syncImportCandidateButtons('realAccountingProfitAnnual',idx);
 return best.value;
}
function forceApplyVerifiedAccountingProfit(){return writeVerifiedAccountingProfit()}
async function autoLookupImportedCompany(docs){const ids=[...new Set((docs||[]).map(d=>d.cnpj).filter(Boolean))];if(ids.length!==1)return;const raw=ids[0],el=$('cnpj'),status=$('lookupStatus');if(!el)return;const current=importedCnpjDigits(el.value);if(current&&current!==raw){if(status){status.className='status';status.textContent=`O documento contém o CNPJ ${formatImportedCnpj(raw)}, diferente do CNPJ já informado. Revise antes de aplicar.`}return}el.value=typeof normalizeCnpjInput==='function'?normalizeCnpjInput(raw):formatImportedCnpj(raw);if(typeof markFieldAuto==='function')markFieldAuto('cnpj','IMPORTADO');if(brmiImport.lastLookupCnpj===raw)return;brmiImport.lastLookupCnpj=raw;if(typeof lookupCnpj==='function')await lookupCnpj()}
async function processImportFiles(files){
 const list=[...files];if(!list.length)return;brmiImport.files=list.map(f=>({name:f.name,ext:extOf(f.name),status:'Na fila'}));brmiImport.docs=[];brmiImport.candidates=[];renderImportFiles();const applyBtn=$('importApplyHigh');if(applyBtn){applyBtn.disabled=false;applyBtn.classList.remove('isPressing','importApplyDone','importApplyEmpty');applyBtn.textContent='Aplicar e confirmar sugestões seguras';applyBtn.removeAttribute('aria-busy')}const progress=$('importProgress');if(progress)progress.hidden=false;
 for(let i=0;i<list.length;i++){const f=list[i],row=brmiImport.files[i];row.status='Analisando';row.statusClass='';renderImportFiles();if($('importProgressTitle'))$('importProgressTitle').textContent=`Analisando ${f.name}`;if($('importProgressText'))$('importProgressText').textContent=`Arquivo ${i+1} de ${list.length}. Procurando faturamento, clientes, compras, caixa, BP, dívida, juros, folha e margem.`;try{const parsed=await readImportFile(f),doc=analyseImportDoc(f,parsed);row.type=doc.type;row.status=doc.candidates.length||doc.purchaseTotal?'Lido':'Sem indicador';row.statusClass=doc.candidates.length||doc.purchaseTotal?'ok':'warn';brmiImport.docs.push(doc);brmiImport.candidates.push(...doc.candidates)}catch(e){row.status='Não lido';row.statusClass='bad';row.type=e.message}renderImportFiles();await new Promise(r=>setTimeout(r,220))}
 buildCrossCandidates(brmiImport.docs,brmiImport.candidates);
 const dreOnly=brmiImport.docs.find(d=>(d.type==='DRE'||d.type==='Balanço + DRE')&&d.revenueNet>0&&!d.revenueGross);
 brmiImport.revenueQuality=dreOnly?{status:'net-only',net:dreOnly.revenueNet,source:dreOnly.file}:null;
 clearLegacyNetRevenueAsGross();refreshNetToGrossTaxApproximation();writeVerifiedAccountingProfit();if(progress)progress.hidden=true;renderImportCandidates();autoApplyDocumentCalculations();writeVerifiedAccountingProfit();updateEconomicMetricAvailability();await autoLookupImportedCompany(brmiImport.docs);autoApplyDocumentCalculations();writeVerifiedAccountingProfit();updateEconomicMetricAvailability();if(typeof calculate==='function')calculate()
}
function clearImport(){clearImportedDocumentValues();brmiImport.files=[];brmiImport.docs=[];brmiImport.candidates=[];brmiImport.lastLookupCnpj=null;renderImportFiles();if($('importSummary'))$('importSummary').hidden=true;if($('importEmpty'))$('importEmpty').hidden=true;const inp=$('importFiles');if(inp)inp.value=''}
function initDocumentImport(){const setup=$('setupMount'),mount=$('documentImportMount')||setup;if(!setup||!mount)return;if($('importPanel')){const panel=$('importPanel');if(panel.parentElement!==mount)mount.appendChild(panel);return;}
 ['rbt12','realAccountingProfitAnnual','currentConsumptionTaxAnnual','currentPisCofinsAnnual','currentIcmsAnnual','currentIssAnnual','currentOtherConsumptionAnnual','currentOperatingMarginPct','debtStart','debtEnd','interestExpense','cashAndEquivalents','liquidInvestments','currentAssets','currentLiabilities'].forEach(id=>{const el=$(id);if(!el||el.dataset.importProvenanceBound)return;el.dataset.importProvenanceBound='1';const userEdit=e=>{if(e.isTrusted){el.dataset.userEdited='1';delete el.dataset.importVerified;delete el.dataset.importSource;delete el.dataset.importConfidence;delete el.dataset.importAccepted;delete el.dataset.importUsageConfidence;delete el.dataset.importEbitdaAnnual;delete el.dataset.importFiscalMismatch;delete el.dataset.importIrpjExpense;delete el.dataset.importCsllExpense;(brmiImport.candidates||[]).forEach(x=>{if(x?.field===id){x.applied=false;x.accepted=false}});if(e.type==='change')renderImportCandidates()}};el.addEventListener('input',userEdit);el.addEventListener('change',userEdit)});
 bindImportedCompanyIntegrity();
 const revenue=$('rbt12');if(revenue&&!revenue.dataset.importGrossNetBound){revenue.dataset.importGrossNetBound='1';const refresh=()=>{if(brmiImport.docs?.length){refreshNetToGrossTaxApproximation();updateEconomicMetricAvailability();if(typeof calculate==='function')calculate()}};revenue.addEventListener('change',refresh);revenue.addEventListener('blur',refresh)}
 mount.insertAdjacentHTML('beforeend',importMarkup());document.dispatchEvent(new CustomEvent('brmi:import-ready'));const input=$('importFiles'),drop=$('importDrop'),choose=$('importChooseBtn');choose?.addEventListener('click',e=>{e.stopPropagation();input?.click()});drop?.addEventListener('click',e=>{if(e.target!==choose)input?.click()});drop?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input?.click()}});input?.addEventListener('change',()=>processImportFiles(input.files));['dragenter','dragover'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop?.addEventListener('drop',e=>processImportFiles(e.dataTransfer.files));$('importApplyHigh')?.addEventListener('click',applyHighConfidenceCandidates);$('importClear')?.addEventListener('click',clearImport)}
