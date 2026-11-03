import {classificarEmpresa} from "./classificador-cnae.js";

/**
 * Diagnóstico de prontidão. Bloqueia projeção tributária quando a informação
 * cadastral ou o enquadramento das operações não permitem análise defensável.
 * Operação: {id, descricao, participacaoReceita, tratamentoValidado, fonteLegal,
 *            tipoOperacao, aliquotasPorAno, creditosPorAno}.
 * A validação NÃO verifica a correção jurídica das fontes declaradas.
 */
export function diagnosticarEnquadramento(entrada) {
 const perfil=classificarEmpresa(entrada);
 const falhas=[], alertas=[...perfil.pendencias], operacoes=entrada.segmentosReceita??[];
 if(!entrada.regimeTributario) falhas.push("Regime tributário não informado");
 if(!operacoes.length) falhas.push("Composição da receita não informada");
 let soma=0;
 const ids=new Set();
 for(const [i,op] of operacoes.entries()) {
   const rotulo=op.id??String(i);
   if(ids.has(rotulo))falhas.push("Identificador de operação duplicado: "+rotulo);
   ids.add(rotulo);
   if(typeof op.descricao!=="string"||!op.descricao.trim())falhas.push("Descrição ausente: "+rotulo);
   if(!Number.isFinite(op.participacaoReceita)||op.participacaoReceita<0||op.participacaoReceita>1)
     falhas.push("Participação inválida: "+rotulo);
   else soma+=op.participacaoReceita;
   if(!op.tipoOperacao)falhas.push("Natureza da operação não informada: "+rotulo);
   if(op.tratamentoValidado!==true||!op.fonteLegal)falhas.push("Tratamento fiscal ou fonte legal não validado: "+rotulo);
   if(!op.aliquotasPorAno)falhas.push("Alíquotas anuais não informadas: "+rotulo);
   if(!op.creditosPorAno)alertas.push("Créditos anuais não detalhados: "+rotulo);
 }
 if(operacoes.length&&Math.abs(soma-1)>1e-6)
   falhas.push("Participações de receita não totalizam 100%");
 if(perfil.setores.includes("locacao_veiculos")){
   const tipos=new Set(operacoes.map(o=>o.tipoOperacao));
   if(!tipos.has("locacao"))alertas.push("Confirmar receitas de locação");
   if(!tipos.has("venda_usados"))alertas.push("Confirmar existência de venda de veículos usados");
   alertas.push("Projetar renovação da frota e créditos recorrentes separadamente");
 }
 return {perfil,operacoesAvaliadas:operacoes.length,participacaoTotal:soma,
  falhas,alertas:[...new Set(alertas)],
  prontoParaSimulacao:falhas.length===0,
  status:falhas.length?"bloqueado_por_pendencias":"premissas_declaradas_pendentes_auditoria",
  observacao:"Não constitui certificação da legislação nem validação de benefícios. Requer revisão técnica antes de uso em parecer."};
}
