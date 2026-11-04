'use strict';
// Validação independente da origem dos movimentos antes de integrar o importador.
// Não transforma evidência declarada em comprovação contábil.
function validarRastreabilidadeMovimentos(movimentos) {
  if (!Array.isArray(movimentos) || movimentos.length === 0)
    return { valido: false, motivo: 'movimentos_ausentes' };
  const vistos = new Set();
  for (const item of movimentos) {
    if (!item || typeof item.codigo !== 'string' || !item.codigo.trim() ||
        !Number.isSafeInteger(item.movimentosCentavos))
      return { valido: false, motivo: 'movimento_invalido' };
    const codigo = item.codigo.trim();
    if (vistos.has(codigo)) return { valido: false, motivo: 'conta_duplicada' };
    vistos.add(codigo);
    if (typeof item.documentoOrigem !== 'string' || !item.documentoOrigem.trim() ||
        typeof item.competenciaInicio !== 'string' || typeof item.competenciaFim !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.competenciaInicio) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.competenciaFim) ||
        item.competenciaFim < item.competenciaInicio)
      return { valido: false, motivo: 'origem_ou_periodo_nao_documentado' };
  }
  return { valido: true, motivo: null, quantidadeContas: vistos.size };
}
module.exports = { validarRastreabilidadeMovimentos };
