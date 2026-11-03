// Abre a aba auxiliar sem perder a sessão quando o navegador bloquear pop-ups.
export function abrirImportadorSeguro(abrirJanela, url) {
  try {
    const aba = abrirJanela(url, '_blank', 'noopener,noreferrer');
    // Alguns navegadores retornam null com noopener mesmo quando a aba abre.
    // Portanto null não comprova bloqueio e não deve gerar erro falso.
    return {solicitado: true, retorno: aba ?? null};
  } catch (_) {
    return {solicitado: false, retorno: null};
  }
}
