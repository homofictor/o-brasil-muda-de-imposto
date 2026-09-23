# Integração gratuita de leads com Google Sheets

Arquitetura:

1. O formulário do simulador envia os dados para \`/api/lead\`.
2. A função Vercel valida origem, e-mail, perfil e consentimento.
3. A função encaminha o contato para um Web App do Google Apps Script.
4. O Apps Script grava o contato na aba **Leads** e atualiza a aba **Painel**.
5. A URL do Apps Script fica somente na variável de ambiente da Vercel e não é exposta no navegador.
6. Se a integração não estiver configurada ou ficar indisponível, o formulário mantém o e-mail como contingência.

## Planilha

Crie uma planilha chamada:

**Leads - O Brasil muda de imposto**

No Google Sheets, abra **Extensões > Apps Script**, substitua o conteúdo por \`Code.gs\` desta pasta e execute a função \`setup()\` uma vez.

O script cria:

### Aba Leads
- Recebido em
- Nome
- E-mail
- WhatsApp
- Empresa
- Perfil
- Origem
- Consentimento
- Data enviada pelo site
- Status

### Aba Painel
- Leads totais
- Empresários ou gestores
- Contadores
- Consultores
- Com WhatsApp
- Último contato
- Novos ainda não tratados

## Publicar o Apps Script

No editor do Apps Script:

1. Clique em **Implantar > Nova implantação**.
2. Escolha **Aplicativo da Web**.
3. Executar como: **você**.
4. Quem pode acessar: **Qualquer pessoa**.
5. Autorize o script.
6. Copie a URL terminada em \`/exec\`.

A planilha continua privada. A opção "Qualquer pessoa" libera somente a execução do Web App para receber os dados; ela não torna a planilha pública.

## Vercel

No projeto \`o-brasil-muda-de-imposto\`, crie a variável:

\`GOOGLE_SHEETS_LEAD_WEBHOOK\`

Valor: a URL \`/exec\` do Apps Script.

Aplique a variável em **Production** e faça um novo deploy.

## Teste

- \`GET /api/lead\` deve retornar \`configured: true\`.
- Gere um diagnóstico.
- Preencha o formulário de contato.
- O navegador deve mostrar "Contato recebido".
- O registro deve aparecer na aba **Leads**.
- A aba **Painel** deve ser atualizada automaticamente.

## Privacidade

Não enviar para a planilha:
- CNPJ consultado
- conteúdo de BP, DRE ou outros documentos
- resultados tributários detalhados
- premissas financeiras da empresa

A base de leads recebe somente os dados que o usuário preenche explicitamente no formulário e a origem do contato.
