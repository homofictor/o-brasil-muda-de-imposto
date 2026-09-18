window.brmiImport={files:[],candidates:[],docs:[]};

function importMarkup(){return `<section class="panel importPanel" id="importPanel">
 <div class="sectionTitle"><div><span>05</span><div><div class="importTitleTag">V3.2 · preenchimento inteligente</div><h2>Importar dados da empresa</h2></div></div><p>Envie o que tiver disponível. O simulador tenta localizar números úteis, mostra a fonte e pede sua confirmação antes de alimentar o diagnóstico.</p></div>
 <div class="importDrop" id="importDrop" tabindex="0" role="button" aria-label="Selecionar documentos da empresa"><strong>Arraste Balanço, DRE ou relatórios do ERP</strong><p>Você pode combinar vários arquivos. Quanto mais informação consistente houver, menos campos precisarão ser preenchidos manualmente.</p><button id="importChooseBtn" type="button">Selecionar arquivos</button><small>Formatos: PDF com texto pesquisável, CSV, XLS e XLSX · múltiplos arquivos permitidos</small><input id="importFiles" type="file" multiple accept=".pdf,.csv,.xls,.xlsx,text/csv,application/pdf" hidden></div>
 <div class="importPrivacy"><b>🔒</b><div><strong>Processamento local nesta versão.</strong> Os arquivos são lidos no seu navegador para montar as sugestões e não são enviados ao servidor do simulador.</div></div>
 <div id="importProgress" class="importProgress" hidden><span class="importSpinner"></span><div><strong id="importProgressTitle">Analisando documentos...</strong><small id="importProgressText">Identificando estrutura e indicadores.</small></div></div>
 <div id="importFileList" class="importFileList"></div>
 <div id="importSummary" class="importSummary" hidden><div class="importSummaryHead"><div><h3>Informações encontradas</h3><p>Confira a origem e a confiança de cada sugestão antes de usar.</p></div><span id="importSummaryCount" class="importSummaryCount">0 sugestões</span></div><div id="importCandidateGroups" class="importCandidateGroups"></div><div class="importActions"><button class="importApplyHigh" id="importApplyHigh" type="button">Aplicar sugestões de alta confiança</button><button class="importClear" id="importClear" type="button">Limpar documentos</button></div></div>
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
function detectImportedCnpj(text,type){if(!/Balanço|DRE/.test(type))return null;const source=String(text||''),re=/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,found=new Map();let m;while((m=re.exec(source))){const digits=importedCnpjDigits(m[0]);if(!validImportedCnpj(digits))continue;const context=normImport(source.slice(Math.max(0,m.index-140),Math.min(source.length,m.index+m[0].length+100)));let score=1;if(/cnpj/.test(context))score+=4;if(/entidade|nome empresarial|titular da escrituracao/.test(context))score+=6;if(/signatario|certificado|responsavel legal|contador/.test(context))score-=7;const item=found.get(digits)||{digits,count:0,score:0};item.count++;item.score+=score;found.set(digits,item)}const ranked=[...found.values()].sort((a,b)=>(b.score+b.count*2)-(a.score+a.count*2)),best=ranked[0],second=ranked[1];if(!best||!(best.count>=2||best.score>=8))return null;if(second&&(best.score+best.count*2)<=(second.score+second.count*2)+2)return null;return best.digits}
function csvRows(text){const first=(text.split(/\r?\n/)[0]||''),sep=(first.match(/;/g)||[]).length>=(first.match(/,/g)||[]).length?';':',';const rows=[];let row=[],cur='',quote=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'){if(quote&&n==='"'){cur+='"';i++}else quote=!quote}else if(c===sep&&!quote){row.push(cur);cur=''}else if((c==='\n'||c==='\r')&&!quote){if(c==='\r'&&n==='\n')i++;row.push(cur);if(row.some(v=>String(v).trim()))rows.push(row);row=[];cur=''}else cur+=c}row.push(cur);if(row.some(v=>String(v).trim()))rows.push(row);return rows}
function rowsText(rows){return rows.map(r=>r.map(v=>String(v??'')).join(' | ')).join('\n')}
function pdfItemsToText(items){const rows=[];for(const it of items||[]){const str=String(it.str||'').trim();if(!str)continue;const x=Number(it.transform?.[4]||0),y=Number(it.transform?.[5]||0);let row=rows.find(r=>Math.abs(r.y-y)<=1.5);if(!row){row={y,items:[]};rows.push(row)}row.items.push({x,str})}return rows.sort((a,b)=>b.y-a.y).map(r=>r.items.sort((a,b)=>a.x-b.x).map(i=>i.str).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean).join('\n')}
async function readImportFile(file){const ext=extOf(file.name);if(ext==='csv'){let text=await file.text();return{rows:csvRows(text),text,type:'CSV'}}if(ext==='xls'||ext==='xlsx'){await ensureXlsx();const ab=await file.arrayBuffer(),wb=XLSX.read(ab,{type:'array'}),rows=[];wb.SheetNames.forEach(n=>{rows.push([`PLANILHA: ${n}`]);rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:''}))});return{rows,text:rowsText(rows),type:'Excel'}}if(ext==='pdf'){await ensurePdf();const ab=await file.arrayBuffer(),pdf=await pdfjsLib.getDocument({data:ab}).promise,pages=[];for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),content=await page.getTextContent();pages.push(pdfItemsToText(content.items))}return{rows:null,text:pages.join('\n'),type:'PDF'}}throw new Error('Formato não suportado.')}
function detectDoc(text,rows){const t=normImport(text),balance=/ativo circulante/.test(t)&&/passivo/.test(t)&&/patrimonio liquido/.test(t),dre=/receitas? (brutas?|operacionais?|liquidas?)/.test(t)&&(/lucro bruto|lucro liquido|resultado do exercicio|resultado antes|despesas operacionais|despesas financeiras|custos e despesas|ebitda|lajida/.test(t));if(balance&&dre)return'Balanço + DRE';if(balance)return'Balanço';if(dre)return'DRE';if(rows&&/fornecedor|compra|entrada|contas a pagar/.test(t))return'Relatório de compras';if(rows&&/cliente|venda|faturamento|nota fiscal|contas a receber/.test(t))return'Relatório de vendas';if(/folha de pagamento|salarios|pro labore/.test(t))return'Folha / pessoal';return'Relatório'}
function importStatementSections(text){const source=String(text||''),bpStart=source.search(/balan[cç]o patrimonial/i),dreStart=source.search(/demonstra[cç][aã]o\s+(?:d[eo]\s+)?resultado/i);return{balance:bpStart>=0?source.slice(bpStart,dreStart>bpStart?dreStart:undefined):source,dre:dreStart>=0?source.slice(dreStart):source}}
function lineValue(text,labels,exclude=[]){const lines=String(text||'').split(/\r?\n/);for(const line of lines){const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;const matches=line.match(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|-?\d+(?:[.,]\d{1,2})?/g)||[];const nums=matches.map(brNum).filter(Number.isFinite);if(nums.length)return nums[nums.length-1]}return null}
function firstLineValue(text,labelGroups){for(const labels of labelGroups){const v=lineValue(text,labels);if(v!=null)return v}return null}
function lastLineValue(text,labels,exclude=[]){const lines=String(text||'').split(/\r?\n/);let found=null;for(const line of lines){const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;const matches=line.match(/(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})|-?\d+(?:[.,]\d{1,2})?/g)||[],nums=matches.map(brNum).filter(Number.isFinite);if(nums.length)found=nums[nums.length-1]}return found}
function lastFirstLineValue(text,labelGroups){for(const labels of labelGroups){const v=lastLineValue(text,labels);if(v!=null)return v}return null}

function importNumberTokens(line){
 const matches=String(line||'').match(/\(?\s*(?:R\$\s*)?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?\s*\)?|\(?\s*-?\d+(?:[.,]\d{1,2})?\s*\)?/g)||[];
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
 const pair=nums.slice(-2);return order==='latest-last'?{latest:pair[1],prior:pair[0],ordered:true}:{latest:pair[0],prior:pair[1],ordered:order==='latest-first'}
}
function latestLineValues(text,labels,exclude=[]){
 const order=comparativeOrder(text),lines=statementRows(text);
 for(const line of lines){
  const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;
  return orderedLineValues(line,order)
 }
 return{latest:null,prior:null,ordered:false}
}
function latestLineValue(text,labels,exclude=[]){return latestLineValues(text,labels,exclude).latest}
function firstLatestLineValue(text,labelGroups,exclude=[]){for(const labels of labelGroups){const v=latestLineValue(text,labels,exclude);if(v!=null)return v}return null}
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
  const broad=/emprestimos? e financiamentos?/.test(n)&&!specific&&!mutual;
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

function tabularMetrics(rows){
 if(!rows||rows.length<2)return{};let hi=-1;
 for(let i=0;i<Math.min(15,rows.length);i++){const h=rows[i].map(normImport);if(h.some(x=>/cliente|cpf|cnpj|documento|fornecedor|valor|total|regime/.test(x))){hi=i;break}}
 if(hi<0)return{};const headers=rows[hi].map(normImport),data=rows.slice(hi+1).filter(r=>r.some(v=>String(v).trim()));
 const find=(terms)=>headers.findIndex(h=>terms.some(t=>h.includes(t)));const docIdx=find(['cpf/cnpj','cpf cnpj','documento','cnpj','cpf']),clientIdx=find(['cliente','sacado','tomador']),supplierIdx=find(['fornecedor','emitente']),valueIdx=find(['valor total','valor','total','faturamento','liquido']),regimeIdx=find(['regime','tributacao','simples']);
 let b2bNum=0,totalNum=0,purchaseTotal=0,regular=0,supTotal=0;
 data.forEach(r=>{const value=valueIdx>=0?Math.abs(brNum(r[valueIdx])):1;if(!Number.isFinite(value)||value===0)return;if(docIdx>=0){const digits=String(r[docIdx]||'').replace(/\D/g,'');if(digits.length===14)b2bNum+=value;if(digits.length===11||digits.length===14)totalNum+=value}else if(clientIdx>=0){const c=normImport(r[clientIdx]);if(/pj|empresa|juridica|cnpj/.test(c))b2bNum+=value;if(c)totalNum+=value}if(supplierIdx>=0){purchaseTotal+=valueIdx>=0?value:0;supTotal+=value;if(regimeIdx>=0){const rg=normImport(r[regimeIdx]);if(/lucro real|presumido|regular|normal/.test(rg))regular+=value}}});
 const out={};if(totalNum>0)out.b2bPct=100*b2bNum/totalNum;if(purchaseTotal>0)out.purchaseTotal=purchaseTotal;if(supTotal>0&&regimeIdx>=0)out.regularSuppliersPct=100*regular/supTotal;return out
}
function candidate(field,label,value,source,confidence,reason,display){if(field==='cnpj'){if(!validImportedCnpj(value))return null}else if(!Number.isFinite(value))return null;return{field,label,value,source,confidence,reason,display:display||(field==='cnpj'?formatImportedCnpj(value):(field.toLowerCase().includes('pct')||field==='realProfitMargin'?fmtPct(value):fmtMoney(value)))}}

function analyseImportDoc(file,parsed){
 const text=parsed.text,type=detectDoc(text,parsed.rows),tab=tabularMetrics(parsed.rows),c=[],sections=importStatementSections(text),balanceDoc=type==='Balanço'||type==='Balanço + DRE',dreDoc=type==='DRE'||type==='Balanço + DRE',bpText=balanceDoc?sections.balance:text,dreText=dreDoc?sections.dre:text,importedCnpj=detectImportedCnpj(text,type),dreMonths=Math.max(1,Math.min(12,Number($('dreMonths')?.value)||12)),annualFactor=12/dreMonths;
 const revenueGross=firstLatestLineValue(dreText,[['receita bruta','receita operacional bruta','faturamento bruto','faturamento total'],['servicos prestados','vendas de mercadorias','receita de vendas']]);
 const revenueNet=firstLatestLineValue(dreText,[['receita liquida','receita operacional liquida','receita liquida de vendas']]);
 const revenueOperational=firstLatestLineValue(dreText,[['receitas operacionais']]);
 const revenueForRbt12=revenueGross||(type==='Relatório de vendas'?revenueOperational||revenueNet:null);
 const deductions=Math.abs(firstLatestLineValue(dreText,[['deducoes da receita bruta','deducoes sobre vendas','deducoes da receita'],['impostos, devolucoes e abatimentos']])||0);
 const costs=firstLatestLineValue(dreText,[['cmv','cpv','csp','custo das mercadorias','custo dos produtos','custo dos servicos'],['custos das atividades empresariais'],['custos gerais','custos operacionais']]);
 const explicitCash=firstLatestLineValue(bpText,[['caixa e equivalentes'],['disponibilidades'],['caixa bancos']]),cashBox=firstLatestLineValue(bpText,[['caixa geral'],['caixa']],['equivalentes']),banks=firstLatestLineValue(bpText,[['bancos conta movimento'],['bancos c/ movimento']]),cashComponents=((cashBox||0)+(banks||0))||null,cash=cashComponents!=null?cashComponents:explicitCash;
 const investments=firstLatestLineValue(bpText,[['aplicacoes financeiras de liquidez imediata'],['aplicacoes de liquidez imediata'],['aplicacoes financeiras']],['caixa e equivalentes']);
 const currentAssets=latestLineValue(bpText,['ativo circulante'],['total do ativo','nao circulante']);
 const currentLiabilities=latestLineValue(bpText,['passivo circulante'],['nao circulante']);
 const pretaxProfit=firstLatestLineValue(dreText,[['lucro liquido antes provisao irpj e csll','lucro liquido antes da provisao irpj e csll','lucro antes do irpj e csll','lucro antes do irpj','lucro antes do imposto de renda','resultado antes do irpj','resultado antes dos tributos sobre o lucro','resultado antes dos impostos sobre o lucro'],['lucro antes dos tributos','resultado antes dos tributos']]);
 const netProfit=firstLatestLineValue(dreText,[['lucro liquido','resultado liquido','resultado do exercicio','resultado exercicio']]);
 const irpjExpense=Math.abs(firstLatestLineValue(dreText,[['imposto de renda corrente','irpj corrente'],['imposto de renda']])||0);
 const csllExpense=Math.abs(firstLatestLineValue(dreText,[['contribuicao social corrente','csll corrente'],['contribuicao social sobre o lucro','csll']])||0);
 const accountingProfit=pretaxProfit!=null?pretaxProfit:(netProfit!=null&&(irpjExpense>0||csllExpense>0)?netProfit+irpjExpense+csllExpense:null);
 const payrollCosts=latestLineValue(dreText,['custos com pessoal']),payrollExpenses=latestLineValue(dreText,['despesas com pessoal']),payroll=(payrollCosts||0)+(payrollExpenses||0)||latestLineValue(dreText,['folha de pagamento','salarios e encargos','pessoal e encargos']);
 const debtBalances=financialDebtBalances(bpText),debtEnd=debtBalances.end,debtStart=debtBalances.start,debtOrdered=debtBalances.ordered;
 const interestRaw=firstLatestLineValue(dreText,[['juros e encargos da divida','juros e encargos financeiros'],['juros sobre emprestimos','juros de emprestimos','juros de empréstimos'],['juros sobre financiamentos','juros de financiamentos'],['encargos de emprestimos','encargos de financiamentos'],['encargos financeiros de emprestimos','encargos financeiros de financiamentos'],['juros passivos','juros bancarios','juros bancários']]);
 const genericFinanceRaw=latestLineValue(dreText,['despesas financeiras'],['receitas financeiras','resultado financeiro']);
 const interest=interestRaw==null?null:Math.abs(interestRaw),genericFinance=genericFinanceRaw==null?null:Math.abs(genericFinanceRaw);
 const taxTotalRaw=firstLatestLineValue(dreText,[['tributos incidentes sobre vendas'],['impostos incidentes sobre vendas'],['tributos sobre vendas'],['impostos sobre vendas'],['deducoes tributarias']]);
 let consumptionTaxes=taxTotalRaw==null?0:Math.abs(taxTotalRaw),taxConfidence=taxTotalRaw!=null?'high':null,taxReason=taxTotalRaw!=null?'Total de tributos/impostos incidentes sobre vendas identificado na DRE.':'';
 if(!consumptionTaxes){
  const groups=[['pis sobre vendas','pis s/ vendas'],['cofins sobre vendas','cofins s/ vendas'],['icms sobre vendas','icms s/ vendas'],['iss sobre vendas','iss s/ vendas'],['ipi sobre vendas','ipi s/ vendas']];
  const vals=groups.map(labels=>latestLineValue(dreText,labels,['a recuperar','credito','diferido'])).filter(v=>v!=null).map(v=>Math.abs(v));
  if(vals.length){consumptionTaxes=vals.reduce((s,v)=>s+v,0);taxConfidence='medium';taxReason='Tributos sobre vendas somados a partir das contas identificadas na DRE.'}
 }
 if(!consumptionTaxes&&deductions>0){consumptionTaxes=deductions;taxConfidence='low';taxReason='Aproximação pela linha total de deduções da receita bruta. Pode incluir devoluções, abatimentos e descontos, portanto exige revisão.'}
 const explicitEbitda=firstLatestLineValue(dreText,[['ebitda'],['lajida']]);
 const operatingBeforeFinance=firstLatestLineValue(dreText,[['resultado antes do resultado financeiro e dos tributos','resultado antes do resultado financeiro','lucro operacional antes do resultado financeiro']]);
 const operatingProfit=operatingBeforeFinance!=null?operatingBeforeFinance:firstLatestLineValue(dreText,[['resultado operacional','lucro operacional']]);
 const depreciation=Math.abs(firstLatestLineValue(dreText,[['depreciacao e amortizacao','depreciacoes e amortizacoes'],['depreciacao','depreciacoes']])||0);
 const amortization=Math.abs(firstLatestLineValue(dreText,[['amortizacao','amortizacoes']],['depreciacao e amortizacao','depreciacoes e amortizacoes'])||0);
 const ebitda=explicitEbitda!=null?explicitEbitda:(operatingProfit!=null?operatingProfit+depreciation+amortization:null);
 const revenueNetForMargin=revenueNet>0?Math.abs(revenueNet):(revenueGross>0?Math.max(0,Math.abs(revenueGross)-deductions):0);const ebitdaMargin=ebitda!=null&&revenueNetForMargin>0?100*ebitda/revenueNetForMargin:null;
 if(importedCnpj)c.push(candidate('cnpj','CNPJ da empresa',importedCnpj,file.name,'high','CNPJ validado e identificado no cabeçalho da demonstração contábil.',formatImportedCnpj(importedCnpj)));
 if(revenueForRbt12>0)c.push(candidate('rbt12','Faturamento em 12 meses (RBT12)',Math.abs(revenueForRbt12),file.name,revenueGross!=null?'high':'medium',revenueGross!=null?'Receita bruta/faturamento localizado no documento.':'Total de vendas localizado no relatório comercial.',fmtMoney(Math.abs(revenueForRbt12))));
 if(cash!=null&&balanceDoc)c.push(candidate('cashAndEquivalents','Caixa e bancos',Math.abs(cash),file.name,'high',cashComponents!=null?'Caixa e bancos conta movimento somados sem duplicar aplicações financeiras.':'Total de caixa e equivalentes usado porque o balanço não detalhou caixa e bancos separadamente.',fmtMoney(Math.abs(cash))));
 if(investments!=null&&Math.abs(investments)>0&&balanceDoc&&(cashComponents!=null||explicitCash==null))c.push(candidate('liquidInvestments','Aplicações de liquidez imediata',Math.abs(investments),file.name,'medium','Aplicações financeiras localizadas separadamente do caixa e bancos. Confirme se possuem liquidez imediata.',fmtMoney(Math.abs(investments))));
 if(currentAssets!=null&&Math.abs(currentAssets)>0&&balanceDoc)c.push(candidate('currentAssets','Ativo circulante',Math.abs(currentAssets),file.name,'high','Total do ativo circulante localizado no balanço.',fmtMoney(Math.abs(currentAssets))));
 if(currentLiabilities!=null&&Math.abs(currentLiabilities)>0&&balanceDoc)c.push(candidate('currentLiabilities','Passivo circulante',Math.abs(currentLiabilities),file.name,'high','Total do passivo circulante localizado no balanço.',fmtMoney(Math.abs(currentLiabilities))));
 if(debtEnd>0&&balanceDoc)c.push(candidate('debtEnd','Dívida financeira final',debtEnd,file.name,debtOrdered?'high':'medium','Soma das obrigações financeiras identificadas no passivo circulante e não circulante, incluindo empréstimos/financiamentos, terceiros, parcelamentos fiscais e mútuos quando existentes.',fmtMoney(debtEnd)));
 if(debtStart!=null&&debtStart>=0&&balanceDoc)c.push(candidate('debtStart','Dívida financeira inicial',debtStart,file.name,debtOrdered?'high':'medium','Saldo inicial das mesmas obrigações financeiras utilizadas na dívida final.',fmtMoney(debtStart)));
 if(interest!=null&&interest>0&&dreDoc)c.push(candidate('interestExpense','Despesas financeiras da dívida',interest,file.name,'high','Conta específica de juros/encargos da dívida localizada na DRE.',fmtMoney(interest)));
 else if(genericFinance!=null&&genericFinance>0&&dreDoc)c.push(candidate('interestExpense','Despesas financeiras da DRE',genericFinance,file.name,'high','Conta de despesas financeiras do período usada como aproximação gerencial do custo da dívida. Revise se houver valores relevantes não vinculados a empréstimos, financiamentos, parcelamentos ou mútuos.',fmtMoney(genericFinance)));
 if(accountingProfit!=null&&dreDoc){const annualProfit=accountingProfit*annualFactor;c.push(candidate('realAccountingProfitAnnual','Lucro contábil anual antes de IRPJ e CSLL',annualProfit,file.name,pretaxProfit!=null?'high':'medium',(pretaxProfit!=null?'Resultado antes de IRPJ/CSLL identificado diretamente na DRE.':'Valor aproximado a partir do lucro líquido acrescido de IRPJ e CSLL identificados.')+(dreMonths<12?` Anualizado a partir de ${dreMonths} meses.`:''),fmtMoney(annualProfit)))}
 if(consumptionTaxes>0&&dreDoc){const annualTaxes=consumptionTaxes*annualFactor,taxRate=revenueGross?100*consumptionTaxes/Math.abs(revenueGross):null;const rateText=taxRate!=null&&Number.isFinite(taxRate)?` Equivale a aproximadamente ${fmtPct(taxRate)} da receita bruta.`:'';c.push(candidate('currentConsumptionTaxAnnual','Carga atual de tributos sobre consumo',annualTaxes,file.name,taxConfidence,taxReason+rateText+(dreMonths<12?` Valor anualizado a partir de ${dreMonths} meses.`:''),fmtMoney(annualTaxes)))}
 if(ebitdaMargin!=null&&Number.isFinite(ebitdaMargin)&&dreDoc)c.push(candidate('currentOperatingMarginPct','Margem EBITDA atual',ebitdaMargin,file.name,(explicitEbitda!=null||operatingBeforeFinance!=null)?'high':'medium',explicitEbitda!=null?'EBITDA identificado diretamente e dividido pela receita líquida.':operatingBeforeFinance!=null?'Resultado antes do resultado financeiro acrescido de depreciação e amortização, dividido pela receita líquida.':'EBITDA aproximado pelo resultado operacional acrescido de depreciação e amortização, dividido pela receita líquida.',fmtPct(ebitdaMargin)));
 if(payroll)c.push(candidate('monthlyPayroll','Folha mensal estimada',dreDoc?Math.abs(payroll)/dreMonths:Math.abs(payroll),file.name,'medium',dreDoc?`Valor de pessoal dividido pelos ${dreMonths} meses cobertos pela DRE. Confirme a composição válida para o Fator R.`:'Valor de folha localizado no relatório. Confirme a periodicidade.',fmtMoney(dreDoc?Math.abs(payroll)/dreMonths:Math.abs(payroll))));
 if(tab.b2bPct!=null)c.push(candidate('b2bPct','Vendas para clientes PJ (B2B)',tab.b2bPct,file.name,'high','Calculado pelos documentos CPF/CNPJ ou identificação de clientes nas linhas do relatório.',fmtPct(tab.b2bPct)));
 if(tab.regularSuppliersPct!=null)c.push(candidate('regularSuppliersPct','Fornecedores no regime regular',tab.regularSuppliersPct,file.name,'medium','Calculado pelas linhas que identificam o regime dos fornecedores.',fmtPct(tab.regularSuppliersPct)));
 return{file:file.name,type,text,candidates:c,cnpj:importedCnpj,revenueGross:revenueGross==null?null:Math.abs(revenueGross),revenueNet:revenueNet==null?null:Math.abs(revenueNet),purchaseTotal:tab.purchaseTotal||((type==='Relatório de compras'&&costs)?Math.abs(costs):null)}
}
function buildCrossCandidates(docs,candidates){
 const revs=candidates.filter(x=>x.field==='rbt12').sort((a,b)=>(a.confidence==='high'?-1:1)),base=revs[0]?.value||(num('rbt12')>0?num('rbt12'):null);
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
function groupedImportCandidates(){return brmiImport.candidates.reduce((a,c,i)=>{c._index=i;(a[c.field]||(a[c.field]=[])).push(c);return a},{})}
function conflictGroup(arr){if(arr.length<2)return false;if(arr[0]?.field==='cnpj')return new Set(arr.map(x=>x.value)).size>1;const vals=arr.map(x=>x.value).filter(Number.isFinite),max=Math.max(...vals),min=Math.min(...vals);return max>0&&(max-min)/max>.05}
function renderImportFiles(){const el=$('importFileList');if(!el)return;el.innerHTML=brmiImport.files.map(f=>`<div class="importFile"><span class="importFileIcon">${f.ext.toUpperCase()}</span><div><strong>${f.name}</strong><small>${f.type||'Aguardando análise'}</small></div><span class="importFileStatus ${f.statusClass||''}">${f.status||'Pendente'}</span></div>`).join('')}
function renderImportCandidates(){
 const summary=$('importSummary'),empty=$('importEmpty'),groups=groupedImportCandidates(),keys=Object.keys(groups);if(!keys.length){if(summary)summary.hidden=true;if(empty)empty.hidden=false;return}if(empty)empty.hidden=true;if(summary)summary.hidden=false;if($('importSummaryCount'))$('importSummaryCount').textContent=`${brmiImport.candidates.length} sugest${brmiImport.candidates.length===1?'ão':'ões'}`;
 const root=$('importCandidateGroups');root.innerHTML=keys.map(field=>{const arr=groups[field],conflict=conflictGroup(arr);return `<div class="importGroup"><div class="importGroupHead"><strong>${arr[0].label}</strong><span class="${conflict?'conflict':''}">${conflict?'VALORES DIVERGENTES':'FONTE LOCALIZADA'}</span></div><div class="importCandidates">${arr.map(c=>`<div class="importCandidate"><div class="importCandidateMain"><strong>${c.display}</strong><small>${c.reason}</small><div class="importMeta"><span>${c.source}</span><span class="${c.confidence}">confiança ${c.confidence==='high'?'alta':c.confidence==='medium'?'média':'baixa'}</span></div></div><button type="button" data-import-index="${c._index}" ${c.applied?'disabled':''} class="${c.applied?'importApplied':''}">${c.applied?'Aplicado ✓':'Usar este valor'}</button></div>`).join('')}</div></div>`}).join('');root.querySelectorAll('[data-import-index]').forEach(b=>b.addEventListener('click',()=>applyImportCandidate(Number(b.dataset.importIndex),b)))
}
function syncImportCandidateButtons(field,activeIndex){
 document.querySelectorAll('[data-import-index]').forEach(btn=>{const idx=Number(btn.dataset.importIndex),item=brmiImport.candidates[idx];if(!item||item.field!==field)return;const active=idx===activeIndex;item.applied=active;btn.textContent=active?'Aplicado ✓':'Usar este valor';btn.classList.toggle('importApplied',active);btn.disabled=active})
}
function applyImportCandidate(i,button){
 const c=brmiImport.candidates[i],el=$(c?.field);if(!c||!el)return false;
 const explicit=!!button,currentText=String(el.value||'').trim(),currentValue=typeof parseMoneyValue==='function'?parseMoneyValue(currentText):Number(currentText||0),alreadyImported=el.dataset.importVerified==='1'||el.dataset.importSource;
 if(!explicit&&el.dataset.userEdited==='1')return false;
 if(!explicit&&currentText&&!alreadyImported&&Number.isFinite(currentValue)&&Math.abs(currentValue)>.000001&&c.field!=='cnpj')return false;
 if(explicit){delete el.dataset.userEdited}
 if(c.field==='cnpj'){el.value=typeof normalizeCnpjInput==='function'?normalizeCnpjInput(c.value):formatImportedCnpj(c.value);el.dataset.importVerified='1';el.dataset.importSource=c.source||'';if(typeof markFieldAuto==='function')markFieldAuto('cnpj','IMPORTADO');syncImportCandidateButtons(c.field,i);if(typeof lookupCnpj==='function')lookupCnpj();return true}
 if(typeof setMoneyInputValue==='function'&&el.closest?.('.money'))setMoneyInputValue(el,c.value);else el.value=Math.round(c.value*100)/100;
 el.dataset.importVerified='1';el.dataset.importSource=c.source||'Documento importado';
 if(c.field==='currentConsumptionTaxAnnual'&&$('currentConsumptionMode')){$('currentConsumptionMode').value='manual';el.readOnly=false;el.dataset.sourceNote=c.reason||'';if($('currentConsumptionTaxSource'))$('currentConsumptionTaxSource').textContent='Calculado a partir da DRE importada. '+(c.reason||'Revise a origem antes de concluir.')}
 if(c.field==='rbt12'&&$('revenueSync')?.checked&&typeof syncRevenue==='function'){syncRevenue('annual');if(typeof markFieldDerived==='function')markFieldDerived('monthlyRevenue','CALCULADO')}
 if(c.field==='monthlyRevenue'&&$('revenueSync')?.checked&&typeof syncRevenue==='function'){syncRevenue('monthly');if(typeof markFieldDerived==='function')markFieldDerived('rbt12','CALCULADO')}
 if(typeof markFieldAuto==='function')markFieldAuto(c.field,c.confidence==='low'?'REVISAR':'IMPORTADO');
 try{el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))}catch(_){}
 if(typeof financialMetrics==='function')financialMetrics();if(typeof refreshEligibilityUi==='function')refreshEligibilityUi();
 if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('import');if(typeof refreshAllFieldStates==='function')refreshAllFieldStates();syncImportCandidateButtons(c.field,i);return true
}
function applyHighConfidenceCandidates(){
 const groups=groupedImportCandidates();let applied=0,skipped=0;
 Object.values(groups).forEach(arr=>{const high=arr.filter(c=>c.confidence==='high');if(!high.length)return;if(conflictGroup(high)){skipped++;return}applyImportCandidate(high[0]._index);applied++});
 const btn=$('importApplyHigh');if(btn){btn.textContent=applied?`${applied} sugest${applied===1?'ão aplicada':'ões aplicadas'}`:'Nenhuma sugestão segura para aplicar';if(skipped)btn.title=`${skipped} grupo(s) com valores divergentes não foram aplicados automaticamente.`}
}

function autoApplyDocumentCalculations(){
 const groups=groupedImportCandidates();
 const automaticFields=new Set(['currentConsumptionTaxAnnual','currentOperatingMarginPct','realAccountingProfitAnnual','debtStart','debtEnd','interestExpense']);
 automaticFields.forEach(field=>{
  const arr=groups[field]||[];if(!arr.length||conflictGroup(arr))return;
  const ranked=[...arr].sort((a,b)=>({high:3,medium:2,low:1}[b.confidence]||0)-({high:3,medium:2,low:1}[a.confidence]||0));
  const best=ranked[0];if(!best)return;
  if(field==='interestExpense'&&best.confidence!=='high')return;
  if(['debtStart','debtEnd','realAccountingProfitAnnual'].includes(field)&&best.confidence==='low')return;
  applyImportCandidate(best._index);
 });
 if(typeof financialMetrics==='function')financialMetrics();
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
 el.dataset.importVerified='1';el.dataset.importSource=best.source||'DRE importada';
 brmiImport.verifiedAccountingProfit={value:best.value,source:best.source||'DRE importada',confidence:best.confidence};
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
 const list=[...files];if(!list.length)return;brmiImport.files=list.map(f=>({name:f.name,ext:extOf(f.name),status:'Na fila'}));brmiImport.docs=[];brmiImport.candidates=[];renderImportFiles();const progress=$('importProgress');if(progress)progress.hidden=false;
 for(let i=0;i<list.length;i++){const f=list[i],row=brmiImport.files[i];row.status='Analisando';row.statusClass='';renderImportFiles();if($('importProgressTitle'))$('importProgressTitle').textContent=`Analisando ${f.name}`;if($('importProgressText'))$('importProgressText').textContent=`Arquivo ${i+1} de ${list.length}. Procurando faturamento, clientes, compras, caixa, BP, dívida, juros, folha e margem.`;try{const parsed=await readImportFile(f),doc=analyseImportDoc(f,parsed);row.type=doc.type;row.status=doc.candidates.length||doc.purchaseTotal?'Lido':'Sem indicador';row.statusClass=doc.candidates.length||doc.purchaseTotal?'ok':'warn';brmiImport.docs.push(doc);brmiImport.candidates.push(...doc.candidates)}catch(e){row.status='Não lido';row.statusClass='bad';row.type=e.message}renderImportFiles();await new Promise(r=>setTimeout(r,220))}
 buildCrossCandidates(brmiImport.docs,brmiImport.candidates);
 const dreOnly=brmiImport.docs.find(d=>(d.type==='DRE'||d.type==='Balanço + DRE')&&d.revenueNet>0&&!d.revenueGross);
 brmiImport.revenueQuality=dreOnly?{status:'net-only',net:dreOnly.revenueNet,source:dreOnly.file}:null;
 writeVerifiedAccountingProfit();if(progress)progress.hidden=true;renderImportCandidates();autoApplyDocumentCalculations();writeVerifiedAccountingProfit();updateEconomicMetricAvailability();await autoLookupImportedCompany(brmiImport.docs);autoApplyDocumentCalculations();writeVerifiedAccountingProfit();updateEconomicMetricAvailability();if(typeof calculate==='function')calculate()
}
function clearImport(){brmiImport.files=[];brmiImport.docs=[];brmiImport.candidates=[];renderImportFiles();if($('importSummary'))$('importSummary').hidden=true;if($('importEmpty'))$('importEmpty').hidden=true;const inp=$('importFiles');if(inp)inp.value=''}
function initDocumentImport(){const setup=$('setupMount');if(!setup||$('importPanel'))return;
 ['rbt12','realAccountingProfitAnnual','currentConsumptionTaxAnnual','currentOperatingMarginPct','debtStart','debtEnd','interestExpense','cashAndEquivalents','liquidInvestments','currentAssets','currentLiabilities'].forEach(id=>{const el=$(id);if(!el||el.dataset.importProvenanceBound)return;el.dataset.importProvenanceBound='1';const userEdit=e=>{if(e.isTrusted){el.dataset.userEdited='1';delete el.dataset.importVerified;delete el.dataset.importSource}};el.addEventListener('input',userEdit);el.addEventListener('change',userEdit)});
 setup.insertAdjacentHTML('beforeend',importMarkup());const input=$('importFiles'),drop=$('importDrop'),choose=$('importChooseBtn');choose?.addEventListener('click',e=>{e.stopPropagation();input?.click()});drop?.addEventListener('click',e=>{if(e.target!==choose)input?.click()});drop?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input?.click()}});input?.addEventListener('change',()=>processImportFiles(input.files));['dragenter','dragover'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop?.addEventListener('drop',e=>processImportFiles(e.dataTransfer.files));$('importApplyHigh')?.addEventListener('click',applyHighConfidenceCandidates);$('importClear')?.addEventListener('click',clearImport)}
