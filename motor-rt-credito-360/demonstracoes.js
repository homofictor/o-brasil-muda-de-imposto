/**
 * Pré-validação de demonstrações contábeis, antes de upload seguro.
 * Este módulo NÃO armazena nem extrai arquivos; o upload real requer
 * autenticação, autorização, antivírus, storage privado e trilha de auditoria.
 */
export const TIPOS_DEMONSTRACAO=Object.freeze([
 "balanco_patrimonial","dre","dfc","dmpl","notas_explicativas","relatorio_auditoria","balancete"
]);
const EXTENSOES=new Set(["pdf","xlsx","xls","csv"]);
const TAMANHO_MAXIMO=25*1024*1024;
export function validarDocumentoContabil({nome,tamanho,tipo,ano,periodo="anual"}) {
 const falhas=[];
 const ext=String(nome??"").split(".").pop().toLowerCase();
 if(!EXTENSOES.has(ext))falhas.push("Formato não aceito");
 if(!Number.isSafeInteger(tamanho)||tamanho<=0||tamanho>TAMANHO_MAXIMO)
  falhas.push("Tamanho inválido ou superior a 25 MB");
 if(!TIPOS_DEMONSTRACAO.includes(tipo))falhas.push("Tipo de demonstração inválido");
 if(!Number.isInteger(ano)||ano<1990||ano>2100)falhas.push("Exercício inválido");
 if(!["anual","trimestral","mensal"].includes(periodo))falhas.push("Período inválido");
 return {valido:falhas.length===0,falhas,metadados:{nome,extensao:ext,tamanho,tipo,ano,periodo},
  exigeRevisaoHumana:true,uploadAutorizado:false};
}
export function conciliarBalanco({ativoTotal,passivoTotal,patrimonioLiquido},tolerancia=0.01){
 for(const [campo,v] of Object.entries({ativoTotal,passivoTotal,patrimonioLiquido}))
  if(!Number.isFinite(v))throw new Error("Valor inválido: "+campo);
 const diferenca=ativoTotal-passivoTotal-patrimonioLiquido;
 return {diferenca,conciliado:Math.abs(diferenca)<=tolerancia};
}
export function validarSerieHistorica(registros){
 if(!Array.isArray(registros))throw new Error("Série histórica inválida");
 const chaves=new Set(),falhas=[];
 for(const r of registros){
  const chave=[r.tipo,r.ano,r.periodo??"anual"].join(":");
  if(chaves.has(chave))falhas.push("Demonstração duplicada: "+chave);
  chaves.add(chave);
  const v=validarDocumentoContabil(r);
  falhas.push(...v.falhas.map(f=>chave+": "+f));
 }
 const anos=[...new Set(registros.map(r=>r.ano))].sort();
 if(anos.length<3)falhas.push("Histórico inferior a três exercícios; justificar limitação");
 return {falhas,anos,completo:falhas.length===0};
}
