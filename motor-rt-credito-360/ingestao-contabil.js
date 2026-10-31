import {validarDocumentoContabil} from "./demonstracoes.js";

/**
 * Contrato do backend de ingestão segura. O cliente NÃO recebe credenciais de
 * storage nem escreve em bucket público. Implementação de endpoint pendente.
 */
export function prepararSolicitacaoUpload({arquivo,tipo,ano,periodo="anual",empresaId}) {
 const validacao=validarDocumentoContabil({
  nome:arquivo?.name,tamanho:arquivo?.size,tipo,ano,periodo
 });
 const falhas=[...validacao.falhas];
 if(typeof empresaId!=="string"||!/^[-a-zA-Z0-9_]{8,80}$/.test(empresaId))
  falhas.push("Identificador interno da empresa inválido");
 if(!arquivo)falhas.push("Arquivo ausente");
 return {aceitoParaSolicitar:falhas.length===0,falhas,
  metadados:{...validacao.metadados,empresaId},
  armazenamento:"privado",revisaoObrigatoria:true};
}
/**
 * Interface do serviço servidor, sem persistência implementada.
 * Servidor deve autenticar usuário, verificar acesso à empresa, inspecionar
 * assinatura MIME, fazer varredura antimalware, gerar chave aleatória e
 * URL assinada de curta duração; registrar hash, auditoria e retenção.
 */
export function validarRespostaAutorizacaoUpload(resposta) {
 if(!resposta||resposta.autorizado!==true||
    typeof resposta.documentoId!=="string"||!resposta.documentoId||
    typeof resposta.urlTemporaria!=="string"||
    !/^https:\/\//.test(resposta.urlTemporaria))
  throw new Error("Autorização de upload inválida");
 return {documentoId:resposta.documentoId,urlTemporaria:resposta.urlTemporaria,
  expiraEm:resposta.expiraEm??null};
}
/** Mapeamento preliminar: números declarados, não extração automática de PDF. */
export function prepararRevisaoContabil({documentoId,exercicio,demonstracao,linhas}) {
 if(!documentoId||!Number.isInteger(exercicio)||!Array.isArray(linhas))
  throw new Error("Revisão contábil inválida");
 const erros=[];
 const registros=linhas.map((linha,i)=>{
  if(typeof linha.conta!=="string"||!linha.conta.trim()||
     !Number.isFinite(linha.valor))
    erros.push("Linha inválida: "+(i+1));
  return {conta:linha.conta,valor:linha.valor,
   unidade:linha.unidade??"BRL",paginaOrigem:linha.paginaOrigem??null,
   revisadoPorAnalista:false};
 });
 return {documentoId,exercicio,demonstracao,registros,erros,
  status:"aguardando_revisao",aptoParaProjecao:false};
}
export function aprovarRevisaoContabil(revisao,{analistaId,confirmacoes}={}){
 if(revisao.erros?.length)throw new Error("Há inconsistências na extração");
 if(!analistaId||confirmacoes?.conferiuFonte!==true||
    confirmacoes?.conferiuUnidades!==true||
    confirmacoes?.conferiuTotais!==true)
  throw new Error("Revisão humana incompleta");
 return {...revisao,status:"revisado",aptoParaProjecao:true,
  registros:revisao.registros.map(r=>({...r,revisadoPorAnalista:true})),
  aprovacao:{analistaId,em:new Date().toISOString()}};
}
