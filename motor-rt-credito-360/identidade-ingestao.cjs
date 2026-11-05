'use strict';
// Identidade efemera de ingestao; nao autentica o documento.
function atribuirIdentidadesIngestao(documentos, gerarId = () => globalThis.crypto.randomUUID()) {
  if (!Array.isArray(documentos) || documentos.length === 0) throw new TypeError('documentos_ausentes');
  const vistos = new Set();
  return documentos.map(doc => {
    if (!doc || typeof doc !== 'object' || Array.isArray(doc) || typeof doc.file !== 'string' || !doc.file.trim())
      throw new TypeError('origem_documental_ausente');
    if (doc.idDocumento != null) throw new TypeError('identificador_preexistente');
    const idDocumento = gerarId();
    if (typeof idDocumento !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/.test(idDocumento))
      throw new TypeError('identificador_documental_invalido');
    if (vistos.has(idDocumento)) throw new TypeError('identificador_documental_duplicado');
    vistos.add(idDocumento);
    return { ...doc, idDocumento };
  });
}
module.exports = { atribuirIdentidadesIngestao };
