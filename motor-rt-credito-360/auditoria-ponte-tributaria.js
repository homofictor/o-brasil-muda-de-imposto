/**
 * Controle de dupla contagem entre EBITDA e tributos sobre consumo.
 * A DRE pode apresentar receita líquida de tributos e custos líquidos de
 * créditos. Portanto, diferenças de imposto não devem ser automaticamente
 * somadas ou subtraídas do EBITDA ou do FCADS.
 */
export function auditarPonteTributaria({
 receitaBase,ebitdaBase,tributoReferencia,tributoReforma,
 impostoReferenciaJaRefletidoNoEbitda,
 impostoReformaJaRefletidoNoEbitda,
 efeitoPreco=0,efeitoCusto=0,
 evidenciaContabil,validadoPorAnalista=false
}){
 const numeros={receitaBase,ebitdaBase,tributoReferencia,tributoReforma,efeitoPreco,efeitoCusto};
 for(const [nome,v] of Object.entries(numeros))
  if(!Number.isFinite(v))throw new Error("Valor inválido: "+nome);
 if(receitaBase<0||tributoReferencia<0||tributoReforma<0)
  throw new Error("Valores monetários negativos não admitidos");
 const flags=[impostoReferenciaJaRefletidoNoEbitda,impostoReformaJaRefletidoNoEbitda];
 if(flags.some(v=>typeof v!=="boolean"))
  throw new Error("Informar explicitamente o tratamento dos tributos no EBITDA");
 const alertas=[];
 if(!evidenciaContabil?.trim())alertas.push("Ausente memória de conciliação contábil");
 if(!validadoPorAnalista)alertas.push("Revisão do analista pendente");
 if(impostoReferenciaJaRefletidoNoEbitda!==impostoReformaJaRefletidoNoEbitda)
  alertas.push("Bases contábeis não comparáveis: exige normalização");
 const comparavel=flags[0]===flags[1];
 // Somente no caso de EBITDA pré-tributos explicitamente documentado
 // a variação dos tributos é um ajuste de caixa incremental permitido.
 const ajusteTributarioCaixa=comparavel&&!flags[0]
  ?tributoReferencia-tributoReforma:null;
 return {comparavel,ajusteTributarioCaixa,
  efeitoPreco,efeitoCusto,alertas,
  autorizadoParaProjecao:comparavel&&alertas.length===0,
  regra:"Não adicionar tributo de referência ao EBITDA líquido de tributos sem conciliação."};
}
