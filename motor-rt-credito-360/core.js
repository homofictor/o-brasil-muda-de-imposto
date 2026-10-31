/**
 * Motor RT Crédito 360 | núcleo preliminar sem dependências
 * Valores monetários em reais; alíquotas como decimais (0.1 = 10%).
 * Não substitui apuração tributária nem análise de crédito.
 * Premissas de legislação e transição devem vir de fonte versionada e validada.
 */
export function projetarCreditoRT(entrada) {
  const { anoBase, anos = 5, receitaInicial, crescimento = 0,
    margemEbitda = 0, aliquotaAtual = 0, aliquotasRT = {},
    creditosRT = {}, capex = {}, variacaoNCG = {}, juros = {},
    amortizacoes = {}, impostosSobreResultado = {}, outrosAjustesCaixa = {} } = entrada;
  if (!Number.isInteger(anoBase) || !Number.isInteger(anos) || anos < 1 || anos > 10)
    throw new Error("Horizonte ou ano-base inválido");
  for (const [campo, valor] of Object.entries({receitaInicial,crescimento,margemEbitda,aliquotaAtual})) {
    if (!Number.isFinite(valor)) throw new Error("Valor inválido: " + campo);
  }
  if (receitaInicial < 0 || margemEbitda < 0 || margemEbitda > 1 || aliquotaAtual < 0 || aliquotaAtual > 1)
    throw new Error("Premissas fora do intervalo permitido");
  const valor = (mapa, ano) => {
    const v = mapa[ano] ?? 0;
    if (!Number.isFinite(v)) throw new Error("Valor inválido no ano " + ano);
    return v;
  };
  let receita = receitaInicial;
  return Array.from({length: anos}, (_, indice) => {
    const ano = anoBase + indice + 1;
    receita *= (1 + crescimento);
    const taxaRT = aliquotasRT[ano];
    if (!Number.isFinite(taxaRT) || taxaRT < 0 || taxaRT > 1)
      throw new Error("Alíquota RT não informada ou inválida: " + ano);
    const credito = valor(creditosRT, ano);
    if (credito < 0) throw new Error("Crédito fiscal negativo: " + ano);
    const tributoReferencia = receita * aliquotaAtual;
    const tributoRTBruto = receita * taxaRT;
    const tributoRTLiquido = Math.max(0, tributoRTBruto - credito);
    const creditoNaoUtilizado = Math.max(0, credito - tributoRTBruto);
    const ebitdaReferencia = receita * margemEbitda;
    const ebitdaRT = ebitdaReferencia + tributoReferencia - tributoRTLiquido;
    const desembolsos = valor(capex,ano) + valor(variacaoNCG,ano) +
      valor(impostosSobreResultado,ano) - valor(outrosAjustesCaixa,ano);
    const caixaReferencia = ebitdaReferencia - desembolsos;
    const caixaRT = ebitdaRT - desembolsos;
    const servicoDivida = valor(juros,ano) + valor(amortizacoes,ano);
    return {ano, receita, tributoReferencia, tributoRTBruto, credito,
      creditoNaoUtilizado, tributoRTLiquido, ebitdaReferencia, ebitdaRT,
      caixaReferencia, caixaRT, servicoDivida,
      icsdReferencia: servicoDivida > 0 ? caixaReferencia / servicoDivida : null,
      icsdRT: servicoDivida > 0 ? caixaRT / servicoDivida : null,
      variacaoCaixa: caixaRT - caixaReferencia};
  });
}
