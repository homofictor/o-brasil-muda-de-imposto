// Confirmação de entrega entre abas: envio não equivale a recebimento.
// O protocolo trafega somente identificador efêmero e candidatos já filtrados.
export const TIPO_CONFIRMACAO = 'rt360-recebimento-confirmado-v1';

export function confirmarRecebimento(canal, pacote) {
  if (!Number.isSafeInteger(pacote?.envioId) || pacote.envioId < 1) return false;
  canal.postMessage({tipo: TIPO_CONFIRMACAO, envioId: pacote.envioId});
  return true;
}

export function criarEmissorConfirmado({canal, avisar, agendar = setTimeout,
  desagendar = clearTimeout, esperaMs = 5000}) {
  let sequencia = 0;
  let pendente = null;
  canal.onmessage = event => {
    if (!pendente || event.data?.tipo !== TIPO_CONFIRMACAO ||
        event.data.envioId !== pendente.id) return;
    desagendar(pendente.timeout);
    const quantidade = pendente.quantidade;
    pendente = null;
    avisar(`${quantidade} valor(es) recebido(s) pelo Motor. Volte à outra aba e confira antes de aplicar.`);
  };
  return {
    enviar(candidatos) {
      if (!Array.isArray(candidatos) || !candidatos.length)
        throw new Error('Não há candidatos para transferir');
      if (pendente) desagendar(pendente.timeout);
      const id = ++sequencia;
      const atual = {id, quantidade: candidatos.length, timeout: null};
      pendente = atual;
      avisar('Transferência solicitada. Aguardando confirmação da aba do Motor...');
      atual.timeout = agendar(() => {
        if (pendente !== atual) return;
        pendente = null;
        avisar('Recebimento não confirmado. Confira se a aba do Motor continua aberta e tente novamente.');
      }, esperaMs);
      try {
        canal.postMessage({tipo: 'rt360-candidatos-revisados-v1', envioId: id, candidatos});
      } catch (_) {
        desagendar(atual.timeout);
        if (pendente === atual) pendente = null;
        avisar('Falha no envio local. Nenhum recebimento foi confirmado.');
      }
    },
    encerrar() {
      if (pendente) desagendar(pendente.timeout);
      pendente = null;
      canal.onmessage = null;
    }
  };
}
