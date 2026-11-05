'use strict';
const { atribuirIdentidadesIngestao } = require('./identidade-ingestao.cjs');
const { importarMovimentosV32 } = require('./importador-v32-adaptador.cjs');
// Entrada restrita: a identidade e atribuida antes da validacao de movimentos revisados.
function importarComIdentidadeV32(documentos, periodo, gerarId) {
  try {
    const identificados = atribuirIdentidadesIngestao(documentos, gerarId);
    const resultado = importarMovimentosV32(identificados, periodo);
    return { ...resultado, documentos: resultado.valido ? identificados.map(({ idDocumento, file }) => ({ idDocumento, file })) : [] };
  } catch (erro) {
    if (!(erro instanceof TypeError)) throw erro;
    return { valido: false, motivo: erro.message, movimentos: [], documentos: [] };
  }
}
module.exports = { importarComIdentidadeV32 };
