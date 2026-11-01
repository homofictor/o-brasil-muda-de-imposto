/**
 * Indicadores históricos a partir de contas revisadas e padronizadas.
 * Os valores devem ser consistentes em período, moeda e escala.
 * Não inferir EBITDA a partir de lucro líquido ou de dados incompletos.
 */
const valor=(dados,chave)=>Number.isFinite(dados[chave])?dados[chave]:null;
export function calcularIndicadoresFinanceiros(dados){
 if(!dados||typeof dados!=="object")throw new Error("Dados financeiros inválidos");
 const avisos=[];
 // Aritmética finita na entrada não garante resultados finitos.
 const seguro=(resultado)=>{
  if(Number.isFinite(resultado))return resultado;
  avisos.push("Resultado financeiro não finito; indicador indisponível");
  return null;
 };
 const dividir=(a,b)=>a===null||b===null||b===0?null:seguro(a/b);
 const subtrair=(a,b)=>a===null||b===null?null:seguro(a-b);
 const ac=valor(dados,"ativoCirculante"),pc=valor(dados,"passivoCirculante");
 const caixa=valor(dados,"caixaEquivalentes"),divida=valor(dados,"dividaBruta");
 const pl=valor(dados,"patrimonioLiquido"),ativo=valor(dados,"ativoTotal");
 const receita=valor(dados,"receitaLiquida"),lucro=valor(dados,"lucroLiquido");
 const ebitda=valor(dados,"ebitda"),juros=valor(dados,"despesasFinanceiras");
 const caixaOp=valor(dados,"caixaOperacional"),capex=valor(dados,"capex");
 const servico=valor(dados,"servicoDivida"),fcads=valor(dados,"fluxoCaixaDisponivelServicoDivida");
 const dividaLiquida=subtrair(divida,caixa);
 if(ebitda===null)avisos.push("EBITDA ausente: não foi estimado automaticamente");
 if(fcads===null)avisos.push("FCADS ausente: ICSD não calculado");
 if(!Number.isFinite(dados.exercicio))avisos.push("Exercício não identificado");
 return {
  exercicio:dados.exercicio??null,
  liquidezCorrente:dividir(ac,pc),
  endividamentoGeral:dividir(subtrair(ativo,pl),ativo),
  margemLiquida:dividir(lucro,receita),
  margemEbitda:dividir(ebitda,receita),
  roe:dividir(lucro,pl),
  roa:dividir(lucro,ativo),
  dividaLiquida,
  dividaLiquidaEbitda:dividir(dividaLiquida,ebitda),
  coberturaJuros:dividir(ebitda,juros),
  fluxoCaixaLivre:subtrair(caixaOp,capex),
  icsd:dividir(fcads,servico),
  avisos,
  status:"indicadores_preliminares_requerem_validacao"
 };
}
export function calcularSerieFinanceira(exercicios){
 if(!Array.isArray(exercicios))throw new Error("Série inválida");
 const vistos=new Set();
 const serie=exercicios.map(d=>{
  if(vistos.has(d.exercicio))throw new Error("Exercício duplicado");
  vistos.add(d.exercicio);return calcularIndicadoresFinanceiros(d);
 }).sort((a,b)=>a.exercicio-b.exercicio);
 const alertas=[];
 if(serie.length<3)alertas.push("Menos de três exercícios disponíveis");
 for(let i=1;i<serie.length;i++)
  if(serie[i].exercicio!==serie[i-1].exercicio+1)alertas.push("Lacuna na série histórica");
 return {serie,alertas,aptoParaParecerAutomatico:false};
}
