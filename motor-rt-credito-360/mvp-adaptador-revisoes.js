import {conciliarRubricasAnuaisComCompetencia} from './mvp-competencia-rubricas.js';

// Ponte restritiva entre revisão aprovada e conciliação anual.
// Não transporta nomes, CNPJ, documentoId, texto da conta nem identidade do analista.
const GRUPOS = Object.freeze({
  BP: ['ativo', 'passivo', 'patrimonio'],
  DRE: ['receita_liquida', 'custos', 'despesas'],
  BALANCETE: ['debitos', 'creditos']
});

export function conciliarLotesContabeisAprovados(lotes) {
  if (!Array.isArray(lotes) || !lotes.length || lotes.length > 30)
    throw new Error('Lotes de revisão ausentes ou inválidos');
  const rubricas = [];
  for (const lote of lotes) {
    const r = lote?.revisao;
    if (!r || r.status !== 'revisado' || r.aptoParaProjecao !== true ||
        !Array.isArray(r.erros) || r.erros.length ||
        !r.aprovacao?.analistaId || !Array.isArray(r.registros) || !r.registros.length ||
        !Object.hasOwn(GRUPOS, r.demonstracao) ||
        !Array.isArray(lote.classificacoes) || lote.classificacoes.length !== r.registros.length ||
        typeof lote.documentoRef !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(lote.documentoRef))
      throw new Error('Revisão não aprovada ou classificação incompleta');
    const indices = new Set();
    for (const c of lote.classificacoes) {
      if (!c || !Number.isSafeInteger(c.indice) || c.indice < 0 ||
          c.indice >= r.registros.length || indices.has(c.indice) ||
          !GRUPOS[r.demonstracao].includes(c.grupo) ||
          !Number.isSafeInteger(c.linhaOrigem) || c.linhaOrigem < 1)
        throw new Error('Classificação ou linha documental inválida');
      indices.add(c.indice);
      const registro = r.registros[c.indice];
      if (!registro || registro.revisadoPorAnalista !== true ||
          registro.unidade !== 'BRL' || typeof registro.valor !== 'number' ||
          !Number.isFinite(registro.valor) || registro.valor < 0 || registro.valor > 1e15)
        throw new Error('Rubrica não revisada, com escala ou sinal não confirmado');
      rubricas.push({
        exercicio: r.exercicio, demonstracao: r.demonstracao, grupo: c.grupo,
        valor: registro.valor, revisado: true,
        documentoRef: lote.documentoRef, linhaOrigem: c.linhaOrigem,
        periodo: lote.periodo
      });
      if (rubricas.length > 3000) throw new Error('Limite de rubricas excedido');
    }
  }
  const resultado = conciliarRubricasAnuaisComCompetencia(rubricas);
  return {...resultado, origem: 'revisoes_aprovadas_com_classificacao_explicita',
    avisoAdaptador: 'Revisão e classificação declaradas. Não comprova extração automática, materialidade, auditoria documental ou adequação para parecer. Nenhuma projeção foi alterada.'};
}
