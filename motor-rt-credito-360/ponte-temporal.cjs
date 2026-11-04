'use strict';
// Ponte temporal explícita: abertura + movimentos comprovados = fechamento.
// Todos os valores são centavos inteiros; não se estimam movimentos ausentes.
function conciliarPonteTemporal({ dataAbertura, dataFechamento, contas } = {}) {
  const dataValida = (s) => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const [a,m,d] = s.split('-').map(Number);
    const dt = new Date(Date.UTC(a,m-1,d));
    return dt.getUTCFullYear() === a && dt.getUTCMonth() === m-1 && dt.getUTCDate() === d;
  };
  if (!dataValida(dataAbertura) || !dataValida(dataFechamento) || dataFechamento <= dataAbertura)
    return { comparavel:false, motivo:'periodo_invalido', revisaoObrigatoria:true, divergencias:[] };
  if (!Array.isArray(contas) || contas.length === 0)
    return { comparavel:false, motivo:'movimentacoes_ausentes', revisaoObrigatoria:true, divergencias:[] };
  const vistas = new Set(), divergencias = [];
  for (const conta of contas) {
    if (!conta || typeof conta.codigo !== 'string' || !conta.codigo.trim() || vistas.has(conta.codigo.trim()))
      return { comparavel:false, motivo:'conta_invalida_ou_duplicada', revisaoObrigatoria:true, divergencias:[] };
    const codigo = conta.codigo.trim();
    vistas.add(codigo);
    const { aberturaCentavos, movimentosCentavos, fechamentoCentavos } = conta;
    if (![aberturaCentavos, movimentosCentavos, fechamentoCentavos].every(Number.isSafeInteger))
      return { comparavel:false, motivo:'saldo_ou_movimento_ausente', revisaoObrigatoria:true, divergencias:[] };
    const esperado = aberturaCentavos + movimentosCentavos;
    if (!Number.isSafeInteger(esperado))
      return { comparavel:false, motivo:'overflow', revisaoObrigatoria:true, divergencias:[] };
    if (esperado !== fechamentoCentavos) {
      const diferencaCentavos = fechamentoCentavos - esperado;
      if (!Number.isSafeInteger(diferencaCentavos))
        return { comparavel:false, motivo:'overflow', revisaoObrigatoria:true, divergencias:[] };
      divergencias.push({ codigo, diferencaCentavos });
    }
  }
  return { comparavel:divergencias.length === 0, motivo:divergencias.length ? 'movimentacao_nao_conciliada' : null,
    revisaoObrigatoria:divergencias.length > 0, divergencias, homologado:false };
}
module.exports = { conciliarPonteTemporal };
