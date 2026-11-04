'use strict';
const { conciliarSaldos } = require('./reconciliacao.cjs');
const { classificarExcecoes } = require('./excecoes-materiais.cjs');
const { validarCompetencias } = require('./competencias.cjs');

// Só compara saldos quando as datas-base são iguais e válidas.
// Balancete intermediário exige ponte temporal explícita, ainda não implementada.
function avaliarConciliacaoEtapa2({ bp, balancete, dataBP, dataBalancete, politicaMaterialidade } = {}) {
  const competencias = validarCompetencias({ dataBP, dataBalancete });
  if (!competencias.comparavel) {
    return { competencias, conciliacao: null, excecoes: null, revisaoPendente: true,
      politicaPendente: !politicaMaterialidade, aptoParaProjetar: false, homologado: false };
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
