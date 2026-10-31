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
      !Number.isFinite(tolerancia) || tolerancia < 0) {
    throw new Error("Exercícios, variação de NCG ou tolerância inválidos");
  }
  const pendencias = [];
  const extrair = (saldos, rotulo) => {
    const valores = {};
    for (const conta of CONTAS) {
      const origem = saldos?.[conta];
      if (!origem || !Number.isFinite(origem.valor) || origem.valor < 0 ||
          origem.demonstracao !== "balanco_patrimonial" ||
          typeof origem.documentoId !== "string" || !origem.documentoId.trim() ||
          !Number.isInteger(origem.linhaOrigem) || origem.linhaOrigem < 1) {
        pendencias.push(`${rotulo}: ${conta} sem saldo ou origem documental válida`);
      } else {
        valores[conta] = origem.valor;
      }
    }
    return CONTAS.every(conta => Object.hasOwn(valores, conta)) ? {
      ...valores,
      ncg: valores.clientes + valores.estoques - valores.fornecedoresOperacionais
    } : null;
  };
  const base = extrair(saldosBase, "base");
  const projetado = extrair(saldosProjetados, "projetado");
  const variacaoCalculada = base && projetado ? projetado.ncg - base.ncg : null;
  const diferenca = variacaoCalculada === null ? null : variacaoCalculada - variacaoInformada;
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
    // A ponte de caixa ainda não consome esta auditoria; não autoriza parecer.
    aptoParaParecer: false
  };
}
