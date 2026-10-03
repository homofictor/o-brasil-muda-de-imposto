# Bolsa 360 | MVP V0.1

## Objetivo

Criar um motor especializado em análise fundamentalista de companhias listadas na B3, com foco em:

1. construção de universo por setor;
2. comparação apenas entre empresas economicamente comparáveis;
3. ranking de valuation relativo;
4. notas independentes de qualidade;
5. preço de fechamento do último pregão;
6. preço-alvo de consenso separado do valuation próprio;
7. futura construção e acompanhamento de carteiras.

## Fontes

### Mercado
- brapi `/api/quote/list`: universo, ticker, fechamento, volume, valor de mercado e setor.
- brapi v2: estatísticas e dados financeiros.
- O endpoint de listagem funciona sem token.
- Sem `BRAPI_API_KEY`, fundamentos são consultáveis apenas para os tickers de demonstração liberados pelo provedor.
- A chave, quando utilizada, deve existir apenas como variável de ambiente do servidor.

### Demonstrações financeiras
Fonte definitiva planejada: CVM DFP e ITR.
O motor deverá manter separação entre:
- dado bruto da fonte;
- indicador calculado;
- score relativo;
- narrativa explicativa.

### Classificação setorial
No MVP, utiliza o campo de setor do provedor operacional.
Na evolução, a classificação oficial B3 setor → subsetor → segmento será a referência principal.

## Valuation 360

O score não é uma recomendação.

### Empresas não financeiras
Indicadores iniciais:
- P/L: menor é melhor, somente valores positivos;
- P/VP: menor é melhor, somente valores positivos;
- EV/EBITDA: menor é melhor, somente valores positivos;
- FCF Yield: maior é melhor.

Pesos iniciais:
- P/L: 25%
- P/VP: 15%
- EV/EBITDA: 35%
- FCF Yield: 25%

### Financeiro
Indicadores iniciais:
- P/L: 45%
- P/VP: 40%
- Dividend Yield: 15%

EV/EBITDA não é usado como métrica principal para bancos.

## Qualidade

### Empresas não financeiras
- ROE: 25%
- ROA: 15%
- margem EBITDA: 35%
- margem líquida: 25%

### Financeiro
- ROE: 70%
- margem líquida: 30%

## Normalização

Cada indicador é convertido em percentil dentro do próprio setor.

- indicadores em que menor é melhor: o menor valor recebe o maior percentil;
- indicadores em que maior é melhor: o maior valor recebe o maior percentil;
- múltiplos negativos não são interpretados como baratos;
- score só é exibido quando existe quantidade mínima de métricas válidas.

## Preço-alvo

Na V0.1:
- fechamento: dado de mercado;
- preço-alvo: consenso externo disponível no provedor;
- valor justo Bolsa 360: ainda não implementado.

O valor justo próprio será separado do consenso e deverá utilizar modelos por setor, como DCF, múltiplos comparáveis e modelos específicos para instituições financeiras.

## Próximas etapas

1. configurar cobertura fundamentalista para universo maior;
2. incorporar classificação oficial B3;
3. consolidar CVM DFP/ITR;
4. criar score de solidez financeira;
5. criar score de crescimento;
6. adicionar histórico de 3 e 5 anos;
7. desenvolver Valor Justo Bolsa 360;
8. construtor de carteira por pesos setoriais;
9. acompanhamento de carteira e alertas após novos ITR/DFP;
10. integração do resultado ao dossiê 360.

## Regra de produto

O sistema informa e compara. O usuário toma a decisão de investimento.
