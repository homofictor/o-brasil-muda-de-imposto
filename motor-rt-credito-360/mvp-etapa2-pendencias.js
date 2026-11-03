import {prepararConfirmacoesRubricasV3} from './mvp-confirmacoes-v3.js';

// Triagem conservadora para a etapa 2. Não aprova rubricas nem calcula materialidade.
export function resumirPendenciasEtapa2(rubricas) {
  const resultado = prepararConfirmacoesRubricasV3(rubricas, []);
  return {
    total: resultado.totalRascunhos,
    pendentes: resultado.pendencias.length,
    aptoParaConciliacao: false,
    aplicadoProjecao: false
  };
}
