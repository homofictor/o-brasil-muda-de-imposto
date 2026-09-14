# Simulador da Reforma Tributária V3.2

Base: V3.1 existente na branch `simulador-v3`.

## Objetivo
Evoluir a V3.1 sem regredir funcionalidades, incorporando as revisões feitas em 14/09/2026.

## Regras novas

1. Composição do faturamento por tratamento de IBS/CBS sugerida automaticamente por CNPJ, CNAE e atividade, mantendo revisão manual.
2. Vendas B2B, compras potencialmente creditáveis e fornecedores no regime regular estimados automaticamente por perfil setorial, com origem e confiança da estimativa.
3. Se RBT12 > R$ 4,8 milhões, marcar empresa como não elegível ao Simples para análise prospectiva, desabilitar Anexo e Fator R e não gerar comparativos com Simples puro nem Simples híbrido.
4. Preservar eventual condição histórica/transitória do Simples apenas quando aplicável, separada da análise futura.
5. CBS e IBS de referência carregados como premissas do sistema, editáveis para cenários.
6. Separar capital de giro líquido de reserva financeira disponível.
7. Reserva financeira disponível = caixa + equivalentes + aplicações de liquidez imediata, com classificação revisável.
8. Custo médio da dívida calculado por BP + DRE, preferencialmente juros e encargos da dívida divididos pela dívida financeira média de curto e longo prazo. Anualizar quando a DRE cobrir menos de 12 meses.
9. Não usar despesas financeiras genéricas quando houver detalhamento suficiente dos juros de empréstimos e financiamentos.
10. Relatório final dinâmico conforme elegibilidade, regime, CNAE, estrutura de compras, perfil B2B, créditos, split payment, liquidez e custo financeiro.
11. O relatório deve bloquear qualquer conclusão prospectiva com Simples Nacional ou Simples híbrido quando a empresa não for elegível pelo faturamento.
12. O cálculo de IBS/CBS deve considerar a composição por tratamentos tributários, e não apenas a alíquota cheia sobre 100% do faturamento.
13. O crédito potencial do cliente PJ deve refletir a tributação efetivamente incidente e o tratamento das operações, e não apenas faturamento B2B multiplicado pela alíquota cheia.

## Princípio de UX
O sistema estima primeiro e o usuário revisa depois. Campos importados ou calculados devem mostrar origem, confiança e possibilidade de correção quando pertinente.

## Manual de utilização

A documentação da V3.2 foi atualizada para refletir o novo fluxo, as automações, a importação de documentos, as fórmulas financeiras, as regras de elegibilidade e a leitura do relatório.

Arquivos:

- `simulador/MANUAL_UTILIZACAO_V3_2.md`
- `simulador/v3/manual.html`

A página do simulador possui acesso direto ao manual pelo botão `Manual de uso`.
