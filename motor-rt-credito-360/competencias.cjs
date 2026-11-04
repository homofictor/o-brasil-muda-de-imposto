'use strict';
// Compara competências de saldos antes de conciliar BP e balancete.
// Nunca presume equivalência entre períodos ou ajusta saldos.
function validarCompetencias({ dataBP, dataBalancete } = {}) {
  const dataValida = (s) => {
    if (typeof s !== 'string' || !/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) return false;
    const [ano, mes, dia] = s.split('-').map(Number);
    const d = new Date(Date.UTC(ano, mes - 1, dia));
    return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
  };
  if (!dataValida(dataBP) || !dataValida(dataBalancete)) {
    return { comparavel: false, motivo: 'competencia_ausente_ou_invalida', revisaoObrigatoria: true };
  }
  if (dataBP !== dataBalancete) {
    return { comparavel: false, motivo: 'competencias_distintas', revisaoObrigatoria: true };
  }
  return { comparavel: true, motivo: null, revisaoObrigatoria: false };
}
module.exports = { validarCompetencias };
