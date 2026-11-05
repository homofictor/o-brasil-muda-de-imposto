'use strict';
// Contrato de entrada para movimentos já extraídos e revisados.
// Não infere movimentações a partir de diferenças entre saldos.
function prepararMovimentosImportados(registros, { inicio, fim } = {}) {
  if (!Array.isArray(registros) || !registros.length) return { valido: false, motivo: 'registros_ausentes', movimentos: [] };
  if (typeof inicio !== 'string' || typeof fim !== 'string') return { valido: false, motivo: 'periodo_ausente', movimentos: [] };
  const vistos = new Set();
  const movimentos = [];
  for (const r of registros) {
    if (!r || typeof r.codigo !== 'string' || !r.codigo.trim() ||
        !Number.isSafeInteger(r.movimentosCentavos) ||
        typeof r.documentoOrigem !== 'string' || !r.documentoOrigem.trim() ||
        r.competenciaInicio !== inicio || r.competenciaFim !== fim ||
        r.revisado !== true) {
      return { valido: false, motivo: 'registro_sem_evidencia_ou_revisao', movimentos: [] };
    }
    const codigo = r.codigo.trim();
    if (vistos.has(codigo)) return { valido: false, motivo: 'conta_duplicada', movimentos: [] };
    vistos.add(codigo);
    movimentos.push({ codigo, movimentosCentavos: r.movimentosCentavos,
      documentoOrigem: r.documentoOrigem.trim(), competenciaInicio: inicio, competenciaFim: fim });
  }
  return { valido: true, motivo: null, movimentos };
}
module.exports = { prepararMovimentosImportados };
