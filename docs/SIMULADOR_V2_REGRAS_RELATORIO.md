# Simulador IBS/CBS v2 — Regras do relatório

## Objetivo

O relatório não deve exibir cenários juridicamente inviáveis nem tratar estimativas como fatos. A saída deve ser condicional ao enquadramento real ou potencial da empresa, ao ano da simulação e à qualidade dos dados disponíveis.

## 1. Simples Nacional: regra de exibição

### 1.1 RBT12 acima de R$ 4.800.000

Se o RBT12 informado/importado for superior a R$ 4.800.000:

- classificar a empresa como **não elegível ao Simples Nacional por faturamento** para fins prospectivos;
- não apresentar comparação entre **Simples puro** e **Simples com IBS/CBS no regime regular (híbrido)** como alternativas futuras;
- não apresentar Anexo do Simples ou Fator R como variáveis decisórias da simulação futura;
- ocultar ou substituir cards de alíquota efetiva do Simples, Simples puro e Simples híbrido por um aviso explicativo;
- concentrar o relatório nos cenários de regime regular e, quando houver dados suficientes, Lucro Presumido x Lucro Real e impactos da transição.

Texto sugerido:

> O faturamento acumulado em 12 meses supera o limite do Simples Nacional. Por isso, o relatório não apresenta o Simples Nacional nem a apuração de IBS/CBS fora do DAS como alternativas futuras. A análise segue pelos regimes tributários aplicáveis à empresa.

### 1.2 Empresa atualmente optante que ultrapassou o limite

Separar **situação histórica/atual** de **elegibilidade futura**. Quando a empresa estiver cadastrada como optante, mas o RBT12 tiver ultrapassado o limite, o relatório deve verificar o percentual de excesso e o período de referência antes de determinar a data de efeitos da exclusão.

O Simples pode aparecer somente em um bloco histórico, quando necessário para explicar o período já transcorrido. Não deve ser apresentado como alternativa futura se a empresa não puder permanecer ou optar pelo regime no período simulado.

### 1.3 RBT12 até R$ 4.800.000

Faturamento abaixo do limite não basta para afirmar elegibilidade. Exibir:

- **Optante confirmado**, quando a consulta cadastral indicar opção vigente;
- **Potencialmente elegível**, quando o faturamento estiver dentro do limite mas não houver confirmação das demais condições legais;
- **Não optante**, quando a consulta indicar ausência de opção, sem presumir que a empresa poderia aderir.

Somente oferecer comparação Simples puro x Simples com IBS/CBS no regime regular quando a empresa for optante confirmada ou quando o cenário for explicitamente identificado como hipótese prospectiva de opção e não houver impedimento conhecido.

## 2. Simples com IBS/CBS no regime regular

O chamado “Simples híbrido” é uma forma informal de descrever a permanência no Simples Nacional com apuração e recolhimento de IBS/CBS pelo regime regular.

A comparação só deve existir para contribuinte do Simples ou potencial optante no período analisado. Não deve existir para empresa definitivamente fora do Simples.

O cálculo não deve utilizar um percentual fixo genérico de IBS/CBS dentro do DAS. A parcela retirada do DAS deve ser parametrizada conforme as regras oficiais vigentes para o ano, Anexo e faixa aplicáveis.

## 3. Relatório orientado por regime aplicável

### Grupo A — Empresa fora do Simples

Exibir:

1. identificação e enquadramento;
2. regime atual, se conhecido;
3. IBS/CBS estimado no regime regular;
4. créditos potenciais;
5. perfil B2B/B2C e efeito competitivo;
6. split payment e efeito de caixa;
7. reserva financeira, CCL e necessidade adicional de capital de giro;
8. custo médio da dívida e custo estimado do financiamento adicional;
9. impactos da transição por ano;
10. alertas e premissas que exigem validação.

Não exibir cards de Simples, Anexo ou Fator R, exceto em histórico explicitamente identificado.

### Grupo B — Empresa optante ou potencialmente elegível ao Simples

Exibir, quando juridicamente aplicável:

1. Simples com IBS/CBS dentro do DAS;
2. Simples com IBS/CBS no regime regular;
3. diferença tributária;
4. diferença de créditos gerados ao cliente;
5. efeito sobre competitividade B2B;
6. efeito financeiro e de capital de giro;
7. recomendação condicionada às premissas.

