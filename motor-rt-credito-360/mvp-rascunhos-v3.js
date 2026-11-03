// Contrato mínimo de rubricas numéricas do leitor existente do Simulador RT v3.2.
// Não exporta textos, CNPJ, nomes, arquivos nem identidades. Não classifica ou aprova.
const MAX_ARQUIVOS = 10;
const MAX_LINHAS_POR_ARQUIVO = 2000;
const MAX_RASCUNHOS = 250;
const FORMATOS = new Set(['CSV', 'Excel', 'PDF']);
const MARCADORES_PESSOAIS = /\b(?:cnpj|cpf|telefone|celular|endereco|endere[cç]o|inscri[cç][aã]o|nome empresarial|raz[aã]o social|cep|data de nascimento)\b/i;

function numeroBR(celula) {
  if (typeof celula === 'number') return Number.isFinite(celula) && Math.abs(celula) <= 1e15 ? celula : null;
  if (typeof celula !== 'string') return null;
  const s = celula.trim();
  const negativo = /^\(.*\)$/.test(s);
  const limpo = (negativo ? s.slice(1, -1) : s).replace(/^R\$\s*/, '').trim();
  // Não supor se um ponto isolado representa milhar ou separador decimal.
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(limpo)) return null;
  const valor = Number(limpo.replace(/\./g, '').replace(',', '.')) * (negativo ? -1 : 1);
  return Number.isFinite(valor) && Math.abs(valor) <= 1e15 ? valor : null;
}

function extrairLinha(linha, formato) {
  let rotulo, valor;
  if (Array.isArray(linha)) {
    const numericos = linha.map((celula, indice) => ({indice, valor: numeroBR(celula)}))
      .filter(item => item.valor !== null);
    if (numericos.length !== 1 || numericos[0].indice < 1) return null;
    const indice = numericos[0].indice;
    if (linha.slice(indice + 1).some(celula => String(celula ?? '').trim())) return null;
    rotulo = linha.slice(0, indice).map(celula => String(celula ?? '')).join(' ').trim();
    valor = numericos[0].valor;
  } else if (formato === 'PDF' && typeof linha === 'string') {
    const match = linha.trim().match(/^(.+[A-Za-zÀ-ÿ])\s+(\(?-?(?:R\$\s*)?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?\)?)$/);
    if (!match) return null;
    rotulo = match[1];
    valor = numeroBR(match[2]);
    // Em texto PDF, números inteiros sem marca monetária são ambíguos.
    if (!/[,.]|R\$/.test(match[2])) return null;
  } else return null;
  if (valor === null || !/[A-Za-zÀ-ÿ]{3}/.test(rotulo) || /\d\s*$/.test(rotulo) || MARCADORES_PESSOAIS.test(rotulo)) return null;
  return valor;
}

export function extrairRascunhosRubricasV3(arquivos) {
  if (!Array.isArray(arquivos) || arquivos.length > MAX_ARQUIVOS)
    throw new Error('Quantidade de documentos incompatível com o contrato de rascunhos');
  const rascunhos = [];
  for (let i = 0; i < arquivos.length; i++) {
    const parsed = arquivos[i]?.parsed;
    if (!parsed || !FORMATOS.has(parsed.type)) continue;
    const linhas = Array.isArray(parsed.rows) && parsed.type !== 'PDF'
      ? parsed.rows : parsed.type === 'PDF' && typeof parsed.text === 'string'
        ? parsed.text.split(/\r?\n/) : [];
    if (linhas.length > MAX_LINHAS_POR_ARQUIVO) throw new Error('Documento excede o limite de linhas');
    for (let j = 0; j < linhas.length; j++) {
      const valor = extrairLinha(linhas[j], parsed.type);
      if (valor === null) continue;
      if (rascunhos.length >= MAX_RASCUNHOS) throw new Error('Excesso de rubricas preliminares');
      rascunhos.push({documentoRef: 'doc_' + (i + 1), linhaOrigem: j + 1, formato: parsed.type,
        valor, unidade: 'nao_confirmada', grupo: null, periodo: null,
        revisado: false, aptoParaConciliacao: false});
    }
  }
  return rascunhos;
}

export function validarRascunhosRubricasV3(rascunhos) {
  if (!Array.isArray(rascunhos) || rascunhos.length > MAX_RASCUNHOS)
    throw new Error('Lote de rascunhos inválido');
  const vistos = new Set();
  return rascunhos.map(r => {
    if (!r || !/^doc_(?:[1-9]|10)$/.test(r.documentoRef) ||
        !Number.isSafeInteger(r.linhaOrigem) || r.linhaOrigem < 1 || r.linhaOrigem > MAX_LINHAS_POR_ARQUIVO ||
        !FORMATOS.has(r.formato) || typeof r.valor !== 'number' ||
        !Number.isFinite(r.valor) || Math.abs(r.valor) > 1e15 ||
        r.unidade !== 'nao_confirmada' || r.grupo !== null || r.periodo !== null ||
        r.revisado !== false || r.aptoParaConciliacao !== false)
      throw new Error('Rubrica preliminar não confiável');
    const chave = r.documentoRef + ':' + r.linhaOrigem;
    if (vistos.has(chave)) throw new Error('Origem duplicada');
    vistos.add(chave);
    // Lista positiva: descarta qualquer texto, identidade ou metadado extra.
    return {documentoRef:r.documentoRef, linhaOrigem:r.linhaOrigem, formato:r.formato,
      valor:r.valor, unidade:'nao_confirmada', grupo:null, periodo:null,
      revisado:false, aptoParaConciliacao:false};
  });
}
