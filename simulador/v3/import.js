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
function comparativeOrder(text){
 const lines=String(text||'').split(/\r?\n/).slice(0,45);
 for(const line of lines){
  const years=(line.match(/20\d{2}/g)||[]).map(Number);
  const unique=[...new Set(years)];
  if(unique.length>=2){if(unique[0]>unique[1])return'latest-first';if(unique[0]<unique[1])return'latest-last'}
 }
 return null
}
function latestLineValues(text,labels,exclude=[]){
 const order=comparativeOrder(text),lines=String(text||'').split(/\r?\n/);
 for(const line of lines){
  const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;
  const nums=importNumberTokens(line);if(!nums.length)continue;
  if(nums.length===1)return{latest:nums[0],prior:null,ordered:false};
  const pair=nums.slice(-2);
  return order==='latest-last'?{latest:pair[1],prior:pair[0],ordered:true}:{latest:pair[0],prior:pair[1],ordered:order==='latest-first'}
 }
 return{latest:null,prior:null,ordered:false}
}
function latestLineValue(text,labels,exclude=[]){return latestLineValues(text,labels,exclude).latest}
function firstLatestLineValue(text,labelGroups,exclude=[]){for(const labels of labelGroups){const v=latestLineValue(text,labels,exclude);if(v!=null)return v}return null}
function comparativeCategoryTotal(text,labelGroups,exclude=[]){
 const order=comparativeOrder(text),lines=String(text||'').split(/\r?\n/);
 for(const labels of labelGroups){
  let latest=0,prior=0,count=0,priorCount=0;
  for(const line of lines){
   const n=normImport(line);if(!labels.some(x=>n.includes(x))||exclude.some(x=>n.includes(x)))continue;
   const nums=importNumberTokens(line);if(!nums.length)continue;
   const pair=nums.length>1?nums.slice(-2):[nums[0]];
   let a=pair[0],b=pair.length>1?pair[1]:null;
   if(order==='latest-last'&&b!=null)[a,b]=[b,a];
   latest+=Math.abs(a);count++;
   if(b!=null){prior+=Math.abs(b);priorCount++}
  }
  if(count)return{end:latest,start:priorCount===count?prior:null,ordered:order!=null,count}
 }
 return{end:0,start:null,ordered:false,count:0}
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
 const text=parsed.text,type=detectDoc(text,parsed.rows),tab=tabularMetrics(parsed.rows),c=[],sections=importStatementSections(text),balanceDoc=type==='Balanço'||type==='Balanço + DRE',dreDoc=type==='DRE'||type==='Balanço + DRE',bpText=balanceDoc?sections.balance:text,dreText=dreDoc?sections.dre:text,importedCnpj=detectImportedCnpj(text,type);
 const revenueGross=firstLatestLineValue(dreText,[['receita bruta','receita operacional bruta','faturamento bruto','faturamento total'],['servicos prestados','vendas de mercadorias','receita de vendas']]);
 const revenueNet=firstLatestLineValue(dreText,[['receita liquida','receita operacional liquida','receita liquida de vendas']]);
 const revenue=revenueGross||revenueNet||firstLatestLineValue(dreText,[['receitas operacionais']]);
 const deductions=Math.abs(firstLatestLineValue(dreText,[['deducoes da receita bruta','deducoes sobre vendas','deducoes da receita'],['impostos, devolucoes e abatimentos']])||0);
 const costs=firstLatestLineValue(dreText,[['cmv','cpv','csp','custo das mercadorias','custo dos produtos','custo dos servicos'],['custos das atividades empresariais'],['custos gerais','custos operacionais']]);
 const explicitCash=firstLatestLineValue(bpText,[['caixa e equivalentes'],['disponibilidades'],['caixa bancos']]),cashBox=firstLatestLineValue(bpText,[['caixa geral'],['caixa']]),banks=firstLatestLineValue(bpText,[['bancos conta movimento'],['bancos c/ movimento']]),cash=explicitCash!=null?explicitCash:(((cashBox||0)+(banks||0))||null);
 const investments=firstLatestLineValue(bpText,[['aplicacoes financeiras de liquidez imediata'],['aplicacoes de liquidez imediata'],['equivalentes de caixa'],['aplicacoes financeiras']]);
 const currentAssets=latestLineValue(bpText,['ativo circulante'],['total do ativo','nao circulante']);
 const currentLiabilities=latestLineValue(bpText,['passivo circulante'],['nao circulante']);
 const pretaxProfit=firstLatestLineValue(dreText,[['lucro antes do irpj','lucro antes do imposto de renda','resultado antes do irpj','resultado antes dos tributos sobre o lucro','resultado antes dos impostos sobre o lucro'],['lucro antes dos tributos','resultado antes dos tributos']]);
 const netProfit=firstLatestLineValue(dreText,[['lucro liquido','resultado liquido','resultado do exercicio','resultado exercicio']]);
 const irpjExpense=Math.abs(firstLatestLineValue(dreText,[['imposto de renda corrente','irpj corrente'],['imposto de renda']])||0);
 const csllExpense=Math.abs(firstLatestLineValue(dreText,[['contribuicao social corrente','csll corrente'],['contribuicao social sobre o lucro','csll']])||0);
 const accountingProfit=pretaxProfit!=null?pretaxProfit:(netProfit!=null&&(irpjExpense>0||csllExpense>0)?netProfit+irpjExpense+csllExpense:null);
 const payrollCosts=latestLineValue(dreText,['custos com pessoal']),payrollExpenses=latestLineValue(dreText,['despesas com pessoal']),payroll=(payrollCosts||0)+(payrollExpenses||0)||latestLineValue(dreText,['folha de pagamento','salarios e encargos','pessoal e encargos']);
 const loans=comparativeCategoryTotal(bpText,[['emprestimos e financiamentos'],['emprestimos bancarios','financiamentos bancarios'],['emprestimos','financiamentos']],['receber','concedidos']);
 const taxDebt=comparativeCategoryTotal(bpText,[['parcelamentos fiscais','parcelamentos tributarios'],['parcelamento fiscal','parcelamento tributario'],['parcelamento de tributos','parcelamento de impostos']],['a recuperar','creditos']);
 const mutuals=comparativeCategoryTotal(bpText,[['contratos de mutuo','mutuos'],['emprestimos de socios','emprestimos de partes relacionadas']],['a receber']);
 const debtParts=[loans,taxDebt,mutuals].filter(x=>x.end>0),debtEnd=debtParts.reduce((s,x)=>s+x.end,0),debtStart=debtParts.length&&debtParts.every(x=>x.start!=null)?debtParts.reduce((s,x)=>s+x.start,0):null,debtOrdered=debtParts.length>0&&debtParts.every(x=>x.ordered);
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
 if(revenue>0)c.push(candidate('rbt12','Faturamento em 12 meses (RBT12)',Math.abs(revenue),file.name,dreDoc||type==='Relatório de vendas'?'high':'medium',`Valor localizado em ${type}.`,fmtMoney(Math.abs(revenue))));
 if(cash!=null&&balanceDoc)c.push(candidate('cashAndEquivalents','Caixa e equivalentes',Math.abs(cash),file.name,'high','Caixa/disponibilidades localizado no balanço.',fmtMoney(Math.abs(cash))));
 if(investments!=null&&Math.abs(investments)>0&&balanceDoc)c.push(candidate('liquidInvestments','Aplicações de liquidez imediata',Math.abs(investments),file.name,'medium','Aplicações financeiras localizadas. Confirme se possuem liquidez imediata.',fmtMoney(Math.abs(investments))));
 if(currentAssets!=null&&Math.abs(currentAssets)>0&&balanceDoc)c.push(candidate('currentAssets','Ativo circulante',Math.abs(currentAssets),file.name,'high','Total do ativo circulante localizado no balanço.',fmtMoney(Math.abs(currentAssets))));
 if(currentLiabilities!=null&&Math.abs(currentLiabilities)>0&&balanceDoc)c.push(candidate('currentLiabilities','Passivo circulante',Math.abs(currentLiabilities),file.name,'high','Total do passivo circulante localizado no balanço.',fmtMoney(Math.abs(currentLiabilities))));
 if(debtEnd>0&&balanceDoc)c.push(candidate('debtEnd','Dívida financeira final',debtEnd,file.name,debtOrdered?'high':'medium','Soma de empréstimos e financiamentos, parcelamentos fiscais/tributários e mútuos de curto e longo prazo. Confirme a data-base.',fmtMoney(debtEnd)));
 if(debtStart!=null&&debtStart>=0&&balanceDoc)c.push(candidate('debtStart','Dívida financeira inicial',debtStart,file.name,debtOrdered?'high':'medium','Saldo comparativo anterior das mesmas obrigações usadas na dívida financeira final.',fmtMoney(debtStart)));
 if(interest!=null&&interest>0&&dreDoc)c.push(candidate('interestExpense','Despesas financeiras da dívida',interest,file.name,'high','Conta específica de juros/encargos da dívida localizada na DRE.',fmtMoney(interest)));
 else if(genericFinance!=null&&genericFinance>0&&dreDoc)c.push(candidate('interestExpense','Despesas financeiras totais',genericFinance,file.name,'low','Subtotal genérico da DRE. Não é aplicado automaticamente ao custo da dívida porque pode incluir tarifas, IOF, variação cambial, multas, descontos financeiros e outros itens não vinculados ao saldo médio das dívidas.',fmtMoney(genericFinance)));
 if(accountingProfit!=null&&dreDoc)c.push(candidate('realAccountingProfitAnnual','Lucro contábil antes de IRPJ e CSLL',accountingProfit,file.name,pretaxProfit!=null?'high':'medium',pretaxProfit!=null?'Resultado antes de IRPJ/CSLL identificado diretamente na DRE.':'Valor aproximado a partir do lucro líquido acrescido de IRPJ e CSLL identificados.',fmtMoney(accountingProfit)));
 if(consumptionTaxes>0&&dreDoc){const taxRate=revenueGross?100*consumptionTaxes/Math.abs(revenueGross):null;const rateText=taxRate!=null&&Number.isFinite(taxRate)?` Equivale a aproximadamente ${fmtPct(taxRate)} da receita bruta.`:'';c.push(candidate('currentConsumptionTaxAnnual','Carga atual de tributos sobre consumo',consumptionTaxes,file.name,taxConfidence,taxReason+rateText,fmtMoney(consumptionTaxes)))}
 if(ebitdaMargin!=null&&Number.isFinite(ebitdaMargin)&&dreDoc)c.push(candidate('currentOperatingMarginPct','Margem EBITDA atual',ebitdaMargin,file.name,(explicitEbitda!=null||operatingBeforeFinance!=null)?'high':'medium',explicitEbitda!=null?'EBITDA identificado diretamente e dividido pela receita líquida.':operatingBeforeFinance!=null?'Resultado antes do resultado financeiro acrescido de depreciação e amortização, dividido pela receita líquida.':'EBITDA aproximado pelo resultado operacional acrescido de depreciação e amortização, dividido pela receita líquida.',fmtPct(ebitdaMargin)));
 if(payroll)c.push(candidate('monthlyPayroll','Folha mensal estimada',dreDoc?Math.abs(payroll)/12:Math.abs(payroll),file.name,'medium',dreDoc?'Valor anual de pessoal dividido por 12. Confirme a composição válida para o Fator R.':'Valor de folha localizado no relatório. Confirme a periodicidade.',fmtMoney(dreDoc?Math.abs(payroll)/12:Math.abs(payroll))));
 if(tab.b2bPct!=null)c.push(candidate('b2bPct','Vendas para clientes PJ (B2B)',tab.b2bPct,file.name,'high','Calculado pelos documentos CPF/CNPJ ou identificação de clientes nas linhas do relatório.',fmtPct(tab.b2bPct)));
 if(tab.regularSuppliersPct!=null)c.push(candidate('regularSuppliersPct','Fornecedores no regime regular',tab.regularSuppliersPct,file.name,'medium','Calculado pelas linhas que identificam o regime dos fornecedores.',fmtPct(tab.regularSuppliersPct)));
 return{file:file.name,type,text,candidates:c,cnpj:importedCnpj,purchaseTotal:tab.purchaseTotal||((type==='Relatório de compras'&&costs)?Math.abs(costs):null)}
}
function buildCrossCandidates(docs,candidates){const revs=candidates.filter(x=>x.field==='rbt12').sort((a,b)=>(a.confidence==='high'?-1:1));const base=revs[0]?.value;if(base>0)docs.forEach(d=>{if(d.purchaseTotal>0){const p=100*d.purchaseTotal/base;if(p>=0&&p<=300)candidates.push(candidate('purchasesPct','Compras/insumos sobre o faturamento',p,d.file,'medium','Compras/custos encontrados divididos pelo faturamento importado. CMV/CPV/CSP pode não ser igual a compras creditáveis.',fmtPct(p)))}});return candidates}
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
 const c=brmiImport.candidates[i],el=$(c?.field);if(!c||!el)return;const targetButton=button||document.querySelector(`[data-import-index="${i}"]`);
 if(c.field==='cnpj'){el.value=typeof normalizeCnpjInput==='function'?normalizeCnpjInput(c.value):formatImportedCnpj(c.value);if(typeof markFieldAuto==='function')markFieldAuto('cnpj','IMPORTADO');syncImportCandidateButtons(c.field,i);if(typeof lookupCnpj==='function')lookupCnpj();return}
 el.value=Math.round(c.value*100)/100;
 if(c.field==='currentConsumptionTaxAnnual'&&$('currentConsumptionMode')){$('currentConsumptionMode').value='manual';el.readOnly=false;el.dataset.sourceNote=c.reason||'';if($('currentConsumptionTaxSource'))$('currentConsumptionTaxSource').textContent='Calculado a partir da DRE importada. '+(c.reason||'Revise a origem antes de concluir.')}
 if(c.field==='rbt12'&&$('revenueSync')?.checked&&typeof syncRevenue==='function'){syncRevenue('annual');if(typeof markFieldDerived==='function')markFieldDerived('monthlyRevenue','CALCULADO')}
 if(c.field==='monthlyRevenue'&&$('revenueSync')?.checked&&typeof syncRevenue==='function'){syncRevenue('monthly');if(typeof markFieldDerived==='function')markFieldDerived('rbt12','CALCULADO')}
 if(typeof markFieldAuto==='function')markFieldAuto(c.field,c.confidence==='low'?'REVISAR':'IMPORTADO');
 if(typeof financialMetrics==='function')financialMetrics();if(typeof refreshEligibilityUi==='function')refreshEligibilityUi();
 if(typeof markDiagnosisDirty==='function')markDiagnosisDirty('import');if(typeof refreshAllFieldStates==='function')refreshAllFieldStates();syncImportCandidateButtons(c.field,i)
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
async function autoLookupImportedCompany(docs){const ids=[...new Set((docs||[]).map(d=>d.cnpj).filter(Boolean))];if(ids.length!==1)return;const raw=ids[0],el=$('cnpj'),status=$('lookupStatus');if(!el)return;const current=importedCnpjDigits(el.value);if(current&&current!==raw){if(status){status.className='status';status.textContent=`O documento contém o CNPJ ${formatImportedCnpj(raw)}, diferente do CNPJ já informado. Revise antes de aplicar.`}return}el.value=typeof normalizeCnpjInput==='function'?normalizeCnpjInput(raw):formatImportedCnpj(raw);if(typeof markFieldAuto==='function')markFieldAuto('cnpj','IMPORTADO');if(brmiImport.lastLookupCnpj===raw)return;brmiImport.lastLookupCnpj=raw;if(typeof lookupCnpj==='function')await lookupCnpj()}
async function processImportFiles(files){
 const list=[...files];if(!list.length)return;brmiImport.files=list.map(f=>({name:f.name,ext:extOf(f.name),status:'Na fila'}));brmiImport.docs=[];brmiImport.candidates=[];renderImportFiles();const progress=$('importProgress');if(progress)progress.hidden=false;
 for(let i=0;i<list.length;i++){const f=list[i],row=brmiImport.files[i];row.status='Analisando';row.statusClass='';renderImportFiles();if($('importProgressTitle'))$('importProgressTitle').textContent=`Analisando ${f.name}`;if($('importProgressText'))$('importProgressText').textContent=`Arquivo ${i+1} de ${list.length}. Procurando faturamento, clientes, compras, caixa, BP, dívida, juros, folha e margem.`;try{const parsed=await readImportFile(f),doc=analyseImportDoc(f,parsed);row.type=doc.type;row.status=doc.candidates.length||doc.purchaseTotal?'Lido':'Sem indicador';row.statusClass=doc.candidates.length||doc.purchaseTotal?'ok':'warn';brmiImport.docs.push(doc);brmiImport.candidates.push(...doc.candidates)}catch(e){row.status='Não lido';row.statusClass='bad';row.type=e.message}renderImportFiles();await new Promise(r=>setTimeout(r,220))}
 buildCrossCandidates(brmiImport.docs,brmiImport.candidates);if(progress)progress.hidden=true;renderImportCandidates();autoApplyDocumentCalculations();await autoLookupImportedCompany(brmiImport.docs)
}
function clearImport(){brmiImport.files=[];brmiImport.docs=[];brmiImport.candidates=[];renderImportFiles();if($('importSummary'))$('importSummary').hidden=true;if($('importEmpty'))$('importEmpty').hidden=true;const inp=$('importFiles');if(inp)inp.value=''}
function initDocumentImport(){const setup=$('setupMount');if(!setup||$('importPanel'))return;setup.insertAdjacentHTML('beforeend',importMarkup());const input=$('importFiles'),drop=$('importDrop'),choose=$('importChooseBtn');choose?.addEventListener('click',e=>{e.stopPropagation();input?.click()});drop?.addEventListener('click',e=>{if(e.target!==choose)input?.click()});drop?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input?.click()}});input?.addEventListener('change',()=>processImportFiles(input.files));['dragenter','dragover'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop?.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop?.addEventListener('drop',e=>processImportFiles(e.dataTransfer.files));$('importApplyHigh')?.addEventListener('click',applyHighConfidenceCandidates);$('importClear')?.addEventListener('click',clearImport)}
