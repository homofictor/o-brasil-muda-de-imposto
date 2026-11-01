// Ponte temporária para copiar valores já calculados na planilha do economista.
// Não lê arquivos, não interpreta fórmulas e não substitui o importador v3.2.
const COLUNAS = ['ano', 'caixaOriginal', 'servicoDivida', 'icsdConferido'];
const numero = (texto, campo, ano) => {
  const v = texto.trim();
  if (!/^-?(?:\d+)(?:[.,]\d+)?$/.test(v))
    throw new Error(`${ano}: ${campo} exige número sem separador de milhares`);
  const n = Number(v.replace(',', '.'));
  if (!Number.isFinite(n) || Math.abs(n) > 1e15)
    throw new Error(`${ano}: ${campo} fora do intervalo permitido`);
  return n;
};

export function interpretarReferenciaColada(texto) {
  if (typeof texto !== 'string' || !texto.trim() || texto.length > 20000)
    throw new Error('Cole uma tabela pequena com 8 exercícios e 4 colunas');
  const linhas = texto.split(/\r?\n/).filter(x => x.trim().length > 0);
  if (linhas[0]?.toLowerCase().startsWith('ano\t')) {
    const cabecalho = linhas.shift().split('\t').map(x => x.trim());
    if (cabecalho.length !== 4 || cabecalho.some((x, i) => x.toLowerCase() !== COLUNAS[i].toLowerCase()))
      throw new Error('Cabeçalho inválido. Use ano, caixaOriginal, servicoDivida, icsdConferido');
  }
  if (linhas.length !== 8)
    throw new Error('Informe exatamente 8 exercícios, de 2026 a 2033, sem misturar valores sintéticos');
  return linhas.map((linha, i) => {
    const colunas = linha.split('\t');
    if (colunas.length !== 4)
      throw new Error(`Linha ${i + 1}: são obrigatórias 4 colunas separadas por tabulação`);
    const ano = Number(colunas[0].trim());
    if (!Number.isInteger(ano) || ano !== 2026 + i)
      throw new Error(`Linha ${i + 1}: exercício esperado ${2026 + i}`);
    const caixaOriginal = numero(colunas[1], 'caixa original', ano);
    const servicoDivida = numero(colunas[2], 'serviço da dívida', ano);
    if (servicoDivida < 0) throw new Error(`${ano}: serviço da dívida negativo`);
    const icsdConferido = colunas[3].trim() === '' ? null : numero(colunas[3], 'ICSD da planilha', ano);
    if (servicoDivida === 0 && icsdConferido !== null)
      throw new Error(`${ano}: sem dívida, deixe o ICSD vazio`);
    if (servicoDivida > 0 && (icsdConferido === null || Math.abs(icsdConferido - caixaOriginal / servicoDivida) > 0.01 + 1e-10))
      throw new Error(`${ano}: ICSD da planilha não concilia com caixa/serviço da dívida`);
    return {ano, caixaOriginal, servicoDivida, icsdConferido};
  });
}
