# Simples Decisão 360

Ferramenta independente de apoio à decisão para empresas do Simples Nacional sobre o recolhimento de IBS e CBS dentro do Simples ou segundo o regime regular, inicialmente para janeiro a junho de 2027.

## Posicionamento

- Independente e utilizável pela URL `/simples-decisao/`, inclusive em iframe de outra plataforma.
- Sem cadastro obrigatório, sem transmissão dos valores financeiros ao servidor nesta primeira versão.
- Evita recomendações categóricas sem documentação de entrada e sem revisão profissional.
- Integrável ao Simulador Empresarial, mas não substitui nem modifica o motor existente.

## Regra de cálculo preliminar (cenário mensal)

- Débito regular de IBS/CBS: base estimada de vendas tributáveis * alíquota efetiva aplicável, informadas pelo usuário.
- Recolhimento regular simulado: max(0, débito regular - créditos utilizáveis informados nas aquisições). Se créditos excederem débitos, o saldo é destacado como **não convertido automaticamente em caixa**.
- Diferença de resultado próprio: parcela IBS/CBS atribuída ao DAS (informada pela contabilidade) - recolhimento regular simulado - custo incremental de conformidade.
- Vendas elegíveis para crédito ao cliente: receita mensal * participação B2B * compradores B2B com possibilidade de crédito.
- Crédito potencial cliente no Simples: vendas elegíveis * alíquota efetiva de crédito transferível no Simples informada pelo usuário.
- Crédito potencial cliente no híbrido: vendas elegíveis * alíquota regular de saída, **somente como aproximação**; depende da operação, documento e comprovação de débito extinto.
- Vantagem ao comprador: crédito potencial híbrido - crédito transferível estimado no Simples (pode ser negativa).
- Renegociação: apenas hipótese comercial, igual ao diferencial positivo ao comprador * percentual de captura comercial informado. Efeito no resultado desconta a alíquota regular simulada sobre o valor de renegociação.
- Teste de resistência: valores de créditos aproveitáveis de entrada 20% menores ou maiores.

## Regras de segurança da informação

1. A opção híbrida só é apresentada quando o usuário declara que é optante do Simples Nacional em 2027.
2. Nenhuma alíquota é preenchida automaticamente com taxa genérica de 2033.
3. O resultado é bloqueado sem dados obrigatórios.
4. Checklist de evidências não dá garantia: marcações apenas elevam o grau **declarado** de preparação para revisão contábil.
5. Exemplo fictício é sinalizado; nenhuma hipótese é apresentada como tributação legal da empresa.
6. CNPJ opcional é apenas consulta pública de razão social e CNAE pelo endpoint já existente `/api/cnpj`.

## Fontes normativas e referências

- Lei Complementar 214/2025, art. 41 e art. 47 (em especial § 9º): https://www2.camara.leg.br/legin/fed/leicom/2025/leicomplementar-214-16-janeiro-2025-796905-normaatualizada-pl.html
- Prazos de opção de 2026: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/setembro/simples-nacional-2027-entenda-os-novos-prazos-e-faca-sua-escolha-com-consciencia-e-tranquilidade/
- Resoluções do CGSN 190, 191 e 194/2026, LC 227/2026: atualizar o catálogo normativo por período.

## Limites do MVP

- Apuração gerencial de um mês. Não apura automaticamente DAS por anexo, sublimite, segregações de receita, Fator R, devoluções ou eventuais regimes específicos.
- Não valida eventos fiscais, controles de extinção dos débitos, glosas, saldos transportáveis nem efeitos detalhados de split payment.
- A aproximação de crédito ao cliente no híbrido pressupõe comparabilidade de bases e alíquotas. Não deve ser usada para formalização sem classificação por operação e prova documental.
- A ferramenta distingue resultado próprio da potencial vantagem ao cliente. Nenhuma transferência de vantagem comercial é presumida.
- Preço e bases têm particularidades tributárias. Ajustes de preço e de alíquota devem ser reconciliados com valores efetivamente faturados.

## Próximas entregas

1. Motor normativo versionado por vigência, localização, CNAE, NCM/NBS, situação do Simples e tipo de operação, com trilhas legais e testes de regressão.
2. Cálculo de DAS separado por Anexo, RBT12, receitas segregadas, Fator R e tratamento dos demais tributos, revisado com contador.
3. Importação opcional de NF-e, NFS-e e demonstrativos PGDAS-D; extrair somente campos estritamente necessários com consentimento.
4. Comparativo por cliente e produto: proposta comercial, crédito transferível e custo líquido de cada comprador, com qualificação documental.
5. Modelo de caixa mês a mês: débitos, créditos, vencimentos, saldos, retenções e split payment, sem extrapolar regras não publicadas.
6. Relatório executivo auditável com fórmulas, fontes, premissas, dados ausentes e recomendação condicional validada.
7. Casos de teste homologados para comércio, indústria e serviços; cenários B2B/B2C, alíquota reduzida, sem créditos e crédito excedente.
8. Publicação após revisão normativa e conciliação dos cenários com profissionais contábeis, sem confundir MVP gerencial com cálculo oficial.

## Testes locais

O protótipo passou validações de JavaScript, preenchimento obrigatório, cálculo do cenário ilustrativo, reclassificação de evidências e responsividade em Chromium/Playwright. Antes de liberar a ferramenta em produção, repetir os testes na URL de preview do Vercel e confrontar as taxas e créditos com documentos de casos reais.

## Integração externa

A URL `/simples-decisao/` abre o aplicativo isoladamente. Para outros sites é possível vinculá-lo diretamente ou incorporá-lo em `iframe`, respeitando as políticas de segurança do site hospedeiro. Não se compartilham dados digitados via query string.