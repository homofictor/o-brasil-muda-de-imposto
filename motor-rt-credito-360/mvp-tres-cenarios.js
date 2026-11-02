import {exemploSinteticoEconomista, compararProjecaoEconomista} from './mvp-ponte-economista.js';

const AJUSTES = Object.freeze([
  'ajusteEBITDA', 'ajusteNCG', 'ajusteCAPEX', 'ajusteIR',
  'ajusteIBS', 'ajusteCBS', 'ajusteOutros'
]);
const REVISAO_DEMONSTRATIVA = Object.freeze({
  projecaoOriginal: true, ponteTributaria: true, semDuplaContagem: true
});
const CONFIGURACOES = Object.freeze([
  {id: 'favoravel', titulo: 'Sensibilidade favorável', fator: 0.5},
  {id: 'central', titulo: 'Hipótese central', fator: 1},
  {id: 'adverso', titulo: 'Sensibilidade adversa', fator: 1.5}
]);

/** Demonstração inteiramente fictícia, sem inferência legal, setorial ou documental. */
export function gerarTresCenariosSinteticos() {
  const original = exemploSinteticoEconomista();
  if (original.length !== 8 || original.some((l, i) => l.ano !== 2026 + i))
    throw new Error('Exemplo de referência incompleto');
  const cenarios = CONFIGURACOES.map(config => {
    const linhas = original.map(linha => {
      const ajustada = {...linha};
      for (const campo of AJUSTES) ajustada[campo] = linha[campo] * config.fator;
      return ajustada;
    });
    const resultado = compararProjecaoEconomista(linhas, REVISAO_DEMONSTRATIVA);
    if (resultado.status !== 'simulacao_sintetica_nao_homologada' ||
        resultado.referenciasConciliadas !== 8 ||
        resultado.projecao.some((p, i) => p.caixaOriginal !== original[i].caixaOriginal ||
          p.servicoDivida !== original[i].servicoDivida || p.ano !== original[i].ano))
      throw new Error('Referência do economista não conciliada');
    return {
      id: config.id, titulo: config.titulo, fatorHipotetico: config.fator,
      resumo: {
        menorICSD: resultado.menorICSDReforma,
        deltaCaixaAcumulado: resultado.deltaCaixaAcumulado,
        anosInsuficiencia: resultado.anosInsuficiencia
      },
      exercicios: resultado.projecao.map(p => ({
        ano: p.ano, ebitdaIncremental: p.ajusteEBITDA, ncgIncremental: p.ajusteNCG,
        ibsIncremental: p.ajusteIBS, cbsIncremental: p.ajusteCBS,
        caixaOriginal: p.caixaOriginal, caixaAjustado: p.caixaReforma,
        servicoDivida: p.servicoDivida, icsdOriginal: p.icsdOriginal,
        icsdAjustado: p.icsdReforma, deltaCaixa: p.deltaCaixa
      }))
    };
  });
  return {
    status: 'exemplo_sintetico_nao_homologado',
    exercicios: original.map(l => l.ano),
    cenarios,
    limitacoes: [
      'Empresa, demonstrações e projeção são inteiramente fictícias, sem ligação com CNPJ consultado ou arquivos importados.',
      'Fatores 0,5x, 1x e 1,5x são sensibilidades matemáticas arbitradas para teste, não alíquotas nem estimativas setoriais.',
      'IBS e CBS exibem somente efeitos incrementais hipotéticos de caixa, não apuração legal nem créditos elegíveis.',
      'A transição 2027 a 2033, repasse de preços, locadoras e efeitos na DRE não foram modelados juridicamente.',
      'ICSD aritmético não substitui FCADS contratual; resultado não constitui parecer de crédito.'
    ]
  };
}
