// Reutiliza o leitor e os classificadores do Simulador v3.2; não chama o fluxo que anualiza ou mistura arquivos.
export function extrairPeriodo(parsed,leitor=globalThis){
 const text=parsed.text||'',tipo=leitor.detectDoc(text,parsed.rows),sections=leitor.importStatementSections(text),trial=leitor.trialBalanceMetrics(parsed.rows);
 const valores={},origens={};
 const put=(k,v,nota)=>{if(Number.isFinite(v)){valores[k]=v;origens[k]=nota;}};
 const ler=(k,labels,{saldo=false,abs=false,exclude=[]}={})=>{const t=saldo?sections.balance:sections.dre;const v=leitor.firstSignedLatestLineValue(t,labels,exclude);if(v!==null)put(k,abs?Math.abs(v):v,'Linha identificada: '+labels.flat().join(' / ')+'. Última coluna temporal reconhecida; conferir no documento.');};
 if(!trial){
  ler('receita',[['receita liquida','receita operacional liquida','vendas liquidas']]);
  ler('ebit',[['resultado antes do resultado financeiro','lucro operacional antes do resultado financeiro'],['ebit']],{exclude:['ebitda']});
  ler('lucro',[['lucro liquido','prejuizo liquido','resultado do exercicio']]);
  ler('depreciacao',[['depreciacao e amortizacao','depreciacoes e amortizacoes']],{abs:true});
  ler('juros',[['despesas financeiras','encargos financeiros']],{abs:true});
  // Somente linha tributária específica; deduções incluem devoluções e não são aceitas como imposto.
  ler('tributos',[['tributos sobre vendas','impostos sobre vendas']],{abs:true});
  for(const [k,labels,exclude] of [['ativo',[['ativo total','total do ativo']],[]],['ac',[['ativo circulante']],['nao circulante']],['pc',[['passivo circulante']],['nao circulante']],['pnc',[['passivo nao circulante','exigivel a longo prazo']],[]],['pl',[['patrimonio liquido']],[]],['caixa',[['caixa e equivalentes','disponibilidades']],[]],['clientes',[['clientes','duplicatas a receber']],[]],['estoques',[['estoques']],[]],['fornecedores',[['fornecedores']],[]]])ler(k,labels,{saldo:true,exclude,abs:k!=='pl'});
  if(valores.ebit==null){const ebitda=leitor.firstSignedLatestLineValue(sections.dre,[['ebitda'],['lajida']]);if(ebitda!==null&&valores.depreciacao!=null)put('ebit',ebitda-valores.depreciacao,'Derivado: EBITDA explícito menos D&A explícita.');}
  // Dívida somente se o leitor reconhecer saldos, sem converter todo passivo em financiamento.
  const debt=leitor.financialDebtBalances(sections.balance);if(debt&&debt.end>0)put('divida',debt.end,'Dívida identificada pelo classificador do importador; conferir composição.');
 }else{
  // Balancete: movimentos de receita bruta não são convertidos em receita líquida sem deduções segregadas.
  for(const [k,key] of [['caixa','cash'],['clientes','receivables'],['estoques','inventory'],['fornecedores','suppliers'],['divida','debt']])if(trial[key]?.closing!=null)put(k,trial[key].closing,'Saldo final do balancete pelo leitor existente; não anualizado.');
  if(trial.financeExpense?.value!=null)put('juros',Math.abs(trial.financeExpense.value),'Movimentação de despesa financeira no período, não anualizada.');
  if(trial.depreciationExpense?.value!=null)put('depreciacao',Math.abs(trial.depreciationExpense.value),'Movimentação de D&A no período.');
  if(trial.salesTaxes?.value!=null)put('tributos',Math.abs(trial.salesTaxes.value),'Movimentação de tributos sobre vendas.');
 }
 const periodo=leitor.detectImportPeriod(text),head=text.split('\n').slice(0,45).join('\n');
 const anos=[...new Set((head.match(/\b20\d{2}\b/g)||[]).map(Number))];
 return {cnpj:leitor.detectImportedCnpj(text,tipo),valores,origens,tipo:trial?'Balancete':tipo,meses:periodo.months,ano:anos.length?Math.max(...anos):null,extraction:parsed.extraction||'text',avisos:[...(trial?['Fluxos do balancete podem conter encerramentos. Receita líquida e EBIT exigem revisão ou complemento manual.']:[]),...(anos.length>1?['Documento com mais de um ano: confira a coluna extraída. A importação preenche um período por vez.']:[]),...(/milhares|em mil\b|r\$\s*mil/i.test(head)?['Documento em milhares: selecione escala 1.000 antes de importar.']:[])]};
}
