import {criarEmissorConfirmado, confirmarRecebimento} from './mvp-confirmacao-transferencia.js';

// Ponte opt-in, somente no navegador, para candidatos explicitamente aceitos no Simulador v3.2.
// Nenhum arquivo, CNPJ, nome ou fonte documental atravessa a ponte.
const CAMPOS = Object.freeze({
  interestExpense: 'Despesas financeiras (período do documento)',
  rbt12: 'Receita bruta/RBT12 (referência, não receita líquida)',
  currentOperatingMarginPct: 'Margem EBITDA (%)',
  currentAssets: 'Ativo circulante (não equivale à NCG)',
  currentLiabilities: 'Passivo circulante (não equivale à NCG)',
  currentConsumptionTaxAnnual: 'Tributos de consumo atuais (referência)'
});
const TOKEN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOME_CANAL = 'rt360-import-';

export function extrairCandidatosRevisados(candidates) {
  if (!Array.isArray(candidates)) return [];
  const aprovados = new Map();
  const divergentes = new Set();
  for (const c of candidates) {
    if (!c || c.accepted !== true || c.applied !== true ||
        !Object.hasOwn(CAMPOS, c.field) || typeof c.value !== 'number' ||
        !Number.isFinite(c.value) || Math.abs(c.value) > 1e15) continue;
    const periodo = Number.isInteger(c.periodMonths) && c.periodMonths >= 1 && c.periodMonths <= 12
      ? c.periodMonths : null;
    const anterior = aprovados.get(c.field);
    if (anterior && (Math.abs(anterior.value - c.value) > 0.01 || anterior.periodMonths !== periodo)) {
      divergentes.add(c.field);
    } else if (!anterior) {
      aprovados.set(c.field, {field: c.field, value: c.value, periodMonths: periodo});
    }
  }
  for (const campo of divergentes) aprovados.delete(campo);
  return [...aprovados.values()];
}

export function validarPacoteRevisado(pacote) {
  if (!pacote || pacote.tipo !== 'rt360-candidatos-revisados-v1' || !Array.isArray(pacote.candidatos) ||
      pacote.candidatos.length > Object.keys(CAMPOS).length) throw new Error('Pacote de importação inválido');
  const vistos = new Set();
  return pacote.candidatos.map(c => {
    if (!c || !Object.hasOwn(CAMPOS, c.field) || vistos.has(c.field) ||
        typeof c.value !== 'number' || !Number.isFinite(c.value) || Math.abs(c.value) > 1e15 ||
        !(c.periodMonths === null || (Number.isInteger(c.periodMonths) && c.periodMonths >= 1 && c.periodMonths <= 12)))
      throw new Error('Candidato inválido ou duplicado');
    vistos.add(c.field);
    return {field: c.field, rotulo: CAMPOS[c.field], value: c.value, periodMonths: c.periodMonths};
  });
}

export function estimarJurosAnuais(candidatos) {
  const c = candidatos.find(item => item.field === 'interestExpense');
  if (!c || !Number.isInteger(c.periodMonths) || c.periodMonths < 1 || c.periodMonths > 12 ||
      c.value < 0) return null;
  const anual = c.value * 12 / c.periodMonths;
  return Number.isFinite(anual) && anual <= 1e15 ? anual : null;
}

export function iniciarPonteImportacaoMVP({abrir, receber, status, limpar}) {
  if (!globalThis.BroadcastChannel || !globalThis.crypto?.randomUUID) {
    status('Este navegador não permite transferência local entre abas. Use o importador separadamente.');
    abrir.disabled = true;
    return;
  }
  let canal;
  abrir.addEventListener('click', () => {
    canal?.close();
    // Impede reaproveitar valores revisados de uma importação anterior.
    if (typeof limpar === 'function') limpar();
    const token = crypto.randomUUID();
    canal = new BroadcastChannel(NOME_CANAL + token);
    let ultimoEnvioAceito = 0;
    canal.onmessage = event => {
      try {
        if (!Number.isSafeInteger(event.data?.envioId) || event.data.envioId < 1)
          throw new Error('Identificador de transferência inválido');
        if (event.data.envioId <= ultimoEnvioAceito) {
          status('Transferência antiga ou repetida ignorada. Os candidatos mais recentes foram preservados.');
          return;
        }
        const candidatos = validarPacoteRevisado(event.data);
        receber(candidatos);
        ultimoEnvioAceito = event.data.envioId;
        status(`${candidatos.length} candidato(s) aceito(s) recebido(s). Revise antes de utilizar.`);
        try {
          confirmarRecebimento(canal, event.data);
        } catch (_) {
          status('Candidatos recebidos, mas não foi possível confirmar a entrega à outra aba.');
        }
      } catch (_) { status('Pacote de importação recusado por inconsistência.'); }
    };
    const url = new URL('../simulador/v3/index.html', location.href);
    url.searchParams.set('rt360', token);
    window.open(url.href, '_blank', 'noopener,noreferrer');
    status('No importador aberto em outra aba, aceite os candidatos e clique em Enviar ao Motor RT Crédito 360.');
  });
  window.addEventListener('pagehide', () => canal?.close());
}

export function iniciarPonteImportacaoV3(doc = document, loc = location) {
  const token = new URLSearchParams(loc.search).get('rt360');
  if (!TOKEN.test(token || '') || !globalThis.BroadcastChannel) return;
  const canal = new BroadcastChannel(NOME_CANAL + token);
  let emissor = null;
  const montar = () => {
    const painel = doc.getElementById('importPanel');
    if (!painel || doc.getElementById('enviar-rt360')) return;
    const bloco = doc.createElement('div');
    bloco.className = 'importPrivacy';
    const botao = doc.createElement('button');
    botao.id = 'enviar-rt360';
    botao.type = 'button';
    botao.textContent = 'Enviar candidatos aceitos ao Motor RT Crédito 360';
    const mensagem = doc.createElement('p');
    mensagem.setAttribute('role', 'status');
    bloco.append(botao, mensagem);
    painel.append(bloco);
    emissor = criarEmissorConfirmado({canal, avisar: texto => { mensagem.textContent = texto; }});
    botao.addEventListener('click', () => {
      const candidatos = extrairCandidatosRevisados(window.brmiImport?.candidates);
      if (!candidatos.length) {
        mensagem.textContent = 'Nenhum candidato numérico elegível foi aceito explicitamente. Revise os valores primeiro.';
        return;
      }
      emissor.enviar(candidatos);
    });
  };
  doc.addEventListener('brmi:import-ready', montar);
  montar();
  window.addEventListener('pagehide', () => { emissor?.encerrar(); canal.close(); });
}

if (typeof window !== 'undefined' && location.pathname.startsWith('/simulador/v3/'))
  iniciarPonteImportacaoV3();
