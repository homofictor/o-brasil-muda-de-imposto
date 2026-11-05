'use strict';
// Identificador explicito e estavel atribuido na ingestao, sem usar nome de arquivo como chave.
function validarIdentidadesDocumentais(documentos) {
  if (!Array.isArray(documentos) || documentos.length === 0)
    return { valido: false, motivo: 'documentos_ausentes' };
  const vistos = new Set();
  for (const doc of documentos) {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc) ||
        typeof doc.idDocumento !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(doc.idDocumento))
      return { valido: false, motivo: 'identificador_documental_invalido' };
    if (vistos.has(doc.idDocumento))
      return { valido: false, motivo: 'identificador_documental_duplicado' };
    vistos.add(doc.idDocumento);
  }
  return { valido: true, motivo: null };
}
module.exports = { validarIdentidadesDocumentais };
