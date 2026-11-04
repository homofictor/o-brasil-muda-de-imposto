'use strict';
const { conciliarSaldos } = require('./reconciliacao.cjs');
const { classificarExcecoes } = require('./excecoes-materiais.cjs');

// Integração interna após classificação e normalização das contas, antes de projeções.
function avaliarConciliacaoEtapa2({ bp, balancete, politicaMaterialidade } = {}) {
  const conciliacao = conciliarSaldos(bp, balancete);
  if (!politicaMaterialidade) {
    return { conciliacao, excecoes: null, revisaoPendente: conciliacao.divergencias.length > 0,
      politicaPendente: true, aptoParaProjetar: conciliacao.conciliado, homologado: false };
  }
  const classificacao = classificarExcecoes(conciliacao, politicaMaterialidade);
  return { conciliacao, excecoes: classificacao.excecoes,
    revisaoPendente: classificacao.revisaoPendente, politicaPendente: false,
    aptoParaProjetar: !classificacao.revisaoPendente, homologado: false };
}
module.exports = { avaliarConciliacaoEtapa2 };
