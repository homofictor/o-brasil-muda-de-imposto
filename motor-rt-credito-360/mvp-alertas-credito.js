// Classificação indicativa da folga de pagamento em dois cenários sintéticos.
// Não atribui causalidade jurídica à RT nem substitui análise de crédito.
const EPS = 1e-9;
const numero = (v, campo, ano) => {
  if (typeof v !== 'number' || !Number.isFinite(v))
    throw new Error(`${ano}: ${campo} inválido`);
  return v;
};

export function analisarFolgaCredito(projecao) {
  if (!Array.isArray(projecao) || !projecao.length)
    throw new Error('Projeção financeira ausente');
  const anos = new Set();
  const exercicios = projecao.map(linha => {
    const ano = linha?.ano;
    if (!Number.isInteger(ano) || anos.has(ano))
      throw new Error('Ano inválido ou repetido na projeção');
    anos.add(ano);
    const divida = numero(linha.servicoDivida, 'serviço da dívida', ano);
    const original = numero(linha.caixaOriginal, 'caixa original', ano);
    const reforma = numero(linha.caixaReforma, 'caixa ajustado', ano);
    if (divida < 0) throw new Error(`${ano}: serviço da dívida negativo`);
    const folgaOriginal = original - divida;
    const folgaReforma = reforma - divida;
    const semDivida = divida === 0;
    const deficitOriginal = !semDivida && folgaOriginal < -EPS;
    const deficitReforma = !semDivida && folgaReforma < -EPS;
    const novoDeficit = !deficitOriginal && deficitReforma;
    const deficitRevertido = deficitOriginal && !deficitReforma;
    let alerta;
    if (semDivida) alerta = 'Sem serviço da dívida: cobertura não aplicável';
    else if (novoDeficit) alerta = 'Cobertura insuficiente apenas no cenário ajustado';
    else if (deficitRevertido) alerta = 'Cobertura recuperada no cenário ajustado';
    else if (deficitOriginal && deficitReforma) alerta = 'Cobertura insuficiente já na referência';
    else if (folgaReforma < folgaOriginal - EPS) alerta = 'Folga reduzida, mas cobertura preservada';
    else if (folgaReforma > folgaOriginal + EPS) alerta = 'Folga ampliada';
    else alerta = 'Folga inalterada';
    return {ano, folgaOriginal, folgaReforma, variacaoFolga: folgaReforma - folgaOriginal,
      deficitOriginal, deficitReforma, novoDeficit, deficitRevertido, alerta};
  });
  return {
    exercicios,
    anosDeficitReferencia: exercicios.filter(x => x.deficitOriginal).map(x => x.ano),
    anosNovosDeficits: exercicios.filter(x => x.novoDeficit).map(x => x.ano),
    anosDeficitsRevertidos: exercicios.filter(x => x.deficitRevertido).map(x => x.ano),
    aviso: 'Classificação indicativa com ajustes hipotéticos, sem atribuição causal comprovada à Reforma Tributária.'
  };
}
