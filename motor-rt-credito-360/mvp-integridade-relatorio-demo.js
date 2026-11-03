// Guarda de integridade do relatório fictício. Não recebe CNPJ, arquivos ou dados reais.
// Falha de forma fechada antes de exibir tabelas incompletas ou ICSD inconsistente.
const ANOS = Object.freeze(Array.from({length: 8}, (_, i) => 2026 + i));
const IDS = Object.freeze(['favoravel', 'central', 'adverso']);
const finito = n => typeof n === 'number' && Number.isFinite(n);
const perto = (a, b) => Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(a), Math.abs(b));
const falha = () => { throw new Error('Relatório fictício incompleto ou inconsistente; nenhuma análise foi exibida'); };

export function verificarIntegridadeRelatorioFicticio(relatorio, memoria) {
  if (relatorio?.status !== 'exemplo_sintetico_nao_homologado' ||
      memoria?.status !== 'memoria_contabil_sintetica' || memoria.periodo !== 2026 ||
      !Array.isArray(memoria.indicadores) || memoria.indicadores.length < 5 ||
      memoria.indicadores.some(i => !finito(i?.valor)) ||
      !Array.isArray(relatorio.exercicios) ||
      relatorio.exercicios.length !== ANOS.length ||
      relatorio.exercicios.some((ano, i) => ano !== ANOS[i]) ||
      !Array.isArray(relatorio.cenarios) || relatorio.cenarios.length !== IDS.length ||
      !Array.isArray(relatorio.limitacoes) || relatorio.limitacoes.length < 1)
    falha();
  const referencia = new Map();
  for (let k = 0; k < IDS.length; k++) {
    const c = relatorio.cenarios[k];
    if (c?.id !== IDS[k] || !Array.isArray(c.exercicios) || c.exercicios.length !== ANOS.length ||
        !c.resumo || !finito(c.resumo.deltaCaixaAcumulado) ||
        !Array.isArray(c.resumo.anosInsuficiencia)) falha();
    let deltaAcumulado = 0;
    let menorICSD = null;
    const insuficiencia = [];
    for (let i = 0; i < ANOS.length; i++) {
      const p = c.exercicios[i];
      if (p?.ano !== ANOS[i] || !['caixaOriginal', 'caixaAjustado', 'servicoDivida', 'deltaCaixa',
          'ebitdaIncremental', 'ncgIncremental', 'ibsIncremental', 'cbsIncremental']
          .every(campo => finito(p[campo])) || p.servicoDivida < 0 ||
          !perto(p.caixaAjustado, p.caixaOriginal + p.deltaCaixa)) falha();
      if (referencia.has(p.ano)) {
        const base = referencia.get(p.ano);
        if (!perto(base.caixa, p.caixaOriginal) || !perto(base.divida, p.servicoDivida)) falha();
      } else referencia.set(p.ano, {caixa:p.caixaOriginal, divida:p.servicoDivida});
      const esperadoOriginal = p.servicoDivida === 0 ? null : p.caixaOriginal / p.servicoDivida;
      const esperadoAjustado = p.servicoDivida === 0 ? null : p.caixaAjustado / p.servicoDivida;
      if (esperadoOriginal === null ? p.icsdOriginal !== null || p.icsdAjustado !== null :
          !finito(p.icsdOriginal) || !finito(p.icsdAjustado) ||
          !perto(p.icsdOriginal, esperadoOriginal) || !perto(p.icsdAjustado, esperadoAjustado)) falha();
      if (esperadoAjustado !== null)
        menorICSD = menorICSD === null ? esperadoAjustado : Math.min(menorICSD, esperadoAjustado);
      if (p.servicoDivida > 0 && p.caixaAjustado < p.servicoDivida) insuficiencia.push(p.ano);
      deltaAcumulado += p.deltaCaixa;
    }
    if (!perto(c.resumo.deltaCaixaAcumulado, deltaAcumulado) ||
        (menorICSD === null ? c.resumo.menorICSD !== null :
          !finito(c.resumo.menorICSD) || !perto(c.resumo.menorICSD, menorICSD)) ||
        JSON.stringify(c.resumo.anosInsuficiencia) !== JSON.stringify(insuficiencia)) falha();
  }
  return {cenarios:3, exerciciosPorCenario:8, linhas:24, origem:'exemplo_ficticio', aptoParaParecer:false};
}
