import {auditarOrigemNCG} from "./auditoria-origem-ncg.js";
import {integrarIBSCBSAoCredito} from "./integracao-ibs-cbs-credito.js";

/**
 * Entrada auditada para a ponte financeira multissetorial.
 * Bloqueia a projeção inteira se faltar conciliação documental da NCG
 * em qualquer exercício. Não recalcula nem altera fórmulas financeiras.
 * Não substitui autorização institucional, DFC ou FCADS contratual.
 */
export function integrarCreditoComNCGAuditada({dadosFinanceiros, auditoriasNCG}) {
  const anoBase = dadosFinanceiros?.anoBase;
  const anos = dadosFinanceiros?.anos ?? 5;
  if (!Number.isInteger(anoBase) || !Number.isInteger(anos) || anos < 1 || anos > 10) {
    throw new Error("Período da projeção inválido");
  }
  const relatorios = {};
  for (let i = 1; i <= anos; i++) {
    const ano = anoBase + i;
    if (!Object.hasOwn(dadosFinanceiros.variacaoNCG ?? {}, ano) ||
        !Object.hasOwn(auditoriasNCG ?? {}, ano)) {
      throw new Error(`NCG ${ano}: variação informada ou auditoria documental ausente`);
    }
    const evidencia = auditoriasNCG[ano];
    if (evidencia?.exercicioBase !== ano - 1 || evidencia?.exercicioProjetado !== ano) {
      throw new Error(`NCG ${ano}: exercícios da evidência não correspondem à projeção`);
    }
    const relatorio = auditarOrigemNCG({
      ...evidencia, variacaoInformada: dadosFinanceiros.variacaoNCG[ano],
      // O limiar do gate não pode ser ampliado pela própria evidência.
      tolerancia: 0.01
    });
    if (relatorio.status !== "conciliado_revisado") {
      throw new Error(`NCG ${ano}: conciliação pendente (${relatorio.pendencias.join("; ")})`);
    }
    relatorios[ano] = relatorio;
  }
  const resultado = integrarIBSCBSAoCredito(dadosFinanceiros);
  return {
    ...resultado,
    projecoes: resultado.projecoes.map(projecao => ({
      ...projecao, auditoriaNCG: relatorios[projecao.ano]
    })),
    homologado: false,
    aptoParaParecer: false
  };
}
