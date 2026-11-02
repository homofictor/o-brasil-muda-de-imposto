// Exemplo contábil inteiramente fictício, sem vínculo com CNPJ ou documentos importados.
// Balancete antes do encerramento: receitas/custos/despesas são contas de resultado.
const CONTAS = Object.freeze([
  {grupo: 'ativo', rubrica: 'Caixa e equivalentes', valor: 120},
  {grupo: 'ativo', rubrica: 'Clientes', valor: 200},
  {grupo: 'ativo', rubrica: 'Estoques', valor: 180},
  {grupo: 'ativo', rubrica: 'Imobilizado', valor: 560},
  {grupo: 'passivo', rubrica: 'Fornecedores operacionais', valor: 150},
  {grupo: 'passivo', rubrica: 'Empréstimos e outras obrigações', valor: 490},
  {grupo: 'patrimonio', rubrica: 'Patrimônio após distribuições, antes do resultado', valor: 260},
  {grupo: 'receita', rubrica: 'Receita líquida', valor: 800},
  {grupo: 'custo', rubrica: 'Custos operacionais', valor: 480},
  {grupo: 'despesa', rubrica: 'Despesas operacionais', valor: 160}
]);
const BASE = Object.freeze({ativo: 1000, passivo: 600, patrimonio: 400,
  clientes: 190, estoques: 170, fornecedores: 140, distribuicoes: 140});
const soma = grupo => CONTAS.filter(c => c.grupo === grupo).reduce((t, c) => t + c.valor, 0);

export function conciliarExemploContabil() {
  const ativo = soma('ativo'), passivo = soma('passivo');
  const receita = soma('receita'), custos = soma('custo'), despesas = soma('despesa');
  const lucro = receita - custos - despesas;
  const patrimonio = soma('patrimonio') + lucro;
  const debitos = ativo + custos + despesas;
  const creditos = passivo + soma('patrimonio') + receita;
  const patrimonioEsperado = BASE.patrimonio - BASE.distribuicoes + lucro;
  const ncgAnterior = BASE.clientes + BASE.estoques - BASE.fornecedores;
  const ncgAtual = 200 + 180 - 150;
  const divergencias = [debitos - creditos, ativo - passivo - patrimonio,
    patrimonio - patrimonioEsperado, BASE.ativo - BASE.passivo - BASE.patrimonio];
  if (divergencias.some(d => !Number.isFinite(d) || Math.abs(d) > 0.01))
    throw new Error('Exemplo fictício inconsistente: conciliação contábil falhou');
  return {
    status: 'conciliacao_aritmetica_sintetica', periodo: 2026,
    balancete: {debitos, creditos, diferenca: debitos - creditos},
    bp: {ativo, passivo, patrimonio, diferenca: ativo - passivo - patrimonio},
    dre: {receitaLiquida: receita, custos, despesas, ebitdaIlustrativo: lucro},
    patrimonio: {anterior: BASE.patrimonio, distribuicoes: BASE.distribuicoes,
      resultado: lucro, final: patrimonio},
    ncg: {anterior: ncgAnterior, atual: ncgAtual, variacao: ncgAtual - ncgAnterior},
    limites: 'DRE sem depreciação, resultado financeiro e tributos por simplificação. NCG operacional ilustrativa. Não há DFC nem conciliação com FCADS ou projeção do economista. Nenhum dado real foi importado.'
  };
}
