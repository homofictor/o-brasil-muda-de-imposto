// Ao sair do Simulador v3.2, o canal de importação deixa de ser válido.
// O retorno pelo cache do navegador não deve oferecer um botão de envio ativo.
export function encerrarSessaoImportadorV3({emissor, canal, botao, mensagem}) {
  emissor?.encerrar();
  canal.close();
  if (botao) {
    botao.disabled = true;
    botao.setAttribute('aria-disabled', 'true');
  }
  if (mensagem) mensagem.textContent = 'Sessão de transferência encerrada. Volte ao Motor e abra uma nova importação.';
}
