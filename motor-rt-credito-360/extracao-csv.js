/**
 * Importação local de demonstrativos CSV em formato padronizado.
 * NÃO envia documentos a serviços externos. PDF/XLSX exigem processador dedicado.
 * Colunas: demonstracao,exercicio,conta,valor,unidade,pagina_origem
 */
const TIPOS=new Set(["balanco_patrimonial","dre","dfc","dmpl","balancete"]);
function linhasCSV(texto){
 const linhas=[];let atual=[],campo="",aspas=false;
 const s=String(texto??"").replace(/^\uFEFF/,"");
 for(let i=0;i<s.length;i++){
  const c=s[i];
  if(c==='"'){if(aspas&&s[i+1]==='"'){campo+='"';i++;}else aspas=!aspas;}
  else if(c===","&&!aspas){atual.push(campo);campo="";}
  else if((c==="\n"||c==="\r")&&!aspas){
   if(c==="\r"&&s[i+1]==="\n")i++;
   atual.push(campo);if(atual.some(v=>v.trim()))linhas.push(atual);
   atual=[];campo="";
  }else campo+=c;
 }
 if(aspas)throw new Error("CSV com aspas não encerradas");
 atual.push(campo);if(atual.some(v=>v.trim()))linhas.push(atual);
 return linhas;
}
export function extrairCSVContabil(texto,{maxLinhas=10000}={}){
 if(typeof texto!=="string"||texto.length>5_000_000)throw new Error("Arquivo CSV inválido ou excessivo");
 const linhas=linhasCSV(texto);
 if(linhas.length<2)throw new Error("CSV sem registros");
 if(linhas.length-1>maxLinhas)throw new Error("CSV excede limite de linhas");
 const cabecalho=linhas.shift().map(s=>s.trim().toLowerCase());
 const obrigatorias=["demonstracao","exercicio","conta","valor"];
 if(new Set(cabecalho).size!==cabecalho.length||obrigatorias.some(c=>!cabecalho.includes(c)))
  throw new Error("Cabeçalho CSV inválido");
 const erros=[],registros=[];
 for(const [i,linha] of linhas.entries()){
  if(linha.length!==cabecalho.length){erros.push("Linha "+(i+2)+": número de colunas inválido");continue;}
  const item=Object.fromEntries(cabecalho.map((k,j)=>[k,linha[j].trim()]));
  const ano=Number(item.exercicio),valor=Number(item.valor);
  if(!TIPOS.has(item.demonstracao)||!Number.isInteger(ano)||ano<1990||ano>2100||
     !item.conta||!item.valor||!Number.isFinite(valor)){
   erros.push("Linha "+(i+2)+": dados contábeis inválidos");continue;
  }
  registros.push({demonstracao:item.demonstracao,exercicio:ano,conta:item.conta,
   valor,unidade:item.unidade||"BRL",paginaOrigem:item.pagina_origem||null,
   linhaOrigem:i+2,validadoPorAnalista:false});
 }
 return {registros,erros,status:"aguardando_conciliacao",
  aptoParaProjecao:false,origem:"CSV local",aviso:"Conferir unidades, sinal contábil e contas contra documentos originais."};
}
