import {conciliarRubricasRevisadas} from './mvp-conciliacao-rubricas.js';

// Contrato restritivo para exercícios ANUAIS completos. Não extrai arquivos.
// Balancetes intermediários exigem outra rotina, sem anualização presumida.
function dataValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = new Date(data + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === data;
}

export function conciliarRubricasAnuaisComCompetencia(rubricas) {
  if (!Array.isArray(rubricas) || rubricas.length === 0 || rubricas.length > 3000)
    throw new Error('Lote anual de rubricas ausente ou inválido');
  const limpas = rubricas.map(r => {
    if (!r || !Number.isInteger(r.exercicio) || r.exercicio < 2000 || r.exercicio > 2100 ||
        !r.periodo || typeof r.periodo !== 'object' || Array.isArray(r.periodo))
      throw new Error('Exercício ou competência documental inválida');
    const ano = String(r.exercicio);
    if (r.demonstracao === 'DRE') {
      if (!dataValida(r.periodo.inicio) || !dataValida(r.periodo.fim) ||
          r.periodo.inicio !== ano + '-01-01' || r.periodo.fim !== ano + '-12-31')
        throw new Error('DRE parcial ou competência divergente: conciliação anual bloqueada');
    } else if (r.demonstracao === 'BP' || r.demonstracao === 'BALANCETE') {
      if (!dataValida(r.periodo.dataBase) || r.periodo.dataBase !== ano + '-12-31')
        throw new Error('BP ou balancete intermediário: conciliação anual bloqueada');
    } else {
      throw new Error('Demonstração desconhecida');
    }
    // Lista positiva: nenhuma identificação empresarial, nome de arquivo ou texto
    // contábil é repassado à conciliação nem aparece no resultado.
    return {
      exercicio: r.exercicio, demonstracao: r.demonstracao, grupo: r.grupo,
      valor: r.valor, revisado: r.revisado,
      documentoRef: r.documentoRef, linhaOrigem: r.linhaOrigem
    };
  });
  const conciliacao = conciliarRubricasRevisadas(limpas);
  return {
    ...conciliacao, tipoCompetencia: 'exercicios_anuais_completos',
    avisoCompetencia: 'Competência anual declarada e validada formalmente, não auditada. Balancetes intermediários e DREs parciais requerem conciliação separada. Nenhum ajuste foi aplicado à projeção.'
  };
}
