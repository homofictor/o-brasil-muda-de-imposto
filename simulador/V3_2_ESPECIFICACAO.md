# Simulador da Reforma Tributária V3.2

Base: V3.1 existente na branch `simulador-v3`.

## Objetivo
Evoluir a V3.1 sem regredir funcionalidades, incorporando as revisões feitas em 14/09/2026.

## Regras implementadas nesta branch

1. Composição do faturamento por tratamento de IBS/CBS sugerida por CNPJ, CNAE e atividade, mantendo revisão manual.
2. Vendas B2B, compras potencialmente creditáveis e fornecedores no regime regular estimados por perfil setorial, com origem e confiança da estimativa.
3. Se RBT12 > R$ 4,8 milhões, empresa não é tratada como elegível ao Simples na análise prospectiva; Anexo e Fator R ficam não aplicáveis e o relatório não compara Simples puro nem Simples híbrido.
4. Eventual condição histórica/transitória do Simples é separada da análise futura.
5. CBS e IBS de referência permanecem como premissas do sistema, editáveis para cenários.
6. Capital de giro líquido foi separado de reserva financeira disponível.
7. Reserva financeira disponível = caixa e equivalentes + aplicações de liquidez imediata.
8. Custo médio da dívida é calculado por BP + DRE, preferencialmente juros e encargos da dívida divididos pela dívida financeira média. Há anualização para DRE inferior a 12 meses.
9. A importação procura contas específicas de juros e encargos; despesa financeira genérica é aceita somente como sugestão de baixa confiança para revisão.
10. Relatório final é dinâmico conforme elegibilidade, regime, CNAE, estrutura de compras, perfil B2B, créditos, split payment, liquidez e custo financeiro.
11. O relatório bloqueia conclusões prospectivas com Simples Nacional ou Simples híbrido quando a empresa não possui elegibilidade confirmada.
12. O cálculo de IBS/CBS usa a composição por tratamentos tributários, e não apenas a alíquota cheia sobre 100% do faturamento.
13. O crédito potencial do cliente PJ usa a tributação efetivamente incidente após a ponderação dos tratamentos das operações.
14. A importação de BP/DRE passou a procurar caixa, aplicações imediatas, ativo circulante, passivo circulante, dívida financeira e juros/encargos.

## Princípio de UX
O sistema estima primeiro e o usuário revisa depois. Campos importados, calculados ou sugeridos mostram sua natureza e permanecem revisáveis quando pertinente.

## Homologação
A branch `simulador-v3-2` possui preview automático na Vercel. Antes de merge/publicação, executar os cenários descritos em `V3_2_TESTES.md`, com prioridade para uma indústria acima do teto do Simples e uma empresa varejista predominantemente B2C.
