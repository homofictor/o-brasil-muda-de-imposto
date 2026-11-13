# Revisão visual do radar de notícias | 13/11/2026

A captura do dispositivo mostrou ilustrações com texto embutido, miniaturas cortadas e manchetes sobrepostas. Solução: cards tipográficos sem ilustrações nos destaques da home, notícias e atualizações, com manchetes completas, fonte, data e links de resumo.

- A hierarquia editorial mantém uma notícia principal e três secundárias.
- Layout de 1 coluna até 910px; sem recorte de título e sem imagens textuais.
- Mantidos RSS, API, filtragem, sanitização do texto e modal de leitura.
- URLs CSS/JS receberam nova versão e o service worker mudou de cache V1 para V2, para atualizar PWA previamente instalado.
- Testar telas de 320px, 360px, 390px, tablet 768px e desktop: contraste, quebras de linha, ausência de scroll horizontal e modal aberto.
- A configuração da Vercel continua com deploy automático desligado, exigindo liberação controlada.
