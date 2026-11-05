'use strict';
const { registrarLeituraV32 } = require('./ponte-leitura-v32.cjs');

// Recebe metadados de analyseImportDoc (simulador/v3/import.js).
// Nenhum indicador vira lançamento, saldo ou valor conciliado.
function registrarDocumentosAnalisadosV32(arquivos, documentos, gerarId) {
  if (!Array.isArray(arquivos) || !Array.isArray(documentos) ||
      !arquivos.length || arquivos.length !== documentos.length)
    throw new TypeError('documentos_analisados_incompativeis');
  const leituras = documentos.map((doc, i) => {
    // Falhas explícitas de leitura não podem ser tratadas como documentos válidos.
    if (doc && typeof doc === 'object' && !Array.isArray(doc) &&
        (doc.error != null || doc.ok === false || doc.success === false ||
         ['erro', 'falha', 'error', 'failed'].includes(String(doc.status || '').toLowerCase())))
      throw new TypeError('documento_com_falha_de_leitura');
    if (!doc || typeof doc !== 'object' || Array.isArray(doc) ||
        doc.file !== arquivos[i]?.name || typeof doc.type !== 'string' ||
        !doc.type.trim())
      throw new TypeError('documento_analisado_sem_origem');
    return { file: doc.file, type: doc.type, period: doc.period ?? null };
  });
  return registrarLeituraV32(arquivos, leituras, gerarId);
}
module.exports = { registrarDocumentosAnalisadosV32 };
