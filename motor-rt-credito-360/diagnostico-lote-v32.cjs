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
module.exports = { diagnosticarLoteV32 };
