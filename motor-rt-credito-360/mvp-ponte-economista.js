// Ponte incremental: preserva a projeção original do economista.
// Valores sintéticos. Não calcula a incidência legal de IBS/CBS nem valida FCADS contratual.
const CAMPOS = [
  'caixaOriginal', 'servicoDivida', 'ajusteEBITDA', 'ajusteNCG',
  'ajusteCAPEX', 'ajusteIR', 'ajusteIBS', 'ajusteCBS', 'ajusteOutros'
];
const verificarNumero = (valor, nome) => {
  if (typeof valor !== 'number' || !Number.isFinite(valor))
    throw new Error(`${nome}: valor numérico finito obrigatório`);
  return valor;
};
export function exemploSinteticoEconomista() {
  return Array.from({length: 8}, (_, i) => ({
    ano: 2026 + i, caixaOriginal: 70 + 3 * i, servicoDivida: 40,
    icsdConferido: (70 + 3 * i) / 40,
    ajusteEBITDA: -(0.5 + 1.4 * i), ajusteNCG: 0.2 + 0.5 * i,
    ajusteCAPEX: 0, ajusteIR: -(0.1 + 0.2 * i),
    ajusteIBS: -(0.2 + 0.3 * i), ajusteCBS: -(0.1 + 0.2 * i),
    ajusteOutros: 0
  }));
}
export function compararProjecaoEconomista(linhas, revisao) {
  if (revisao?.projecaoOriginal !== true || revisao?.ponteTributaria !== true ||
      revisao?.semDuplaContagem !== true)
    throw new Error('Exija revisão da projeção original, da ponte tributária e da ausência de dupla contagem');
  if (!Array.isArray(linhas) || linhas.length === 0 || linhas.length > 8)
    throw new Error('Informe de um a oito exercícios entre 2026 e 2033');
  const anos = new Set();
  const resultados = linhas.map((linha, i) => {
    if (!Number.isInteger(linha?.ano) || linha.ano < 2026 || linha.ano > 2033 ||
        anos.has(linha.ano) || (i > 0 && linha.ano <= linhas[i - 1].ano))
      throw new Error('Exercícios inválidos, repetidos ou fora de ordem');
    anos.add(linha.ano);
    const valores = Object.fromEntries(CAMPOS.map(c => [c, verificarNumero(linha[c], `${linha.ano} ${c}`)]));
    if (valores.servicoDivida < 0) throw new Error('Serviço da dívida não pode ser negativo');
    // Ajustes IBS/CBS são apenas efeitos incrementais de caixa NÃO incluídos no EBITDA.
    // AjusteNCG e ajusteCAPEX positivos consomem caixa; ajusteIR positivo é maior desembolso.
    const deltaCaixa = valores.ajusteEBITDA - valores.ajusteNCG - valores.ajusteCAPEX -
      valores.ajusteIR + valores.ajusteIBS + valores.ajusteCBS + valores.ajusteOutros;
    const caixaReforma = valores.caixaOriginal + deltaCaixa;
    const icsdOriginal = valores.servicoDivida === 0 ? null : valores.caixaOriginal / valores.servicoDivida;
    const icsdReforma = valores.servicoDivida === 0 ? null : caixaReforma / valores.servicoDivida;
    // Impede Infinity/NaN em contas intermediárias, mesmo com entradas individualmente finitas.
    for (const [campo, valor] of Object.entries({deltaCaixa, caixaReforma, icsdOriginal, icsdReforma})) {
      if (valor !== null && !Number.isFinite(valor))
        throw new Error(`${linha.ano}: ${campo} não finito após o cálculo`);
    }
    // Conciliação independente com o ICSD apresentado na projeção do economista.
    // Não valida FCADS, fórmulas de origem nem a exatidão do caixa informado.
    if (valores.servicoDivida === 0) {
      if (linha.icsdConferido !== null)
        throw new Error(`${linha.ano}: sem serviço da dívida, ICSD da planilha deve ficar vazio`);
    } else {
      const informado = verificarNumero(linha.icsdConferido, `${linha.ano} ICSD da planilha`);
      if (Math.abs(informado - icsdOriginal) > 0.01 + 1e-10)
        throw new Error(`${linha.ano}: ICSD da planilha (${informado}) não concilia com caixa/serviço (${icsdOriginal.toFixed(4)})`);
    }
    return {
      ano: linha.ano, ...valores, icsdConferido: linha.icsdConferido, deltaCaixa, caixaReforma, icsdOriginal, icsdReforma,
      insuficienciaReforma: valores.servicoDivida > 0 && caixaReforma < valores.servicoDivida,
      observacao: valores.servicoDivida === 0 ? 'Sem serviço da dívida: ICSD indisponível' : ''
    };
  });
  const deltaCaixaAcumulado = resultados.reduce((s, a) => s + a.deltaCaixa, 0);
  if (!Number.isFinite(deltaCaixaAcumulado))
    throw new Error('Variação acumulada de caixa não finita após o cálculo');
  return {
    status: 'simulacao_sintetica_nao_homologada',
    referenciasConciliadas: resultados.length,
    toleranciaICSDReferencia: 0.01,
    projecao: resultados,
    deltaCaixaAcumulado,
    anosInsuficiencia: resultados.filter(a => a.insuficienciaReforma).map(a => a.ano),
    menorICSDReforma: resultados.reduce((min, a) => a.icsdReforma === null ? min :
      (min === null ? a.icsdReforma : Math.min(min, a.icsdReforma)), null),
    ressalvas: [
      'O ICSD informado foi conciliado aritmeticamente com caixa e serviço da dívida (tolerância 0,01x), sem auditar a planilha.',
      'A projeção original é preservada e não foi auditada.',
      'IBS/CBS informados são efeitos incrementais de caixa, não tributos brutos.',
      'A ponte não calcula regras legais, créditos elegíveis nem transição tributária.',
      'ICSD indicativo, sujeito à definição de FCADS e covenants do contrato.'
    ]
  };
}
