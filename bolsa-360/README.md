# Bolsa 360 | MVP V0.6

## Objetivo

O Bolsa 360 é um motor de análise fundamentalista para companhias listadas na B3. O MVP atual foi desenhado para:

1. permitir que o usuário escolha setores;
2. construir um universo de ações líquidas;
3. associar ticker, companhia, CNPJ e código CVM;
4. combinar preço de mercado com demonstrações financeiras oficiais;
5. calcular indicadores fundamentalistas internamente;
6. comparar empresas apenas com grupos economicamente comparáveis;
7. ordenar valuation relativo sem confundir preço nominal da ação com empresa barata;
8. manter Valuation, Qualidade e Solidez como dimensões independentes.

## Fontes da V0.2

### Mercado
A listagem operacional da brapi é usada para ticker, preço de fechamento, variação, volume, valor de mercado, setor e subsetor. A aplicação não depende dos fundamentos pagos da brapi para o ranking atual.

### Demonstrações financeiras
Fonte principal atual:
- CVM, DFP consolidadas de 2025;
- cadastro oficial de companhias abertas da CVM.

A base lê Balanço Patrimonial Ativo, Balanço Patrimonial Passivo, DRE e DFC. Os valores com escala MIL são convertidos para reais.

### ITR 2026 e TTM
Os ITR de 2026 já estão incorporados. O balanço usa a posição mais recente disponível. Para DRE e DFC, o motor calcula TTM pela fórmula: DFP 2025 + acumulado 2026 - período comparável de 2025. Quando o ITR não está disponível para uma companhia, a DFP 2025 permanece como fallback.

## Ligação ticker → companhia

O universo de mercado é associado ao cadastro de companhias abertas por nome normalizado, nome fantasia quando disponível e aliases explícitos em casos relevantes. Quando uma companhia possui mais de uma classe negociada, o MVP mantém a ação de maior volume como representante no ranking.

## Grupos comparáveis

O ranking não mistura modelos de negócio incompatíveis. A seleção inicial pode usar setores amplos do provedor operacional. Antes do cálculo, o Bolsa 360 cria grupos de pares. Em Finance, por exemplo, separa:
- bancos;
- seguros e resseguros;
- imobiliário;
- locação de veículos e ativos;
- serviços financeiros;
- outros.

A classificação oficial B3 setor → subsetor → segmento será incorporada como referência definitiva.

## Indicadores calculados internamente

A V0.2 calcula, quando os dados permitem:
- P/L;
- P/VP;
- EV/EBIT;
- CFO Yield;
- FCF Yield quando CAPEX é identificável;
- ROE;
- ROA;
- margem bruta;
- margem EBIT;
- margem líquida;
- liquidez corrente;
- dívida / patrimônio líquido;
- dívida líquida / EBIT;
- caixa / dívida.

Múltiplos negativos não são interpretados como baratos.

## Valuation 360

Valuation 360 é um índice relativo de 0 a 100 dentro do grupo de pares.

### Empresas não financeiras
- P/L: 30%;
- P/VP: 15%;
- EV/EBIT: 30%;
- CFO Yield: 25%.

### Bancos
- P/L: 55%;
- P/VP: 45%.

O ranking só é exibido quando existe cobertura mínima suficiente no grupo.

## Qualidade 360

### Empresas não financeiras
- ROE: 30%;
- ROA: 15%;
- margem EBIT: 30%;
- margem líquida: 25%.

### Bancos
- ROE: 75%;
- margem líquida: 25%.

## Solidez 360

Para empresas não financeiras:
- dívida / patrimônio líquido: 40%;
- dívida líquida / EBIT: 40%;
- liquidez corrente: 20%.

Bancos não recebem Solidez 360 por essa fórmula. Instituições financeiras exigem métricas próprias de capital, inadimplência, eficiência e qualidade da carteira.

## Crescimento 360

O motor histórico consulta as DFP consolidadas de 2021, 2022, 2023, 2024 e 2025 sob demanda para as companhias dos setores selecionados. O TTM 2026 é acrescentado à ficha do ativo como leitura mais recente.

### Empresas não financeiras
Pesos iniciais:
- CAGR de receita 2022-2025: 25%;
- CAGR de receita 2021-2025: 15%;
- CAGR de EBIT 2022-2025: 20%;
- CAGR de lucro líquido 2022-2025: 20%;
- variação da margem EBIT 2022-2025: 10%;
- proporção de exercícios com lucro positivo: 10%.

### Bancos
EBIT não entra na nota de crescimento bancária. Pesos iniciais:
- CAGR de receita 2022-2025: 30%;
- CAGR de receita 2021-2025: 15%;
- CAGR de lucro líquido 2022-2025: 35%;
- proporção de exercícios com lucro positivo: 20%.

Quando o ponto inicial ou final de EBIT/lucro é negativo, o CAGR correspondente não é calculado. A ausência não é convertida em zero; o score é recalibrado com os indicadores válidos.

## Valor Justo 360

A V0.5 acrescenta uma faixa de valor relativo por ação, separada das notas de Valuation, Qualidade, Solidez e Crescimento.

O cálculo usa os múltiplos observados nas demais empresas do mesmo grupo de pares como referência. O ativo avaliado é excluído da amostra de benchmark para reduzir circularidade. Para P/L e P/VP, o preço da própria classe negociada é reprecificado pela razão entre múltiplo dos pares e múltiplo atual da companhia. Isso evita inferir quantidade de ações a partir de valor de mercado e preço, o que poderia distorcer empresas com ON, PN ou units.

