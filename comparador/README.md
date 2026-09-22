# Comparador de fornecedores v0.1

Protótipo estático independente. Abrir index.html em navegador. Não modifica o simulador existente.

## Implementado

- Comprador, regime declarado e tratamento do crédito confirmado manualmente.
- Duas a cinco propostas comparáveis, preço, frete, prazo e crédito informado.
- Consulta pública de CNPJ numérico pela BrasilAPI, com fallback manual e timeout.
- Validação local de dígitos de CNPJ numérico e alfanumérico. Consulta alfanumérica ainda não habilitada.
- Cenários com e sem crédito a valor presente, sem dupla contagem do prazo.
- Pendências declaradas, sem pontuação arbitrária de risco.
- Exportação/importação JSON e impressão para PDF.

## Limites e próximos passos

Não apura IBS/CBS ou alíquotas. Não comprova certidões, recolhimento, validade de notas, split payment ou direito ao crédito. Não infere Lucro Real/Presumido por CNPJ. As conferências são declarações do usuário.

A integração automática com o simulador NÃO está implementada: definir um contrato versionado para comprador, regime, período e custo de capital, com validação e confirmação prévia à importação. A exportação JSON atual é exclusiva do comparador, não compatível automaticamente com o simulador.

Não há leitura de PDF/XML, autenticação, persistência no servidor ou parcelamento. Não publicar como ferramenta de certificação fiscal. Dados ficam em memória até exportação. Consultas cadastrais enviam somente o CNPJ à BrasilAPI.

## Testes

Executar `node comparador/test.cjs`. Verificar também em navegador real: layout móvel, consulta online e indisponível, importação/exportação, impressão, revisão das premissas e invalidação de resultado após alterações. Verificação visual pendente no ambiente inicial sem navegador instalado.
