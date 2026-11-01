import {PARAMETROS,PERFIS,VERSAO,DATA_BASE} from './premissas-documentais.js';
export const CAMPOS=[['receita','Receita líquida','fluxo'],['ebit','Resultado antes do financeiro e IR/CSLL (EBIT)','fluxo'],['lucro','Lucro líquido','fluxo'],['depreciacao','Depreciação e amortização incluídas nos gastos','fluxo'],['juros','Despesas financeiras (não amortizações)','fluxo'],['tributos','Tributos sobre vendas, sem devoluções','fluxo'],['ativo','Ativo total','saldo'],['ac','Ativo circulante','saldo'],['pc','Passivo circulante','saldo'],['pnc','Passivo não circulante','saldo'],['pl','Patrimônio líquido','saldo'],['caixa','Caixa e equivalentes','saldo'],['divida','Dívida financeira bruta','saldo'],['clientes','Clientes','saldo'],['estoques','Estoques','saldo'],['fornecedores','Fornecedores operacionais','saldo']];
export function validarPeriodo(p){
 if(!Number.isInteger(p.ano)||p.ano<2000||p.ano>2100)throw Error('Confirme o ano de cada período utilizado.');
 if(!Number.isInteger(p.meses)||p.meses<1||p.meses>12)throw Error('Confirme os meses de cada período utilizado.');
 for(const [k] of CAMPOS){const v=p[k];if(v!==null&&v!==undefined&&(!Number.isFinite(v)||Math.abs(v)>1e14))throw Error('Valor inválido em '+k);if(!['ebit','lucro','pl'].includes(k)&&v!=null&&v<0)throw Error('Informe '+k+' como magnitude positiva.');}
 if([p.ativo,p.pc,p.pnc,p.pl].every(Number.isFinite)&&Math.abs(p.ativo-p.pc-p.pnc-p.pl)>Math.max(10,p.ativo*.01))throw Error('Balanço não conciliado em '+p.ano+': ativo difere de passivos + PL em mais de 1%. Revise os valores.');
 if(p.ac!=null&&p.ativo!=null&&p.ac>p.ativo+1)throw Error('Ativo circulante superior ao ativo total.');
 if(p.ebit!=null&&p.receita!=null&&p.ebit>p.receita)throw Error('EBIT superior à receita: segregue ganhos extraordinários antes de simular.');
 return p;
}
export function anualizar(p,aceite=false){validarPeriodo(p);if(p.meses<12&&!aceite)throw Error('Confirme a anualização linear do período parcial.');const out={...p};for(const [k,,tipo] of CAMPOS)if(tipo==='fluxo'&&Number.isFinite(p[k]))out[k]=p[k]*12/p.meses;return out;}
export function indicadores(p){const ratio=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&b>0?a/b:null;return {ano:p.ano,meses:p.meses,receita:p.receita,margem:ratio(p.ebit,p.receita),liquidez:ratio(p.ac,p.pc),alavancagem:ratio(p.divida,p.pl),ncg:[p.clientes,p.estoques,p.fornecedores].every(Number.isFinite)?p.clientes+p.estoques-p.fornecedores:null};}
export function simularCenario(base,c){
 for(const [k,,min,max] of PARAMETROS)if(!Number.isFinite(c[k])||c[k]<min||c[k]>max)throw Error('Premissa fora da faixa permitida: '+k);
 const R=base.receita,E=base.ebit;if(!(R>0)||!Number.isFinite(E))throw Error('Receita líquida e EBIT revisados são necessários. Não utilize lucro líquido como EBIT.');
 const gastos=R-E; // gastos operacionais líquidos, inclui D&A se não segregada
 const gastosCaixa=base.depreciacao==null?null:gastos-base.depreciacao;
 if(gastosCaixa!==null&&gastosCaixa<0)throw Error('Depreciação supera os gastos operacionais líquidos.');
 const custoElegivel=(gastosCaixa??gastos)*c.elegivel/100;
 const desoneracao=custoElegivel*(c.embutido/100)/(1+c.embutido/100);
 const taxa=(c.cbs+c.ibs)/100*(1-c.redutor/100);
 const tributosAtuais=base.tributos??R*c.atual/100;
 const faturamentoComparavel=R+tributosAtuais;
 const diferencaPreco=R*(1+taxa)-faturamentoComparavel;
 const faturamentoNovo=(faturamentoComparavel+diferencaPreco*c.repasse/100)*(1+c.volume/100);
 const receitaNova=faturamentoNovo/(1+taxa);
 const custosNovos=(gastos-desoneracao)*(1+(c.volume/100)*(c.variavel/100));
 const adaptacao=R*c.adaptacao/100;
 const ebitNovo=receitaNova-custosNovos-adaptacao;
 const delta=ebitNovo-E;
 const giroAdicional=R/365*c.dias;
 const ebitdaBase=base.depreciacao==null?null:E+base.depreciacao;
 const ebitdaNovo=ebitdaBase==null?null:ebitdaBase+delta;
 const resultado={nome:c.nome,receitaNova,ebit:ebitNovo,margem:ebitNovo/receitaNova,delta,deltaMargem:(ebitNovo/receitaNova-E/R)*100,desoneracao,adaptacao,giroAdicional,pressaoCaixa:delta-giroAdicional,tributosAtuais,taxa,repasseNecessario:diferencaPreco/faturamentoComparavel*100,ebitdaBase,ebitdaNovo,coberturaJuros:base.juros>0&&ebitdaNovo!==null?ebitdaNovo/base.juros:null,memoria:{gastos,custoElegivel,faturamentoComparavel,diferencaPreco,faturamentoNovo,custosNovos}};
 for(const [k,v] of Object.entries(resultado))if(typeof v==='number'&&!Number.isFinite(v))throw Error('Resultado numérico inválido: '+k);
 return resultado;
}
export function analisar({periodos,baseIndex,setor,cenarios,anualizacao=false,empresa='',regime='desconhecido'}){
 const usados=periodos.filter(p=>CAMPOS.some(([k])=>p[k]!=null));usados.forEach(validarPeriodo);
 if(new Set(usados.map(p=>p.ano+':'+p.meses)).size!==usados.length)throw Error('Períodos duplicados. Consolide os documentos na mesma coluna.');
 const original=periodos[baseIndex];if(!original)throw Error('Selecione o período-base.');
 const base=anualizar(original,anualizacao),resultados=cenarios.map(c=>simularCenario(base,c));
 const alertas=['Faixa de cenários, sem probabilidade associada ou intervalo de confiança estatístico. Premissas setoriais propostas pelo modelo, ainda sem calibração empírica empresarial.','Comparação estática com o regime integral de 2033, em moeda do período-base. Não é previsão de faturamento nem cronograma tributário de 2027 a 2032.','Sem DFC, CAPEX e cronograma de amortizações: não se calcula ICSD nem se conclui pela aprovação do crédito. A pressão de caixa é incremental, antes de IR/CSLL, investimentos, juros adicionais e serviço da dívida.','Desoneração dos custos representa somente tributos antigos irrecuperáveis estimados. Créditos de IBS/CBS não são somados novamente ao lucro.','Hipótese de recuperação integral dos novos créditos elegíveis; não há apuração fiscal ou saldo de créditos. Dias de giro constituem estresse agregado, não prazo legal de ressarcimento.'];
 if(usados.filter(p=>p.meses===12).length<3)alertas.push('Histórico inferior a três exercícios completos.');
 if(!usados.some(p=>p.meses<12))alertas.push('Balancete recente não informado ou não segregado.');
 if(original.meses<12)alertas.push('Base parcial anualizada linearmente uma única vez; não ajustada à sazonalidade.');
 if(base.tributos==null)alertas.push('Tributos atuais sobre vendas não identificados: estimados em faixa. Não são obtidos pela diferença entre receita bruta e líquida.');
 if(base.depreciacao==null)alertas.push('D&A ausente: potencial de desoneração aplicado a gastos líquidos que podem incluir itens não monetários. EBITDA e cobertura de juros indisponíveis.');
 if(regime!=='regular')alertas.push('Regime atual não regular ou desconhecido: teste contrafactual de exposição ao regime regular, sem apuração do Simples ou de regime específico.');
 alertas.push((PERFIS[setor]||PERFIS.geral).nota);
 const ultima=usados.slice().sort((a,b)=>b.ano-a.ano||b.meses-a.meses)[0];
 const tendencia=usados.filter(p=>p.meses===12).sort((a,b)=>a.ano-b.ano).map(indicadores);
 const pior=Math.min(...resultados.map(x=>x.ebit)),melhor=Math.max(...resultados.map(x=>x.ebit));
 const conclusao=base.ebit<=0?'A base já apresenta resultado operacional não positivo. A reforma pode agravar ou aliviar uma fragilidade preexistente; não é sua causa exclusiva.':pior<=0?'Ao menos um cenário consome integralmente a folga operacional. Há vulnerabilidade relevante às premissas testadas.':'O resultado operacional permanece positivo nos cenários testados. Isso não comprova cobertura do serviço da dívida.';
 return {versao:VERSAO,dataBaseLegal:DATA_BASE,empresa,setor,regime,base,baseOriginal:original,periodos:usados,cenarios,resultados,tendencia,balancoRecente:ultima?indicadores(ultima):null,faixa:{min:pior,max:melhor},sustentacao:'Limitada: cenários exploratórios com premissas não calibradas',conclusao,alertas};
}
