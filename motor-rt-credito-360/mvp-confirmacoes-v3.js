import {validarRascunhosRubricasV3} from './mvp-rascunhos-v3.js';

// Preparação estritamente local de metadados declarados, sem autenticar revisão.
// Não altera projeções nem envia documentos, nomes, textos de contas ou CNPJ.
const GRUPOS = Object.freeze({
  BP: ['ativo', 'passivo', 'patrimonio'],
  DRE: ['receita_liquida', 'custos', 'despesas'],
  BALANCETE: ['debitos', 'creditos']
});
const ESCALAS = Object.freeze({BRL: 1, MIL_BRL: 1000, MILHOES_BRL: 1000000});
const DESCARTES = new Set(['extracao_incorreta', 'linha_duplicada', 'linha_nao_contabil']);

function dataValida(data) {
  if (typeof data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const d = new Date(data + 'T00:00:00Z');
  return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === data;
}
function validarPeriodo(tipo, ano, periodo) {
  if (!periodo || typeof periodo !== 'object' || Array.isArray(periodo)) return false;
  if (tipo === 'DRE') return dataValida(periodo.inicio) && dataValida(periodo.fim) &&
    periodo.inicio.slice(0, 4) === String(ano) && periodo.fim.slice(0, 4) === String(ano) &&
    periodo.inicio <= periodo.fim;
  return dataValida(periodo.dataBase) && periodo.dataBase.slice(0, 4) === String(ano);
}

export function prepararConfirmacoesRubricasV3(rascunhos, confirmacoes) {
  const base = validarRascunhosRubricasV3(rascunhos);
  if (!Array.isArray(confirmacoes) || confirmacoes.length > base.length)
    throw new Error('Confirmações ausentes ou excedentes');
  const chave = r => r.documentoRef + ':' + r.linhaOrigem;
  const origens = new Map(base.map(r => [chave(r), r]));
  const decisoes = new Map();
  for (const c of confirmacoes) {
    if (!c || typeof c !== 'object' || Array.isArray(c) ||
        typeof c.documentoRef !== 'string' || !Number.isSafeInteger(c.linhaOrigem))
      throw new Error('Identificação de linha inválida');
    const id = chave(c);
    if (!origens.has(id) || decisoes.has(id)) throw new Error('Confirmação sem origem ou duplicada');
    if (c.acao === 'descartar') {
      if (!DESCARTES.has(c.motivo)) throw new Error('Descarte sem justificativa codificada');
      decisoes.set(id, {acao:'descartar'});
      continue;
    }
    if (c.acao !== 'confirmar' || !Number.isInteger(c.exercicio) ||
        c.exercicio < 2000 || c.exercicio > 2100 ||
        !Object.hasOwn(GRUPOS, c.demonstracao) || !GRUPOS[c.demonstracao].includes(c.grupo) ||
        !Object.hasOwn(ESCALAS, c.escala) ||
        !['conforme_documento', 'inverter_confirmado'].includes(c.sinal) ||
        !validarPeriodo(c.demonstracao, c.exercicio, c.periodo))
      throw new Error('Competência, classificação, escala ou sinal não confirmado');
    const r = origens.get(id);
    const fator = c.sinal === 'inverter_confirmado' ? -1 : 1;
    const valorBRL = r.valor * ESCALAS[c.escala] * fator;
    if (!Number.isFinite(valorBRL) || Math.abs(valorBRL) > 1e15)
      throw new Error('Valor convertido fora do limite');
    decisoes.set(id, {acao:'confirmar', rubrica:{
      documentoRef:r.documentoRef, linhaOrigem:r.linhaOrigem, formato:r.formato,
      valorOriginal:r.valor, valorBRL, demonstracao:c.demonstracao, grupo:c.grupo,
      exercicio:c.exercicio, escalaConfirmada:c.escala, sinalConfirmado:c.sinal,
      periodo:c.demonstracao === 'DRE'
        ? {inicio:c.periodo.inicio, fim:c.periodo.fim}
        : {dataBase:c.periodo.dataBase},
      revisado:false, aptoParaConciliacao:false
    }});
  }
  const confirmadas = [], pendencias = [];
  let descartadas = 0;
  for (const r of base) {
    const decisao = decisoes.get(chave(r));
    if (!decisao) pendencias.push({documentoRef:r.documentoRef, linhaOrigem:r.linhaOrigem, motivo:'sem_confirmacao'});
    else if (decisao.acao === 'descartar') descartadas++;
    else {
      confirmadas.push(decisao.rubrica);
      if (decisao.rubrica.valorBRL < 0)
        pendencias.push({documentoRef:r.documentoRef, linhaOrigem:r.linhaOrigem, motivo:'sinal_negativo_exige_tratamento_contabil'});
    }
  }
  return {confirmadas, pendencias, descartadas, totalRascunhos:base.length,
    status:'pendente_revisao_autenticada', aptoParaParecer:false, aplicadoProjecao:false,
    aviso:'Confirmações declarativas, sem autenticação ou critério de materialidade validado. Não equivalem a revisão aprovada nem liberam conciliação ou projeção.'};
}
