// Camada de elegibilidade para candidatos já aceitos no importador v3.2.
// Não lê arquivos e nunca converte indicadores retrospectivos em FCADS projetado.
const REGRAS = Object.freeze({
  interestExpense: ['Despesa financeira', 'Não equivale a juros mais amortização contratual.'],
  rbt12: ['Receita bruta', 'Não equivale a receita líquida projetada.'],
  currentOperatingMarginPct: ['Margem operacional', 'Não comprova EBITDA projetado.'],
  currentAssets: ['Ativo circulante', 'Não equivale a ativos cíclicos nem à NCG.'],
  currentLiabilities: ['Passivo circulante', 'Não equivale a passivos cíclicos nem à NCG.'],
  currentConsumptionTaxAnnual: ['Tributos atuais', 'Não equivale ao efeito incremental de IBS ou CBS.']
});
export function classificarCandidatosProjecao(candidatos) {
  if (!Array.isArray(candidatos) || candidatos.length > Object.keys(REGRAS).length)
    throw new Error('Candidatos revisados inválidos');
  const vistos = new Set();
  const itens = candidatos.map(c => {
    if (!c || !Object.hasOwn(REGRAS, c.field) || vistos.has(c.field) ||
        typeof c.value !== 'number' || !Number.isFinite(c.value) || Math.abs(c.value) > 1e15 ||
        !(c.periodMonths === null || (Number.isInteger(c.periodMonths) && c.periodMonths >= 1 && c.periodMonths <= 12)))
      throw new Error('Candidato não elegível ou duplicado');
    vistos.add(c.field);
    const [rotulo, limitacao] = REGRAS[c.field];
    return {campo: c.field, rotulo, valor: c.value, meses: c.periodMonths, limitacao};
  });
  return {
    itens,
    podePreencherFluxoOriginal: false,
    podePreencherIBSCBS: false,
    aviso: 'Candidatos retrospectivos não reproduzem a projeção do economista. Caixa, serviço da dívida, ICSD, IBS e CBS exigem fontes e conciliação próprias.'
  };
}
