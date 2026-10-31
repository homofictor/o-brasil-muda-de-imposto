# Registro de execução: conciliação contábil numérica (31/10/2026)

Escopo: correção restrita a `conciliacao-contabil.js`, sem alteração das fórmulas financeiras, alíquotas ou regras de IBS/CBS.

Falha reproduzida antes da correção: tolerância de conciliação arbitrariamente alta, produto de mapeamento infinito, valores não finitos recebidos diretamente e overflow da soma de contas. Testes: 3 aprovados e 4 falharam, executados com Node 22.16.0.

Correção: tolerância máxima de 0,01 unidade monetária, rejeição de valores normalizados não finitos e validação dos valores, totais e diferença patrimonial antes de declarar conciliação.

Após a correção: `npm test` em diretório isolado com o módulo e dois arquivos de testes, 7 aprovados, 0 falhas. Blobs locais testados: `d43e27812024817a6e0e0027fc974f5e40931f81` (módulo), `0f5cf3c8f681f0650bc5430762a906dee911f764` (regressão). A suíte integral do repositório não foi executada.

Prontidão: **não pronto para testes integrados**. Persistem conciliação completa da DFC, homologação manual multissetorial, FCADS/ICSD contratual, interface financeira, revisão legal por exercício e segurança documental. O fluxo financeiro sem auditoria global da NCG permanece acessível. Não foi realizado merge na main, deploy manual, uso de dados pessoais ou contratação de serviços.
