// Invalida confirmações sintéticas quando premissas ou revisões mudam.
// Não substitui autenticação, auditoria documental nem homologação.
export function configurarInvalidacaoRevisaoMVP(documento) {
  const obter = id => documento.getElementById(id);
  const revisoes = ['dre', 'ponte', 'ncg'].map(id => obter('revisao-' + id));
  const resultados = obter('resultados');
  const mensagem = obter('mensagem');
  const invalidar = (alteracaoDePremissas) => {
    const haviaResultado = !resultados.hidden;
    const haviaRevisao = revisoes.some(campo => campo.checked);
    if (alteracaoDePremissas) revisoes.forEach(campo => { campo.checked = false; });
    resultados.hidden = true;
    if (haviaResultado || (alteracaoDePremissas && haviaRevisao)) {
      mensagem.textContent = alteracaoDePremissas
        ? 'Premissas alteradas. Confirme novamente as três revisões antes de calcular.'
        : 'Revisão alterada. Calcule novamente para atualizar os resultados.';
      mensagem.className = 'status error';
    }
  };
  for (const id of ['financeiro', 'atividades', 'ncg']) {
    const secao = obter(id);
    secao.addEventListener('input', () => invalidar(true));
    secao.addEventListener('change', () => invalidar(true));
  }
  revisoes.forEach(campo => campo.addEventListener('change', () => invalidar(false)));
}
