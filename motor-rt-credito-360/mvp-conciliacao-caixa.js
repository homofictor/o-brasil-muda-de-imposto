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

// Recalcula cada conta sem confiar apenas no campo conciliacao do motor.
const validarConta = (conta, nome) => {
  const campos = ['saldoInicial', 'gerado', 'debito', 'utilizado',
    'ressarcido', 'ajusteNegativo', 'saldoFinal'];
  const v = Object.fromEntries(campos.map(campo =>
    [campo, finito(conta[campo], `${nome} ${campo}`)]));
  if (campos.some(campo => v[campo] < 0) ||
      v.utilizado > v.debito + TOLERANCIA ||
      v.utilizado > v.saldoInicial + v.gerado + TOLERANCIA)
    throw new Error(`Memoria de caixa nao conciliada: limites da conta ${nome}`);
  conciliar(conta.tributoPagar, v.debito - v.utilizado, `${nome} tributo a pagar`);
  conciliar(v.saldoFinal, v.saldoInicial + v.gerado - v.utilizado -
    v.ressarcido - v.ajusteNegativo, `${nome} saldo final`);
  conciliar(conta.conciliacao, 0, `conta ${nome}`);
  return v.ressarcido;
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
  const ressarcimentoIBS = validarConta(p.ibs, 'IBS');
  const ressarcimentoCBS = validarConta(p.cbs, 'CBS');
  conciliar(ressarcimentos, ressarcimentoIBS + ressarcimentoCBS, 'ressarcimentos segregados');
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
