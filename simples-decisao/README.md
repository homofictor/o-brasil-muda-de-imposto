# Simples Decisão 360

Ferramenta independente de apoio à decisão para empresas do Simples Nacional sobre o recolhimento de IBS e CBS dentro do Simples ou segundo o regime regular, inicialmente para janeiro a junho de 2027.

## Posicionamento

- Independente e utilizável pela URL `/simples-decisao/`, inclusive em iframe de outra plataforma.
- Sem cadastro obrigatório, sem transmissão dos valores financeiros ao servidor nesta primeira versão.
- Evita recomendações categóricas sem documentação de entrada e sem revisão profissional.
- Integrável ao Simulador Empresarial, mas não substitui nem modifica o motor existente.

## Motor do DAS 2027-2028 (implementado e versionado)

O arquivo `das-2027.js` calcula, para receita homogênea e sem tratamento especial:
- A faixa tributária (Anexos I, II, III, IV ou V) e a alíquota efetiva `(RBT12 × alíquota nominal - parcela a deduzir) / RBT12`.
- O valor **integral** do DAS do mês e a repartição em IRPJ, CSLL, CPP (quando incluída no DAS), ICMS, ISS, IPI, CBS e IBS conforme o anexo.
- A parcela de CBS/IBS excluída do DAS no híbrido, o DAS residual e o percentual de crédito ao comprador **apenas para receita homogênea elegível**.
- O teto de ISS de 5% com repartição do excedente para tributos federais nos Anexos III e IV, faixa 5, conforme a tabela oficial.
- O enquadramento por Fator R, quando explicitamente informado que a atividade é sujeita a ele (Anexo III para fator R >= 28%; V para inferior).
- A CPP patronal do Anexo IV é tratada como despesa **externa ao DAS**, que exige documentação e lançamento próprio.
- O sistema bloqueia a apuração automática de RBT12 superior a R$ 3,6 milhões e de receitas mistas ou outras hipóteses sem memória suficiente. Nesses casos o usuário deve informar os valores efetivos do PGDAS-D no modo manual.

A fórmula de apuração do regime regular é implementada na função `apurarRegular`: créditos de IBS e CBS **jamais são compensados entre tributos**. Saldo credor não é tratado automaticamente como dinheiro disponível. As alíquotas do regime regular para 2027 continuam informadas pelo usuário após verificação.

## Regra de cálculo preliminar (cenário mensal)

- Débitos regulares de CBS e IBS: base estimada de vendas tributáveis * alíquota efetiva de cada tributo, informadas separadamente pelo usuário.
- Recolhimento regular simulado: max(0, débito de CBS - crédito de CBS) + max(0, débito de IBS - crédito de IBS). Créditos são segregados nos termos dos arts. 45 e 47 da LC 214/2025. **Nunca** há compensação cruzada entre CBS e IBS. Saldo credor de cada tributo não é convertido automaticamente em caixa.
- Diferença de resultado próprio: parcela IBS/CBS atribuída ao DAS (informada pela contabilidade) - recolhimento regular simulado - custo incremental de conformidade.
- Vendas elegíveis para crédito ao cliente: receita mensal * participação B2B * compradores B2B com possibilidade de crédito.
- Crédito potencial cliente no Simples: vendas elegíveis * alíquota efetiva de crédito transferível no Simples informada pelo usuário.
- Crédito potencial cliente no híbrido: vendas elegíveis * soma das alíquotas de saída de CBS e IBS, **somente como aproximação**; depende da operação, documento e comprovação de débito extinto.
- Vantagem ao comprador: crédito potencial híbrido - crédito transferível estimado no Simples (pode ser negativa).
- Renegociação: apenas hipótese comercial, igual ao diferencial positivo ao comprador * percentual de captura comercial informado. Efeito no resultado desconta a soma das alíquotas regulares simuladas sobre o valor de renegociação.
- Teste de resistência: valores de créditos aproveitáveis de CBS e IBS 20% menores ou maiores, de forma segregada.

## Regras de segurança da informação

1. A opção híbrida só é apresentada quando o usuário declara que é optante do Simples Nacional em 2027.
2. Nenhuma alíquota é preenchida automaticamente com taxa genérica de 2033. IBS e CBS são sempre digitados separadamente.
3. O resultado é bloqueado sem dados obrigatórios.
4. Checklist de evidências não dá garantia: marcações apenas elevam o grau **declarado** de preparação para revisão contábil.
5. Exemplo fictício é sinalizado; nenhuma hipótese é apresentada como tributação legal da empresa.
6. CNPJ opcional é apenas consulta pública de razão social e CNAE pelo endpoint já existente `/api/cnpj`.

