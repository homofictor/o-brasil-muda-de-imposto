import {conciliarRubricasRevisadas} from './mvp-conciliacao-rubricas.js';

// Conciliação restrita ao fechamento aritmético de um único balancete parcial.
// Não anualiza saldos, não infere BP/DRE, não aplica valores à projeção.
function dataValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = new Date(data + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === data;
}

export function conciliarBalanceteIntermediario(rubricas) {
  if (!Array.isArray(rubricas) || rubricas.length === 0 || rubricas.length > 3000)
    throw new Error('Lote de balancete intermediário ausente ou inválido');
  let dataBase = null;
  const limpas = rubricas.map(r => {
    const data = r?.periodo?.dataBase;
    if (!r || r.demonstracao !== 'BALANCETE' || !Number.isInteger(r.exercicio) ||
        r.exercicio < 2000 || r.exercicio > 2100 || !dataValida(data) ||
        !data.startsWith(String(r.exercicio) + '-') || data.endsWith('-12-31'))
      throw new Error('Balancete intermediário com competência inválida');
    if (dataBase !== null && data !== dataBase)
      throw new Error('Datas-base distintas: conciliação intermediária bloqueada');
    dataBase = data;
    // Lista positiva: não transportar CNPJ, nome de arquivo, texto ou observações.
    return {exercicio:r.exercicio, demonstracao:'BALANCETE', grupo:r.grupo,
      valor:r.valor, revisado:r.revisado, documentoRef:r.documentoRef,
      linhaOrigem:r.linhaOrigem};
  });
  const r = conciliarRubricasRevisadas(limpas).exercicios[0];
  const fechado = r.diferencaBalancete !== null && Math.abs(r.diferencaBalancete) <= 0.01;
  return {
    exercicio:r.ano, dataBase,
    status:fechado ? 'fechamento_aritmetico_intermediario' : 'pendente_revisao',
    diferencaBalancete:r.diferencaBalancete,
    materialidade:r.materialidade.balancete,
    ausentes:r.ausentes.filter(chave => chave.startsWith('BALANCETE:')),
    aptoParaParecer:false, aplicadoProjecao:false,
    aviso:'Fechamento aritmético de balancete intermediário, não auditado. Não anualizar saldos nem inferir DRE, BP, NCG, EBITDA, caixa ou ICSD. Conciliar separadamente com demonstrações anuais e revisar antes de qualquer projeção.'
  };
}
