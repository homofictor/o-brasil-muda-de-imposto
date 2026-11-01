// Verificacao independente da memoria do MVP. Nao substitui DFC ou FCADS contratual.
const TOLERANCIA = 0.01;
const finito = (valor, campo) => {
  if (typeof valor !== 'number' || !Number.isFinite(valor))
    throw new Error(`Memoria de caixa incompleta: ${campo}`);
  return valor;
};
const conciliar = (informado, esperado, campo) => {
  if (Math.abs(finito(informado, campo) - finito(esperado, campo + ' esperado')) > TOLERANCIA)
    throw new Error(`Memoria de caixa nao conciliada: ${campo}`);
};

export function validarMemoriaCaixaMVP(projecao) {
  const p = projecao;
  const c = p?.componentesCaixa;
  if (!c || !p?.ibs || !p?.cbs)
    throw new Error('Memoria de caixa incompleta: componentes e contas IBS/CBS');
  const ebitda = finito(p.ebitdaReferencia, 'EBITDA');
  const capex = finito(c.capex, 'CAPEX');
  const ncg = finito(c.variacaoNCG, 'NCG');
  const ir = finito(c.impostosResultado, 'impostos sobre resultado');
  const juros = finito(c.juros, 'juros');
  const amortizacoes = finito(c.amortizacoes, 'amortizacoes');
  const ibs = finito(p.ibs.tributoPagar, 'IBS a pagar');
  const cbs = finito(p.cbs.tributoPagar, 'CBS a pagar');
  const ressarcimentos = finito(p.ressarcimentoRecebidoTotal, 'ressarcimentos recebidos');
  const referencia = finito(p.tributoReferencia, 'tributo de referencia');
  conciliar(p.ibs.conciliacao, 0, 'conta IBS');
  conciliar(p.cbs.conciliacao, 0, 'conta CBS');
  conciliar(p.tributoPagarTotal, ibs + cbs, 'tributos segregados');
  const antes = ebitda - capex - ncg - ir;
  const caixaReferencia = antes - referencia;
  const caixaReforma = antes - ibs - cbs + ressarcimentos;
  const servico = juros + amortizacoes;
  conciliar(p.caixaAntesTributos, antes, 'caixa antes dos tributos');
  conciliar(p.caixaReferencia, caixaReferencia, 'caixa de referencia');
  conciliar(p.caixaReforma, caixaReforma, 'caixa na reforma');
  conciliar(p.servicoDivida, servico, 'servico da divida');
  conciliar(p.variacaoCaixa, caixaReforma - caixaReferencia, 'variacao de caixa');
  if (servico > 0) {
    conciliar(p.icsdReferencia, caixaReferencia / servico, 'ICSD referencia');
    conciliar(p.icsdReforma, caixaReforma / servico, 'ICSD reforma');
  } else if (p.icsdReferencia !== null || p.icsdReforma !== null) {
    throw new Error('ICSD indisponivel sem servico da divida positivo');
  }
  return {tributoReferencia: referencia, ibs, cbs, ressarcimentos,
    juros, amortizacoes, variacaoCaixa: caixaReforma - caixaReferencia,
    status: 'conciliado_apenas_para_simulacao_sintetica'};
}