## 4. Ano da simulação

O relatório deve ter um ano/período de referência obrigatório. Todas as alíquotas, parcelas de transição, composição do DAS e incidências devem ser lidas de uma tabela de parâmetros versionada por ano.

Não misturar premissas de 2026, 2027, 2029 ou 2033 no mesmo cálculo sem explicação explícita.

## 5. IBS/CBS no regime regular

O cálculo do débito não deve aplicar simplesmente a alíquota cheia sobre todo o faturamento. Deve considerar a composição do faturamento por tratamento tributário:

- tributação integral;
- redução de 30%;
- redução de 40%;
- redução de 60%;
- alíquota zero;
- outros tratamentos que venham a ser incorporados.

A alíquota nominal ponderada deve ser calculada antes da apuração dos créditos.

## 6. Créditos das compras

Crédito estimado = compras/insumos elegíveis × percentual potencialmente creditável × percentual de fornecedores capazes de gerar crédito × alíquota aplicável às aquisições.

Quando XML, SPED ou razão contábil estiver disponível, substituir estimativas setoriais por dados reais sempre que possível.

## 7. Crédito potencial do cliente PJ

Não usar apenas faturamento B2B × alíquota cheia. O relatório deve considerar o regime do vendedor, tratamento tributário das operações, base efetivamente tributada e regras de crédito aplicáveis ao adquirente.

O indicador deve ser chamado de **crédito potencial estimado para clientes PJ**, acompanhado do nível de confiança.

## 8. Split payment e capital de giro

Separar:

- valor tributário potencialmente segregado no pagamento;
- tributo líquido estimado após créditos;
- redução do float tributário;
- necessidade adicional de capital de giro;
- reserva financeira disponível;
- insuficiência de caixa após utilização da reserva;
- custo financeiro anual da eventual necessidade de financiamento.

Não tratar capital de giro líquido contábil como caixa disponível.

## 9. Custo financeiro

Preferência de cálculo:

**Custo médio da dívida = juros e encargos de empréstimos e financiamentos / dívida financeira média**

Dívida financeira média = média entre empréstimos e financiamentos de curto e longo prazo no início e no fim do período.

Se a DRE tiver menos de 12 meses, anualizar a taxa. Se houver apenas despesa financeira genérica, sinalizar menor confiança e permitir revisão.

## 10. Rastreabilidade

Cada número relevante do relatório deve receber um marcador de origem:

- IMPORTADO DO BP;
- IMPORTADO DA DRE;
- CONSULTA CNPJ;
- CALCULADO;
- SUGERIDO PELO CNAE;
- PREMISSA DO SISTEMA;
- INFORMADO/ALTERADO PELO USUÁRIO.

Quando houver estimativa, mostrar também confiança alta, média ou baixa.

## 11. Regra de consistência global

Antes de gerar o relatório, executar validações. Exemplos:

- RBT12 > R$ 4,8 milhões e relatório exibindo Simples futuro: bloquear;
- empresa não elegível ao Simples e relatório exibindo híbrido: bloquear;
- soma da composição do faturamento diferente de 100%: bloquear cálculo final;
- dívida financeira igual a zero e custo da dívida calculado: sinalizar inconsistência;
- despesas de juros sem dívida financeira identificada: pedir revisão;
- créditos estimados superiores às compras elegíveis: sinalizar erro;
- percentuais fora de 0% a 100%: bloquear;
- período da DRE ausente: não anualizar silenciosamente.

## 12. Princípio de apresentação

O relatório deve responder nesta ordem:

1. Em qual regime ou conjunto de regimes a empresa pode realmente estar?
2. Qual a carga estimada de IBS/CBS nesse enquadramento?
3. Quanto crédito tende a recuperar e quanto tende a gerar aos clientes?
4. Qual o efeito no preço e na competitividade?
5. Qual o efeito no caixa com o split payment?
6. A reserva financeira absorve o impacto?
7. Se não absorver, qual o custo provável do financiamento?
8. Quais premissas precisam de confirmação humana?

O sistema deve evitar comparar alternativas que a empresa não pode legalmente adotar.