## Fontes normativas e referências

- Lei Complementar 214/2025, arts. 41, 45 e 47 (em especial § 9º): https://www2.camara.leg.br/legin/fed/leicom/2025/leicomplementar-214-16-janeiro-2025-796905-normaatualizada-pl.html
- Prazos de opção de 2026: https://www.gov.br/receitafederal/pt-br/assuntos/noticias/2026/setembro/simples-nacional-2027-entenda-os-novos-prazos-e-faca-sua-escolha-com-consciencia-e-tranquilidade/
- Resolução CGSN 190/2026, tabela dos Anexos I a V para 2027-2028: https://www.legisweb.com.br/legislacao/?id=499102
- Resolução CGSN 140/2018, compilada no sistema oficial de normas da Receita: https://normas.receita.fazenda.gov.br/sijut2consulta/normas.receisulta/link.action?idAto=92278&visao=compilado
- Resoluções do CGSN 191 e 194/2026 e LC 227/2026: monitorar alterações e atualizar o catálogo normativo por período.

## Limites do MVP

- Apuração gerencial de um mês. Já calcula automaticamente DAS por Anexo I a V, com RBT12 e Fator R quando aplicável, **somente nos cenários homogêneos sem regras especiais**, e bloqueia faixas acima do sublimite, receitas segregadas, devoluções, substituição tributária e demais regimes específicos. A empresa em início de atividade deve usar valores oficiais conferidos, pois a proporcionalização ainda não está automatizada.
- Não valida eventos fiscais, controles de extinção dos débitos, glosas, saldos transportáveis nem efeitos detalhados de split payment.
- A aproximação de crédito ao cliente no híbrido pressupõe comparabilidade de bases e alíquotas. Não deve ser usada para formalização sem classificação por operação e prova documental.
- A ferramenta distingue resultado próprio da potencial vantagem ao cliente. Nenhuma transferência de vantagem comercial é presumida.
- Preço e bases têm particularidades tributárias. Ajustes de preço e de alíquota devem ser reconciliados com valores efetivamente faturados.

## Próximas entregas

1. Motor normativo versionado por vigência, localização, CNAE, NCM/NBS, situação do Simples e tipo de operação, com trilhas legais e testes de regressão.
2. Ampliar o cálculo de DAS para receitas segregadas, tratamento diferenciado, sublimites e proporcionalização de empresas em início de atividade, com revisão profissional.
3. Importação opcional de NF-e, NFS-e e demonstrativos PGDAS-D; extrair somente campos estritamente necessários com consentimento.
4. Comparativo por cliente e produto: proposta comercial, crédito transferível e custo líquido de cada comprador, com qualificação documental.
5. Modelo de caixa mês a mês: débitos, créditos, vencimentos, saldos, retenções e split payment, sem extrapolar regras não publicadas.
6. Relatório executivo auditável com fórmulas, fontes, premissas, dados ausentes e recomendação condicional validada.
7. Confrontar resultados com casos reais documentados para comércio, indústria e serviços e homologar resultados com um contador. Os testes automatizados não substituem essa conferência.
8. Publicação após revisão normativa e conciliação dos cenários com profissionais contábeis, sem confundir MVP gerencial com cálculo oficial.

## Testes automatizados em 19/10/2026

Comando de regressão: `node --test simples-decisao/tests/das-2027.test.cjs`.

Foram criados e executados **13 testes** de fórmulas, partilha por todos os anexos, ISS limitado, Fator R, faixa acima do sublimite, atividades mistas e segregação entre CBS/IBS, com 13 aprovações no teste do motor. São **casos sintéticos de referência**, não apurações reais de empresas.

A homologação com três empresas reais **não foi concluída** porque os demonstrativos contábeis e memórias PGDAS-D individuais ainda não foram disponibilizados e os períodos de apuração de 2027 ainda não ocorreram. É inadequado afirmar validação com dados reais sem evidência documental. O requisito para sair de rascunho é conciliar pelo menos três conjuntos documentados, com contador responsável e registros de divergências.

## Testes locais

O protótipo passou validações de JavaScript, preenchimento obrigatório, cálculo do cenário ilustrativo, reclassificação de evidências e responsividade em Chromium/Playwright. Antes de liberar a ferramenta em produção, repetir os testes na URL de preview do Vercel e confrontar as taxas e créditos com documentos de casos reais.

## Integração externa

A URL `/simples-decisao/` abre o aplicativo isoladamente. Para outros sites é possível vinculá-lo diretamente ou incorporá-lo em `iframe`, respeitando as políticas de segurança do site hospedeiro. Não se compartilham dados digitados via query string.