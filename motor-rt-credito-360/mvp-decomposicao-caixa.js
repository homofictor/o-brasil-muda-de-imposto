// Memória incremental da capacidade de pagamento, exclusivamente sintética.
// Os efeitos de IBS e CBS são apenas diferenças de caixa não incluídas no EBITDA.
const RUBRICAS = Object.freeze([
  ['ajusteEBITDA', 'EBITDA', 1],
  ['ajusteNCG', 'NCG', -1],
  ['ajusteCAPEX', 'CAPEX', -1],
  ['ajusteIR', 'IR', -1],
  ['ajusteIBS', 'IBS', 1],
  ['ajusteCBS', 'CBS', 1],
  ['ajusteOutros', 'Outros', 1]
]);
const numero = (v, nome, ano) => {
  if (typeof v !== 'number' || !Number.isFinite(v))
    throw new Error(`${ano}: ${nome} deve ser numérico e finito`);
  return v;
};

export function decomporImpactoCaixa(projecao) {
  if (!Array.isArray(projecao) || !projecao.length || projecao.length > 8)
    throw new Error('Informe de um a oito exercícios para decomposição');
  const totais = Object.fromEntries(RUBRICAS.map(([, titulo]) => [titulo, 0]));
  let acumulado = 0;
  let anoAnterior = 2025;
  const exercicios = projecao.map(linha => {
    const ano = linha?.ano;
    if (!Number.isInteger(ano) || ano < 2026 || ano > 2033 || ano <= anoAnterior)
      throw new Error('Exercícios inválidos ou fora de ordem na decomposição');
    anoAnterior = ano;
    const componentes = {};
    let total = 0;
    for (const [campo, titulo, sinal] of RUBRICAS) {
      const impacto = numero(linha[campo], campo, ano) * sinal;
      componentes[titulo] = impacto;
      totais[titulo] += impacto;
      total += impacto;
    }
    const delta = numero(linha.deltaCaixa, 'deltaCaixa', ano);
    const original = numero(linha.caixaOriginal, 'caixaOriginal', ano);
    const ajustado = numero(linha.caixaReforma, 'caixaReforma', ano);
    if (Math.abs(total - delta) > 0.01 || Math.abs((ajustado - original) - delta) > 0.01)
      throw new Error(`${ano}: ponte de caixa não concilia com a projeção ajustada`);
    acumulado += delta;
    return {ano, componentes, deltaCaixa: delta, acumulado};
  });
  const rubricas = RUBRICAS.map(([, titulo]) => titulo);
  const maiorPressao = rubricas
    .filter(titulo => totais[titulo] < -0.01)
    .sort((a, b) => totais[a] - totais[b])[0] ?? null;
  return {
    exercicios, rubricas, totais,
    deltaCaixaAcumulado: acumulado,
    maiorPressao: maiorPressao === null ? null : {rubrica: maiorPressao, efeito: totais[maiorPressao]},
    ressalva: 'Decomposição aritmética de hipóteses informadas, sem comprovação de causalidade tributária, créditos elegíveis ou conciliação contratual do FCADS.'
  };
}
