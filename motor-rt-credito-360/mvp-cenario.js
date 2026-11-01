// Adaptador da demonstração. Não infere tratamento jurídico nem armazena documentos.
export const SETORES_MVP = Object.freeze([
  ["comercio", "Comércio"], ["industria", "Indústria"],
  ["servicos", "Serviços"], ["construcao", "Construção civil"],
  ["saude", "Saúde"], ["transporte", "Transporte"],
  ["agronegocio", "Agronegócio"], ["multissetorial", "Empresa multissetorial"]
]);
const CONTAS = ["clientes", "estoques", "fornecedoresOperacionais"];
const numero = (valor, rotulo, negativo = false) => {
  if (typeof valor !== "number" || !Number.isFinite(valor) || (!negativo && valor < 0))
    throw new Error(`${rotulo}: informe um valor numérico válido`);
  return valor;
};
export function premissasSinteticasMVP() {
  return {
    anoBase: 2026, ebitda: 160, aliquotaReferencia: 10,
    capex: 20, impostosResultado: 5, juros: 15, amortizacoes: 25,
    atividades: SETORES_MVP.map(([id, descricao]) => ({
      id, descricao, receitaBase: 100, ibsPercentual: 5, cbsPercentual: 3
    })),
    saldosBase: {clientes: 120, estoques: 90, fornecedoresOperacionais: 100},
    saldosProjetados: {clientes: 140, estoques: 95, fornecedoresOperacionais: 115}
  };
}
export function prepararEntradaMVP(premissas, revisao) {
  if (!revisao || revisao.dre !== true || revisao.ponte !== true || revisao.ncg !== true)
    throw new Error("Confirme separadamente a revisão sintética da DRE, da ponte tributária e da NCG");
  if (!Number.isInteger(premissas?.anoBase) || premissas.anoBase < 2000 || premissas.anoBase > 2098)
    throw new Error("Exercício-base inválido");
  const ano = premissas.anoBase + 1;
  if (!Array.isArray(premissas.atividades) || premissas.atividades.length === 0)
    throw new Error("Informe pelo menos uma atividade");
  const ids = new Set();
  const atividades = premissas.atividades.map(a => {
    if (!SETORES_MVP.some(([id]) => id === a.id) || ids.has(a.id))
      throw new Error("Atividade inválida ou duplicada");
    ids.add(a.id);
    const receitaBase = numero(a.receitaBase, `Receita de ${a.id}`);
    const ibs = numero(a.ibsPercentual, `IBS de ${a.id}`);
    const cbs = numero(a.cbsPercentual, `CBS de ${a.id}`);
    if (ibs > 100 || cbs > 100) throw new Error("Alíquota ilustrativa acima de 100%");
    return {id: a.id, descricao: a.descricao || a.id, receitaBase, crescimento: 0,
      aliquotasValidadas: {ibs: {[ano]: ibs / 100}, cbs: {[ano]: cbs / 100}}};
  });
  const receitaLiquida = atividades.reduce((s, a) => s + a.receitaBase, 0);
  if (!Number.isFinite(receitaLiquida) || receitaLiquida <= 0)
    throw new Error("Receita consolidada inválida");
  const ebitda = numero(premissas.ebitda, "EBITDA", true);
  const aliquotaReferencia = numero(premissas.aliquotaReferencia, "Tributo de referência");
  if (aliquotaReferencia > 100) throw new Error("Alíquota de referência acima de 100%");
  const valores = {};
  for (const campo of ["capex", "impostosResultado", "juros", "amortizacoes"])
    valores[campo] = {[ano]: numero(premissas[campo], campo)};
  const origem = (saldos, periodo) => Object.fromEntries(CONTAS.map((conta, i) => [conta, {
    valor: numero(saldos?.[conta], `${periodo}: ${conta}`),
    demonstracao: "balanco_patrimonial", documentoId: `exemplo-sintetico-${periodo}`, linhaOrigem: i + 1
  }]));
  const saldosBase = origem(premissas.saldosBase, "base");
  const saldosProjetados = origem(premissas.saldosProjetados, "projetado");
  const ncg = s => s.clientes.valor + s.estoques.valor - s.fornecedoresOperacionais.valor;
  const variacao = ncg(saldosProjetados) - ncg(saldosBase);
  if (!Number.isFinite(variacao)) throw new Error("Variação de NCG não finita");
  return {
    dadosFinanceiros: {
      anoBase: premissas.anoBase, anos: 1,
      historico: {exercicio: premissas.anoBase, receitaLiquida, ebitda, revisadoPorAnalista: true},
      atividades, eventosCredito: [], aliquotaReferencia: aliquotaReferencia / 100,
      tratamentoTributario: {referenciaRefletida: false, reformaRefletida: false,
        evidenciaContabil: "DRE sintética: EBITDA declarado antes dos tributos sobre consumo",
        validadoPorAnalista: true},
      ...valores, variacaoNCG: {[ano]: variacao}
    },
    auditoriasNCG: {[ano]: {exercicioBase: premissas.anoBase, exercicioProjetado: ano,
      saldosBase, saldosProjetados,
      evidenciaRevisao: "Referências sintéticas para demonstração, sem documentos reais",
      validadoPorAnalista: true}}
  };
}
export function executarMVP(premissas, revisao, integrador) {
  if (typeof integrador !== "function") throw new Error("Motor financeiro indisponível");
  const entrada = prepararEntradaMVP(premissas, revisao);
  const resultado = integrador(entrada);
  if (resultado?.homologado !== false || resultado?.aptoParaParecer !== false ||
      resultado?.statusAuditoriaNCG !== "conciliada_documentalmente" ||
      !Array.isArray(resultado.projecoes) || resultado.projecoes.length !== 1 ||
      resultado.projecoes[0].statusAuditoriaNCG !== "conciliada_documentalmente")
    throw new Error("Resultado sem controles mínimos de auditoria e não homologação");
  return {...resultado, statusMVP: "simulacao_sintetica_nao_homologada"};
}
