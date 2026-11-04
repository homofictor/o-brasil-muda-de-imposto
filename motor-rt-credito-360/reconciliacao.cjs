'use strict';
// Conciliação exata de saldos normalizados em centavos. Materialidade é avaliada depois.
function conciliarSaldos(bp, balancete) {
  if (!Array.isArray(bp) || !Array.isArray(balancete)) throw new TypeError('Listas de contas obrigatórias');
  function indexar(contas, origem) {
    const mapa = new Map();
    for (const conta of contas) {
      if (!conta || typeof conta.codigo !== 'string' || !conta.codigo.trim()) throw new TypeError('Código inválido em ' + origem);
      const codigo = conta.codigo.trim();
      if (mapa.has(codigo)) throw new Error('Conta duplicada em ' + origem + ': ' + codigo);
      if (!Number.isSafeInteger(conta.centavos)) throw new TypeError('Saldo inválido em ' + origem + ': ' + codigo);
      mapa.set(codigo, conta.centavos);
    }
    return mapa;
  }
  const a = indexar(bp, 'BP'), b = indexar(balancete, 'balancete');
  const divergencias = [];
  for (const codigo of [...new Set([...a.keys(), ...b.keys()])].sort()) {
    const noBP = a.has(codigo), noBalancete = b.has(codigo);
    const valorBP = noBP ? a.get(codigo) : null;
    const valorBalancete = noBalancete ? b.get(codigo) : null;
    if (!noBP || !noBalancete || valorBP !== valorBalancete) {
      divergencias.push({ codigo, bpCentavos: valorBP, balanceteCentavos: valorBalancete,
        motivo: !noBP ? 'ausente_no_bp' : !noBalancete ? 'ausente_no_balancete' : 'saldo_divergente' });
    }
  }
  return { conciliado: divergencias.length === 0, divergencias };
}
module.exports = { conciliarSaldos };