### Empresas não financeiras
Podem entrar até quatro modelos:
- P/L aplicado ao lucro líquido TTM;
- P/VP aplicado ao patrimônio líquido mais recente;
- EV/EBIT aplicado ao EBIT TTM, descontando a dívida líquida;
- CFO Yield aplicado ao fluxo de caixa operacional TTM.

### Bancos
A primeira versão utiliza:
- P/L;
- P/VP.

EV/EBIT e métricas de dívida industrial não são usados para bancos.

### Faixa
Para cada modelo são calculados:
- cenário conservador com quartil inferior do múltiplo, ou quartil superior no caso de yield;
- cenário central com a mediana dos pares;
- cenário superior com quartil superior do múltiplo, ou quartil inferior no caso de yield.

O Valor Justo 360 central é a mediana dos valores centrais dos modelos válidos. A faixa é construída da mesma forma com os cenários conservadores e superiores. Em EV/EBIT e CFO Yield, a reprecificação parte do valor econômico total calculado e o converte proporcionalmente para a classe negociada usando o valor de mercado atual, sem estimar número de ações.

Cada modelo exige pelo menos três pares válidos, excluindo a própria companhia. Para empresas não financeiras, o Valor Justo 360 usa preferencialmente empresas do mesmo subsetor; se não houver pelo menos três pares do mesmo subsetor, a faixa não é calculada. Isso evita comparar, por exemplo, siderúrgica com mineradora apenas porque ambas estão em um setor amplo. A confiança é:
- Alta: 3 ou 4 modelos válidos e pelo menos 5 pares por modelo;
- Média: pelo menos 2 modelos e 3 pares;
- Baixa: apenas 1 modelo ou faixa excessivamente dispersa.

Faixas muito abertas reduzem automaticamente o nível de confiança.

O sistema exibe também a distância percentual entre o fechamento e o valor central. Essa distância é descritiva e não equivale a recomendação de compra ou venda.

Esta versão é um valuation relativo por pares. Um DCF próprio, com premissas explícitas de custo de capital e crescimento terminal, ficará separado para não misturar metodologias.

## Valor Intrínseco 360

A V0.6 acrescenta um segundo método de valuation, independente do Valor Justo 360 por pares.

### Empresas operacionais

O modelo utiliza DCF de FCFF derivado de NOPAT, crescimento e reinvestimento implícito:

1. NOPAT inicial = EBIT TTM × (1 - alíquota de imposto).
2. Capital investido aproximado = patrimônio líquido + dívida líquida.
3. ROIC estimado = NOPAT / capital investido.
4. A taxa de crescimento-base é derivada da mediana dos históricos de receita e EBIT e limitada a uma faixa prudencial.
5. O reinvestimento necessário é aproximado por crescimento / ROIC, limitado para evitar extrapolações extremas.
6. O crescimento converge gradualmente ao crescimento terminal ao longo de cinco anos.
7. O fluxo de caixa livre da firma é NOPAT × (1 - reinvestimento).
8. Os fluxos são descontados pelo WACC informado pelo usuário.
9. O valor terminal usa crescimento perpétuo, desde que WACC > crescimento terminal.
10. Dívida líquida é deduzida do valor da firma para chegar ao valor do patrimônio.

O preço por classe é obtido proporcionalmente pela relação entre valor intrínseco do patrimônio e valor de mercado atual, evitando inferir uma quantidade de ações potencialmente incorreta para estruturas com ON, PN ou units.

### Bancos

Bancos utilizam dois modelos patrimoniais:

- lucro residual;
- dividend discount model com payout implícito pela relação crescimento / ROE.

O modelo de lucro residual parte do patrimônio líquido atual e soma o valor presente dos lucros residuais projetados. O modelo de dividendos projeta dividendos a partir do lucro e do payout sustentável.

Quando ambos são válidos, o Valor Intrínseco 360 bancário central utiliza:
- 70% lucro residual;
- 30% dividendos.

### Cenários

São exibidos três cenários:
- conservador;
- central;
- otimista.

As variações afetam taxa de desconto, crescimento-base e crescimento terminal.

### Premissas editáveis

A interface permite alterar:
- WACC operacional;
- crescimento terminal;
- alíquota de imposto;
- custo de capital próprio dos bancos.

Os valores iniciais são premissas do modelo, não taxas de mercado observadas:
- WACC: 14,5%;
- crescimento terminal: 4,0%;
- imposto: 34%;
- custo de capital bancário: 15,0%.

Alterações nessas premissas recalculam o Valor Intrínseco 360 localmente sem nova consulta à CVM.

O sistema retorna N/D quando os fundamentos necessários são insuficientes ou economicamente inválidos. O objetivo é preservar auditabilidade e evitar produzir um preço-alvo artificial.

## Normalização

Cada indicador é convertido em percentil dentro do grupo comparável. Valores ausentes não são inventados e os scores exigem uma quantidade mínima de métricas válidas.

## Próximas etapas

1. incorporar classificação setorial oficial B3;
2. refinar Solidez 360 por setor;
3. calibrar premissas do Valor Intrínseco 360 por setor;
4. criar construtor de carteira por pesos setoriais;
5. acompanhar carteiras e novas divulgações;
6. devolver resultados ao dossiê 360.

## Regra de produto

O sistema informa, calcula e compara. A decisão de investimento pertence ao usuário.
