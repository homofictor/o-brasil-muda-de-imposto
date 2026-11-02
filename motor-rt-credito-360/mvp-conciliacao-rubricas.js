// Contrato interno para rubricas explicitamente classificadas e revisadas.
// Não lê arquivos, não infere contas, não transporta identificadores nem alimenta projeções.
const GRUPOS = Object.freeze({
  BP: ['ativo', 'passivo', 'patrimonio'],
  DRE: ['receita_liquida', 'custos', 'despesas'],
  BALANCETE: ['debitos', 'creditos']
});
const CHAVES = Object.freeze(Object.entries(GRUPOS).flatMap(([d, grupos]) => grupos.map(g => d + ':' + g)));

export function conciliarRubricasRevisadas(rubricas) {
  if (!Array.isArray(rubricas) || rubricas.length > 3000)
    throw new Error('Lote de rubricas inválido');
  const anos = new Map();
  const origens = new Set();
  for (const r of rubricas) {
    if (!r || !Number.isInteger(r.exercicio) || r.exercicio < 2000 || r.exercicio > 2100 ||
        !Object.hasOwn(GRUPOS, r.demonstracao) || !GRUPOS[r.demonstracao].includes(r.grupo) ||
        typeof r.valor !== 'number' || !Number.isFinite(r.valor) || r.valor < 0 || r.valor > 1e15 ||
        r.revisado !== true || typeof r.documentoRef !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,64}$/.test(r.documentoRef) ||
        !Number.isSafeInteger(r.linhaOrigem) || r.linhaOrigem < 1)
      throw new Error('Rubrica sem classificação, revisão ou origem válida');
    const origem = `${r.exercicio}:${r.documentoRef}:${r.linhaOrigem}`;
    if (origens.has(origem)) throw new Error('Origem documental duplicada no exercício');
    origens.add(origem);
    if (!anos.has(r.exercicio)) anos.set(r.exercicio, new Map());
    const grupo = r.demonstracao + ':' + r.grupo;
    const valores = anos.get(r.exercicio);
    const total = (valores.get(grupo) ?? 0) + r.valor;
    if (!Number.isFinite(total) || total > 1e15) throw new Error('Total contábil fora do limite');
    valores.set(grupo, total);
  }
  const exercicios = [...anos.entries()].sort(([a], [b]) => a - b).map(([ano, valores]) => {
    const ausentes = CHAVES.filter(chave => !valores.has(chave));
    const saldo = chave => valores.get(chave) ?? 0;
    // Uma rubrica ausente não é um saldo contábil de zero.
    const completo = demonstracao => GRUPOS[demonstracao].every(grupo => valores.has(demonstracao + ':' + grupo));
    const diferencaBP = completo('BP') ? saldo('BP:ativo') - saldo('BP:passivo') - saldo('BP:patrimonio') : null;
    const diferencaBalancete = completo('BALANCETE') ? saldo('BALANCETE:debitos') - saldo('BALANCETE:creditos') : null;
    const diferencaDRE = completo('DRE') ? saldo('DRE:receita_liquida') - saldo('DRE:custos') - saldo('DRE:despesas') : null;
    const conciliado = ausentes.length === 0 &&
      Math.abs(diferencaBP) <= 0.01 && Math.abs(diferencaBalancete) <= 0.01;
    // Quantificação descritiva, sem presumir limites de materialidade.
    // Denominadores ausentes ou iguais a zero não produzem percentual fictício.
    const medir = (diferenca, chaves, bases) => {
      if (chaves.some(chave => !valores.has(chave)))
        return {valorAbsoluto: null, percentualDaBase: null, baseComparacao: null};
      const denominador = Math.max(...bases);
      return {valorAbsoluto: Math.abs(diferenca),
        percentualDaBase: denominador > 0 ? Math.abs(diferenca) / denominador * 100 : null,
        baseComparacao: denominador};
    };
    const materialidade = {
      status: 'sem_limite_de_materialidade_validado',
      bp: medir(diferencaBP, ['BP:ativo','BP:passivo','BP:patrimonio'],
        [saldo('BP:ativo'), saldo('BP:passivo') + saldo('BP:patrimonio')]),
      balancete: medir(diferencaBalancete, ['BALANCETE:debitos','BALANCETE:creditos'],
        [saldo('BALANCETE:debitos'), saldo('BALANCETE:creditos')])
    };
    return {ano, status: conciliado ? 'fechamento_aritmetico' : 'pendente_revisao',
      ausentes, diferencaBP, diferencaBalancete,
      resultadoDREIlustrativo: diferencaDRE, materialidade};
  });
  return {exercicios, aptoParaParecer: false, aplicadoProjecao: false,
    aviso: 'Fechamento apenas aritmético. Materialidade ainda sem limite validado. Não comprova competência, EBITDA, NCG, DFC, serviço da dívida, ICSD nem créditos IBS/CBS.'};
}
