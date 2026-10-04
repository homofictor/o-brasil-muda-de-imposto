# Checklist de regressão do Simulador V3.2 / Guiado

Esta checklist registra comportamentos consolidados que não devem ser quebrados por ajustes posteriores.

## Importação contábil

- DRE com Receita Líquida, mas sem Receita Bruta, não deve preencher RBT12 automaticamente.
- RBT12 deve representar faturamento/receita bruta confirmada pelo usuário ou identificada explicitamente em documento.
- Lucro antes de IRPJ e CSLL identificado na DRE deve preencher `realAccountingProfitAnnual`.
- Um zero antigo salvo no campo de lucro não pode impedir a substituição por lucro validado da DRE.
- EBITDA explícito deve ter prioridade. Na ausência, pode ser reconstruído por EBIT + depreciação/amortização, com indicação de confiança.
- A margem EBITDA deve usar Receita Líquida como denominador quando a DRE a fornecer.
- Tributos atuais sobre consumo devem ser extraídos de contas explícitas quando existirem.
- Diferença Receita Bruta - Receita Líquida é apenas aproximação e deve ficar em estado REVISAR.
- DRE sem abertura de Receita Bruta/deduções/tributos não pode gerar carga atual de consumo fictícia.
- DRE com período inferior a 12 meses deve anualizar lucro e tributos e dividir folha pelos meses efetivamente cobertos.

## Balanço e dívida

- Empréstimos e financiamentos devem considerar PC e PNC.
- Rótulos quebrados em linhas distintas no SPED devem ser reunidos.
- Dívida pode incluir bancos, terceiros, mútuos e parcelamentos fiscais quando identificados.
- Subtotais não podem ser somados novamente ao detalhamento.
- Saldo inicial e saldo final devem respeitar a ordem informada no cabeçalho do documento.
- Dívida média = (saldo inicial + saldo final) / 2 quando ambos existirem.
- Caixa/bancos e aplicações financeiras devem ser separados para evitar dupla contagem.

## Custo financeiro

- Despesa financeira deve usar o período atual da DRE.
- Conta específica de juros/encargos tem preferência.
- Conta genérica de despesas financeiras é aproximação gerencial e deve ser identificada como tal.
- Taxas anômalas devem gerar revisão da base, não ser aceitas silenciosamente.

## Regimes tributários

- Comércio/indústria não pode ser classificado como serviço de saúde apenas por conter termos como médico, hospitalar ou odontológico na descrição da mercadoria.
- Percentuais de Lucro Presumido sugeridos devem respeitar a natureza da atividade e permanecer revisáveis.
- Ajuste manual dos percentuais de presunção não pode ser sobrescrito por nova consulta do CNPJ.
- Lucro Real exige lucro contábil conhecido.
- Lucro Presumido e Lucro Real exigem base previdenciária conhecida.
- De 2027 a 2032, modelos regulares exigem premissa conhecida de ICMS/ISS residual.
- Modelo pendente por falta de dados não pode ser tratado como zero.
- Havendo regime aplicável pendente, o relatório deve indicar comparação parcial, não recomendação definitiva.

## IBS/CBS e operação

- Tributação integral = 100% menos parcelas com redução/alíquota zero.
- CNAE sozinho não deve definir tratamento de produto quando NCM/cClassTrib for necessário.
- Atividades de comércio médico-hospitalar devem solicitar revisão por NCM/cClassTrib.
- Crédito do cliente B2B não reduz o imposto próprio do vendedor.
- Crédito potencial de compras e perfil de fornecedores permanecem premissas revisáveis.

## Impacto econômico

- Carga atual e carga futura devem usar a mesma base anual comparável.
- Margem EBITDA deve usar Receita Líquida quando disponível.
- Faturamento bruto é a base da simulação tributária e do repasse de preço.
- Reserva financeira desconhecida não equivale a reserva zero.
- Taxa financeira desconhecida não equivale a custo financeiro zero.
- Se o custo financeiro não puder ser calculado, o impacto no resultado deve ser identificado como parcial.
- Repasse ao preço inicia em 100%, mas permanece editável.

## Integridade e experiência

- Valores digitados manualmente na sessão não devem ser sobrescritos automaticamente por importações.
- A ação explícita "Aplicar sugestões de alta confiança" pode substituir valores anteriores.
- Sugestões idênticas provenientes de mais de um documento devem aparecer como a mesma informação aplicada.
- Alteração para CNPJ diferente deve invalidar dados vinculados aos documentos da empresa anterior.
- "Limpar documentos" deve também remover valores que vieram exclusivamente desses documentos, preservando ajustes manuais.
- Navegação entre etapas deve abrir no início da próxima etapa.
- Valores monetários em formato brasileiro devem ser lidos com `parseMoneyValue`, nunca diretamente com `Number(input.value)`.

## Antes de publicar

1. Validar sintaxe de todos os JavaScript alterados.
2. Testar BP e DRE comparativos.
3. Testar DRE apenas com Receita Líquida.
4. Testar DRE com Receita Bruta e deduções.
5. Testar lucro positivo, zero e prejuízo.
6. Testar dívida com PC + PNC + terceiros + parcelamentos.
7. Testar campos manuais após importação.
8. Testar comparação com um regime pendente.
9. Testar limpeza dos documentos.
10. Testar troca de CNPJ.
