'use strict';
const { conciliarSaldos } = require('./reconciliacao.cjs');
const { classificarExcecoes } = require('./excecoes-materiais.cjs');
const { validarCompetencias } = require('./competencias.cjs');
const { conciliarPonteTemporal } = require('./ponte-temporal.cjs');

// Datas distintas exigem movimentações comprovadas para todas as contas.
// Nunca compara diretamente saldos de períodos diferentes.
function avaliarConciliacaoEtapa2({ bp, balancete, dataBP, dataBalancete, politicaMaterialidade, movimentos } = {}) {
  const competencias = validarCompetencias({ dataBP, dataBalancete });
  if (!competencias.comparavel) {
    if (competencias.motivo !== 'competencias_distintas' || !Array.isArray(movimentos)) {
      return { competencias, conciliacao: null, excecoes: null, revisaoPendente: true,
        politicaPendente: !politicaMaterialidade, aptoParaProjetar: false, homologado: false };
    }
    // Valida a unicidade e os valores de ambas as bases antes de compor a ponte.
    conciliarSaldos(bp, balancete);
    const abertura = new Map(bp.map(c => [c.codigo.trim(), c.centavos]));
    const fechamento = new Map(balancete.map(c => [c.codigo.trim(), c.centavos]));
    const movimentoPorConta = new Map();
    for (const item of movimentos) {
      if (!item || typeof item.codigo !== 'string' || !item.codigo.trim() ||
          movimentoPorConta.has(item.codigo.trim()) || !Number.isSafeInteger(item.movimentosCentavos)) {
        return { competencias, conciliacao: null, excecoes: null, revisaoPendente: true,
          politicaPendente: !politicaMaterialidade, aptoParaProjetar: false, homologado: false,
          motivo: 'movimentos_invalidos_ou_duplicados' };
      }
      movimentoPorConta.set(item.codigo.trim(), item.movimentosCentavos);
    }
    const codigos = new Set([...abertura.keys(), ...fechamento.keys()]);
    if (codigos.size === 0 || codigos.size !== abertura.size || codigos.size !== fechamento.size ||
        codigos.size !== movimentoPorConta.size || [...codigos].some(c => !movimentoPorConta.has(c))) {
      return { competencias, conciliacao: null, excecoes: null, revisaoPendente: true,
        politicaPendente: !politicaMaterialidade, aptoParaProjetar: false, homologado: false,
        motivo: 'cobertura_incompleta_da_ponte' };
    }
    const ponte = conciliarPonteTemporal({
      dataAbertura: dataBP, dataFechamento: dataBalancete,
      contas: [...codigos].map(codigo => ({
        codigo, aberturaCentavos: abertura.get(codigo),
        movimentosCentavos: movimentoPorConta.get(codigo),
        fechamentoCentavos: fechamento.get(codigo)
      }))
    });
    return { competencias, ponte, conciliacao: null, excecoes: null,
      revisaoPendente: !ponte.comparavel, politicaPendente: !politicaMaterialidade,
      aptoParaProjetar: ponte.comparavel, homologado: false };
  }
  const conciliacao = conciliarSaldos(bp, balancete);
  if (!politicaMaterialidade) {
    return { competencias, conciliacao, excecoes: null, revisaoPendente: true,
      politicaPendente: true, aptoParaProjetar: false, homologado: false };
  }
  const classificacao = classificarExcecoes(conciliacao, politicaMaterialidade);
  return { competencias, conciliacao, excecoes: classificacao.excecoes,
    revisaoPendente: classificacao.revisaoPendente, politicaPendente: false,
    aptoParaProjetar: !classificacao.revisaoPendente, homologado: false };
}
module.exports = { avaliarConciliacaoEtapa2 };
