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
  if (vistos.has('currentAssets') || vistos.has('currentLiabilities'))
    excecoes.push('Ativo e passivo circulantes não determinam NCG operacional. Separar contas cíclicas e comparar períodos.');
  if (vistos.has('interestExpense'))
    excecoes.push('Despesas financeiras não representam serviço da dívida. Confirmar juros, amortizações e metodologia do ICSD.');
  if (vistos.has('currentConsumptionTaxAnnual'))
    excecoes.push('Tributos atuais não comprovam base, competência nem elegibilidade de créditos IBS/CBS. Conferir dupla contagem no caixa.');
  return {
    recebidos: vistos.size,
    excecoes,
    classificacao: 'pendencias_de_conciliacao_nao_quantificadas',
    aviso: 'São alertas de possível impacto material, não uma medição de materialidade. Nenhum candidato alimenta automaticamente EBITDA, NCG, caixa, IBS/CBS ou ICSD.'
  };
}