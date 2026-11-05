const test = require('node:test');
const assert = require('node:assert/strict');
const { diagnosticarLoteV32 } = require('./diagnostico-lote-v32.cjs');

for (const status of ['pending', ' PROCESSING ', 'loading', 'queued', 'pendente', 'processando', 'em andamento']) {
  test(`não aceita leitura em curso: ${status}`, () => {
    const resultado = diagnosticarLoteV32([{ name: 'ficticio.csv' }], [{ file: 'ficticio.csv', type: 'CSV', status }]);
    assert.deepEqual(resultado.itens, [{ indice: 0, estado: 'leitura_pendente', requerRevisao: true }]);
    assert.equal(resultado.aptoParaProjecao, false);
  });
}

test('leitura concluída ainda não está conciliada', () => {
  const r = diagnosticarLoteV32([{ name: 'ficticio.pdf' }], [{ file: 'ficticio.pdf', type: 'PDF', status: 'success' }]);
  assert.equal(r.itens[0].estado, 'lido_nao_conciliado');
  assert.equal(r.aptoParaProjecao, false);
});
