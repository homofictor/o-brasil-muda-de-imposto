'use strict';

// Diagnóstico local de um lote do leitor v3.2. Não transfere valores,
// nomes de arquivos, CNPJ ou dados pessoais para o resultado.
function diagnosticarLoteV32(arquivos, documentos) {
  if (!Array.isArray(arquivos) || !Array.isArray(documentos) ||
      arquivos.length !== documentos.length)
    throw new TypeError('lote_documental_incompativel');
  const itens = arquivos.map((arquivo, indice) => {
    const doc = documentos[indice];
    if (!arquivo || typeof arquivo.name !== 'string' || !arquivo.name.trim())
      throw new TypeError('arquivo_sem_identidade');
    if (!/\.(pdf|csv|xlsx|xls)$/i.test(arquivo.name.trim()))
      return { indice, estado: 'formato_nao_suportado', requerRevisao: true };
    const status = typeof doc?.status === 'string' ? doc.status.trim().toLowerCase() : '';
    const falha = !doc || typeof doc !== 'object' || Array.isArray(doc) ||
      doc.error != null || doc.ok === false || doc.success === false ||
      ['erro', 'falha', 'error', 'failed'].includes(status);
    if (falha) return { indice, estado: 'falha_leitura', requerRevisao: true };
    if (['pending', 'processing', 'loading', 'queued', 'pendente', 'processando', 'em andamento'].includes(status))
      return { indice, estado: 'leitura_pendente', requerRevisao: true };
    if (doc.file !== arquivo.name || typeof doc.type !== 'string' || !doc.type.trim())
      return { indice, estado: 'origem_inconsistente', requerRevisao: true };
    return { indice, estado: 'lido_nao_conciliado', requerRevisao: false };
  });
  return {
    itens,
    total: itens.length,
    falhas: itens.filter(x => x.requerRevisao).length,
    aptoParaProjecao: false
  };
}

/**
 * Adapta o estado do importador v3.2, que pode omitir documentos ainda na fila.
 * Nomes repetidos sao associados em ordem; nunca se reutiliza uma leitura.
 * O resultado e somente diagnostico: nao libera projecoes.
 */
function diagnosticarEstadoImportacaoV32(estado) {
  if (!estado || !Array.isArray(estado.files) || !Array.isArray(estado.docs))
    throw new TypeError('estado_importacao_invalido');
  const filas = new Map();
  for (const doc of estado.docs) {
    if (!doc || typeof doc.file !== 'string')
      throw new TypeError('documento_sem_origem');
    const fila = filas.get(doc.file) || [];
    fila.push(doc);
    filas.set(doc.file, fila);
  }
  const documentos = estado.files.map(arquivo => {
    const fila = filas.get(arquivo?.name);
    if (fila?.length) return fila.shift();
    const erro = arquivo?.error;
    if (erro != null) return { file: arquivo.name, type: 'Falha de leitura', status: 'erro', error: String(erro) };
    return { file: arquivo?.name, type: 'Pendente', status: 'pending' };
  });
  // Leituras excedentes indicam lote inconsistente e nao podem ser ignoradas.
  if ([...filas.values()].some(fila => fila.length))
    throw new TypeError('documentos_sem_arquivo_correspondente');
  return diagnosticarLoteV32(estado.files, documentos);
}

module.exports = { diagnosticarLoteV32, diagnosticarEstadoImportacaoV32 };
