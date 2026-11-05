'use strict';
const { atribuirIdentidadesIngestao } = require('./identidade-ingestao.cjs');

// Converte somente metadados da leitura v3.2. Indicadores nao sao lancamentos.
function registrarLeituraV32(arquivos, leituras, gerarId) {
  if (!Array.isArray(arquivos) || !Array.isArray(leituras) || arquivos.length !== leituras.length || !arquivos.length)
    throw new TypeError('leituras_incompativeis');
  const documentos = arquivos.map((arquivo, i) => {
    const leitura = leituras[i];
    if (!arquivo || typeof arquivo.name !== 'string' || !arquivo.name.trim() ||
        !/\.(pdf|csv|xlsx|xls)$/i.test(arquivo.name) ||
        !leitura || typeof leitura !== 'object' || Array.isArray(leitura) ||
        leitura.file !== arquivo.name)
      throw new TypeError('leitura_sem_origem_confiavel');
    return { file: arquivo.name, formato: arquivo.name.split('.').pop().toLowerCase(),
      tipo: typeof leitura.type === 'string' ? leitura.type : 'nao_classificado',
      periodo: leitura.period ?? null, status: 'pendente_conciliacao' };
  });
  return { documentos: atribuirIdentidadesIngestao(documentos, gerarId),
    movimentos: [], aptoParaProjecao: false, motivo: 'movimentos_contabeis_nao_conciliados' };
}
module.exports = { registrarLeituraV32 };
