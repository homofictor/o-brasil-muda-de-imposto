'use strict';
// Origem declarada não equivale a documento autenticado.
function dataCivilValida(valor) {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split('-').map(Number);
  if (ano < 1 || mes < 1 || mes > 12 || dia < 1) return false;
  const ultimoDia = new Date(0);
  ultimoDia.setUTCHours(0, 0, 0, 0);
  ultimoDia.setUTCFullYear(ano, mes, 0);
  return dia <= ultimoDia.getUTCDate();
}
function validarRastreabilidadeMovimentos(movimentos, periodoEsperado) {
  if (!Array.isArray(movimentos) || movimentos.length === 0)
    return { valido: false, motivo: 'movimentos_ausentes' };
  if (periodoEsperado && (!dataCivilValida(periodoEsperado.inicio) ||
      !dataCivilValida(periodoEsperado.fim) || periodoEsperado.inicio > periodoEsperado.fim))
    return { valido: false, motivo: 'periodo_esperado_invalido' };
  const vistos = new Set();
  for (const item of movimentos) {
    if (!item || typeof item.codigo !== 'string' || !item.codigo.trim() ||
        !Number.isSafeInteger(item.movimentosCentavos))
      return { valido: false, motivo: 'movimento_invalido' };
    const codigo = item.codigo.trim();
    if (vistos.has(codigo)) return { valido: false, motivo: 'conta_duplicada' };
    vistos.add(codigo);
    if (typeof item.documentoOrigem !== 'string' || !item.documentoOrigem.trim() ||
        !dataCivilValida(item.competenciaInicio) || !dataCivilValida(item.competenciaFim) ||
        item.competenciaFim < item.competenciaInicio)
      return { valido: false, motivo: 'origem_ou_periodo_nao_documentado' };
    if (periodoEsperado && (item.competenciaInicio !== periodoEsperado.inicio ||
        item.competenciaFim !== periodoEsperado.fim))
      return { valido: false, motivo: 'periodo_incompativel' };
  }
  return { valido: true, motivo: null, quantidadeContas: vistos.size };
}
module.exports = { validarRastreabilidadeMovimentos };
