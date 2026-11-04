'use strict';
// Classifica divergências já conciliadas, sem alterar saldos nem presumir materialidade.
function politicaMaterialidadeValida(politica) {
  return !!(politica && Number.isSafeInteger(politica.limiteCentavos) &&
    politica.limiteCentavos >= 0 && typeof politica.fonte === 'string' && politica.fonte.trim());
}
function classificarExcecoes(resultado, politica) {
  if (!resultado || !Array.isArray(resultado.divergencias)) throw new TypeError('Conciliação obrigatória');
  if (!politicaMaterialidadeValida(politica)) {
    throw new TypeError('Política explícita de materialidade com fonte obrigatória');
  }
  const excecoes = resultado.divergencias.map(d => {
    if (!d || typeof d.codigo !== 'string' || !['ausente_no_bp', 'ausente_no_balancete', 'saldo_divergente'].includes(d.motivo)) throw new TypeError('Divergência inválida');
    const ausente = d.motivo !== 'saldo_divergente';
    if (!ausente && (!Number.isSafeInteger(d.bpCentavos) || !Number.isSafeInteger(d.balanceteCentavos))) throw new TypeError('Saldo inválido');
    const diferenca = ausente ? null : Math.abs(d.bpCentavos - d.balanceteCentavos);
    if (diferenca !== null && !Number.isSafeInteger(diferenca)) throw new RangeError('Diferença fora do intervalo seguro');
    return { ...d, diferencaCentavos: diferenca, revisaoObrigatoria: ausente || diferenca > politica.limiteCentavos };
  });
  return { excecoes, revisaoPendente: excecoes.some(d => d.revisaoObrigatoria), politica: { limiteCentavos: politica.limiteCentavos, fonte: politica.fonte.trim() }, homologado: false };
}
module.exports = { classificarExcecoes, politicaMaterialidadeValida };
