'use strict';
// Ponte restritiva entre a saída documental do Simulador RT v3.2 e o contrato
// de movimentos auditáveis. Sugestões de indicadores NÃO são razão contábil.
const { prepararMovimentosImportados } = require('./importador-ponte.cjs');
function importarMovimentosV32(documentos, { inicio, fim } = {}) {
  if (!Array.isArray(documentos) || !documentos.length)
    return { valido: false, motivo: 'documentos_ausentes', movimentos: [] };
  const registros = [];
  const origens = new Set();
  for (const doc of documentos) {
    if (!doc || typeof doc.file !== 'string' || !doc.file.trim())
      return { valido: false, motivo: 'origem_documental_ausente', movimentos: [] };
    const origem = doc.file.trim();
    if (origens.has(origem))
      return { valido: false, motivo: 'origem_documental_duplicada', movimentos: [] };
    origens.add(origem);
    // analyseImportDoc produz candidates e indicadores, mas não lançamentos
    // com código, competência e débito/crédito auditáveis.
    if (!Array.isArray(doc.movimentosRevisados) || !doc.movimentosRevisados.length)
      return { valido: false, motivo: 'movimentos_revisados_ausentes', movimentos: [] };
    for (const m of doc.movimentosRevisados) {
      if (!m || typeof m !== 'object' || Array.isArray(m) || (m.documentoOrigem != null && (typeof m.documentoOrigem !== 'string' || m.documentoOrigem.trim() !== origem)))
        return { valido: false, motivo: 'origem_inconsistente', movimentos: [] };
      registros.push({ ...m, documentoOrigem: origem });
    }
  }
  return prepararMovimentosImportados(registros, { inicio, fim });
}
module.exports = { importarMovimentosV32 };
