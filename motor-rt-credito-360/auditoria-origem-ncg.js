/**
 * Conciliação documental da NCG operacional em dois balanços consecutivos.
 * Não infere contas, não substitui a DFC e não altera o motor de projeção.
 * As evidências são referências, não documentos armazenados neste módulo.
 */
const CONTAS = ["clientes", "estoques", "fornecedoresOperacionais"];

export function auditarOrigemNCG({
  exercicioBase, exercicioProjetado, saldosBase, saldosProjetados,
  variacaoInformada, evidenciaRevisao = "", validadoPorAnalista = false,
  tolerancia = 0.01
}) {
  if (!Number.isInteger(exercicioBase) ||
      exercicioProjetado !== exercicioBase + 1 ||
      !Number.isFinite(variacaoInformada) ||
      !Number.isFinite(tolerancia) || tolerancia < 0 || tolerancia > 0.01) {
    throw new Error("Exercícios, variação de NCG ou tolerância inválidos");
  }
  const pendencias = [];
  const extrair = (saldos, rotulo) => {
    const valores = {};
    const origensUsadas = new Set();
    for (const conta of CONTAS) {
      const origem = saldos?.[conta];
      if (!origem || !Number.isFinite(origem.valor) || origem.valor < 0 ||
          origem.demonstracao !== "balanco_patrimonial" ||
          typeof origem.documentoId !== "string" || !origem.documentoId.trim() ||
          !Number.isInteger(origem.linhaOrigem) || origem.linhaOrigem < 1) {
        pendencias.push(`${rotulo}: ${conta} sem saldo ou origem documental válida`);
      } else {
        // A mesma linha do documento não pode justificar duas contas no período.
        const chaveOrigem = JSON.stringify([origem.documentoId.trim(), origem.linhaOrigem]);
        if (origensUsadas.has(chaveOrigem)) {
          pendencias.push(`${rotulo}: ${conta} reutiliza linha documental de outra conta`);
        } else {
          origensUsadas.add(chaveOrigem);
          valores[conta] = origem.valor;
        }
      }
    }
    if (!CONTAS.every(conta => Object.hasOwn(valores, conta))) return null;
    const ncg = valores.clientes + valores.estoques - valores.fornecedoresOperacionais;
    if (!Number.isFinite(ncg)) throw new Error(`${rotulo}: NCG calculada não finita`);
    return {...valores, ncg};
  };
  const base = extrair(saldosBase, "base");
  const projetado = extrair(saldosProjetados, "projetado");
  const variacaoCalculada = base && projetado ? projetado.ncg - base.ncg : null;
  if (variacaoCalculada !== null && !Number.isFinite(variacaoCalculada))
    throw new Error("Variação calculada de NCG não finita");
  const diferenca = variacaoCalculada === null ? null : variacaoCalculada - variacaoInformada;
  if (diferenca !== null && !Number.isFinite(diferenca))
    throw new Error("Diferença de NCG não finita");
  const conciliado = diferenca !== null && Math.abs(diferenca) <= tolerancia;
  if (diferenca !== null && !conciliado) pendencias.push("Variação informada diverge dos balanços");
  if (validadoPorAnalista !== true ||
      typeof evidenciaRevisao !== "string" || !evidenciaRevisao.trim()) {
    pendencias.push("Revisão documental do analista não comprovada");
  }
  return {
    exercicioBase, exercicioProjetado, base, projetado,
    variacaoInformada, variacaoCalculada, diferenca, conciliado,
    pendencias, status: pendencias.length ? "pendente_revisao" : "conciliado_revisado",
    // Mesmo consumida pela entrada auditada, esta revisão não autoriza parecer.
    aptoParaParecer: false
  };
}
