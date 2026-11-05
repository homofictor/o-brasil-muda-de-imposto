'use strict';
// Adaptador restritivo: identidade de ingestao, nao nome de arquivo, vincula a evidencia.
const { prepararMovimentosImportados } = require('./importador-ponte.cjs');
const { validarIdentidadesDocumentais } = require('./identidade-documental.cjs');
function importarMovimentosV32(documentos, { inicio, fim } = {}) {
  const identidade = validarIdentidadesDocumentais(documentos);
  if (!identidade.valido)
    return { valido: false, motivo: identidade.motivo, movimentos: [] };
  const registros = [];
  for (const doc of documentos) {
    if (typeof doc.file !== 'string' || !doc.file.trim())
      return { valido: false, motivo: 'origem_documental_ausente', movimentos: [] };
    if (!Array.isArray(doc.movimentosRevisados) || !doc.movimentosRevisados.length)
      return { valido: false, motivo: 'movimentos_revisados_ausentes', movimentos: [] };
    for (const m of doc.movimentosRevisados) {
      if (!m || typeof m !== 'object' || Array.isArray(m) ||
          (m.documentoOrigem != null && (typeof m.documentoOrigem !== 'string' || m.documentoOrigem !== doc.idDocumento)))
        return { valido: false, motivo: 'origem_inconsistente', movimentos: [] };
      registros.push({ ...m, documentoOrigem: doc.idDocumento });
    }
  }
  return prepararMovimentosImportados(registros, { inicio, fim });
}
module.exports = { importarMovimentosV32 };
