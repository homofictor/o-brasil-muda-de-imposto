// Triagem conservadora dos candidatos aceitos pelo importador v3.2.
// Não interpreta documentos, não calcula materialidade e não altera projeções.
const CAMPOS = new Set([
  'interestExpense', 'rbt12', 'currentOperatingMarginPct',
  'currentAssets', 'currentLiabilities', 'currentConsumptionTaxAnnual'
]);

export function triarExcecoesContabeis(candidatos) {
  if (!Array.isArray(candidatos) || candidatos.length > CAMPOS.size)
    throw new Error('Candidatos contábeis inválidos');
  const vistos = new Set();
  for (const item of candidatos) {
    if (!item || !CAMPOS.has(item.field) || vistos.has(item.field) ||
        typeof item.value !== 'number' || !Number.isFinite(item.value) ||
        Math.abs(item.value) > 1e15 ||
        !(item.periodMonths === null || (Number.isInteger(item.periodMonths) &&
          item.periodMonths >= 1 && item.periodMonths <= 12)))
      throw new Error('Candidato contábil inconsistente');
    vistos.add(item.field);
  }
  const excecoes = [];
  if (vistos.has('rbt12'))
    excecoes.push('Receita bruta/RBT12 não equivale à receita líquida da DRE. Exigir conciliação antes de calcular margem.');
  if (vistos.has('currentOperatingMarginPct'))
    excecoes.push('Margem EBITDA isolada não comprova EBITDA monetário, competência nem reconciliação com a DRE.');
  if (candidatos.some(item => item.field === 'rbt12' && item.value === 0) && vistos.has('currentOperatingMarginPct'))
    excecoes.push('Receita bruta/RBT12 igual a zero com margem operacional informada. Conferir denominador, origem e competência; não inferir EBITDA monetário.');
  if (vistos.has('currentAssets') || vistos.has('currentLiabilities'))
    excecoes.push('Ativo e passivo circulantes não determinam NCG operacional. Separar contas cíclicas e comparar períodos.');
  if (vistos.has('currentAssets') !== vistos.has('currentLiabilities'))
    excecoes.push('Capital circulante incompleto: falta ativo ou passivo circulante correspondente. Não calcular capital circulante líquido nem inferir NCG.');
  if (candidatos.some(item =>
    (item.field === 'currentAssets' || item.field === 'currentLiabilities') && item.value < 0))
    excecoes.push('Saldo circulante negativo informado. Confirmar natureza devedora/credora, sinal e reclassificação antes de conciliar o BP ou estimar NCG.');
  if (candidatos.some(item => item.field === 'rbt12' && item.value < 0))
    excecoes.push('Receita bruta/RBT12 negativa. Conferir devoluções, estornos, sinal e competência antes de projetar receitas.');
  if (candidatos.some(item => item.field === 'currentConsumptionTaxAnnual' && item.value < 0))
    excecoes.push('Tributos atuais negativos. Conferir créditos, compensações, restituições e sinal antes de estimar carga tributária ou fluxo de caixa.');
  if (candidatos.some(item => item.field === 'interestExpense' && item.value < 0))
    excecoes.push('Despesas financeiras negativas. Conferir reversões, receitas financeiras, sinal e competência antes de estimar juros ou serviço da dívida.');
  if (candidatos.some(item => item.field === 'currentOperatingMarginPct' && Math.abs(item.value) > 100))
    excecoes.push('Margem operacional fora da faixa usual de -100% a 100%. Conferir unidade percentual, sinal, receitas não recorrentes e reconciliação da DRE antes de projetar EBITDA. Não corrigir automaticamente.');
  if (vistos.has('interestExpense'))
    excecoes.push('Despesas financeiras não representam serviço da dívida. Confirmar juros, amortizações e metodologia do ICSD.');
  if (vistos.has('currentConsumptionTaxAnnual'))
    excecoes.push('Tributos atuais não comprovam base, competência nem elegibilidade de créditos IBS/CBS. Conferir dupla contagem no caixa.');
  // Indicadores de fluxo não podem ser tratados como anuais sem conferir a competência.
  // Os saldos patrimoniais são posições em data-base, não fluxos anuais.
  for (const item of candidatos) {
    if (item.field === 'rbt12' && item.periodMonths !== 12)
      excecoes.push('RBT12: período de 12 meses não comprovado. Conferir a competência antes de usar a receita.');
    if (item.field === 'currentConsumptionTaxAnnual' && item.periodMonths !== 12)
      excecoes.push('Tributos atuais anuais: período de 12 meses não comprovado. Não anualizar nem comparar com IBS/CBS automaticamente.');
    if (item.field === 'interestExpense' && item.periodMonths === null)
      excecoes.push('Despesas financeiras: período não informado. Não anualizar nem estimar serviço da dívida.');
    if (item.field === 'interestExpense' && item.periodMonths !== null && item.periodMonths !== 12)
      excecoes.push('Despesas financeiras: período parcial de '+item.periodMonths+' meses. Não tratar como valor anual nem como serviço da dívida sem conciliação.');
    if (item.field === 'currentOperatingMarginPct' && item.periodMonths === null)
      excecoes.push('Margem operacional: período não informado. Confirmar competência antes de comparar exercícios.');
    if (item.field === 'currentOperatingMarginPct' && item.periodMonths !== null && item.periodMonths !== 12)
      excecoes.push('Margem operacional: período parcial de '+item.periodMonths+' meses. Não comparar com margem anual sem conciliar a DRE.');
  }
  return {
    recebidos: vistos.size,
    excecoes,
    classificacao: 'pendencias_de_conciliacao_nao_quantificadas',
    aviso: 'São alertas de possível impacto material, não uma medição de materialidade. Nenhum candidato alimenta automaticamente EBITDA, NCG, caixa, IBS/CBS ou ICSD.'
  };
}