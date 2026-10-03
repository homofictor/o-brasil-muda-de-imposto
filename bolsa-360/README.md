# Bolsa 360 | MVP V0.3

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

## Normalização

Cada indicador é convertido em percentil dentro do grupo comparável. Valores ausentes não são inventados e os scores exigem uma quantidade mínima de métricas válidas.

## Valor justo

Ainda não implementado nesta versão. O futuro Valor Justo Bolsa 360 será independente do ranking relativo e usará modelos adequados ao setor, como DCF, múltiplos comparáveis e modelos de dividendos ou residual income para instituições financeiras.

## Próximas etapas

1. incorporar classificação setorial oficial B3;
2. criar histórico de 3 e 5 anos;
3. criar Crescimento 360;
4. refinar Solidez 360 por setor;
5. criar Valor Justo Bolsa 360;
6. criar construtor de carteira por pesos setoriais;
7. acompanhar carteiras e novas divulgações;
8. devolver resultados ao dossiê 360.

## Regra de produto

O sistema informa, calcula e compara. A decisão de investimento pertence ao usuário.
