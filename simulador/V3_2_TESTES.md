# V3.2 | roteiro de homologação

## Cenários mínimos

### 1. Indústria acima do teto do Simples
- CNAE de fabricação de estruturas metálicas.
- RBT12: R$ 10.068.691,91.
- Resultado esperado: Simples Nacional e Simples híbrido não aparecem como alternativas prospectivas; Anexo e Fator R ficam não aplicáveis; relatório compara apenas regimes fora do Simples.
- Perfil setorial esperado: B2B elevado, compras creditáveis elevadas e fornecedores regulares elevados, todos revisáveis.

### 2. Empresa elegível e optante pelo Simples
- RBT12 inferior a R$ 4,8 milhões e situação confirmada como optante.
- Resultado esperado: Simples puro, híbrido, Lucro Presumido e Lucro Real podem ser comparados, conforme atividade e demais regras.

### 3. Empresa abaixo do teto, mas não optante
- RBT12 inferior a R$ 4,8 milhões e situação informada como não optante.
- Resultado esperado: o sistema não presume elegibilidade plena nem apresenta Simples como alternativa confirmada.

### 4. Varejo predominantemente B2C
- Exemplo: supermercado, padaria ou varejo de calçados.
- Resultado esperado: B2B sugerido baixo; parâmetros setoriais permanecem editáveis; composição tributária é tratada como aproximação revisável.

### 5. BP + DRE
- Informar caixa, aplicações imediatas, ativo circulante, passivo circulante, dívida inicial/final e juros.
- Resultado esperado: reserva financeira = caixa + aplicações imediatas; CCL = AC - PC; custo financeiro = juros / dívida média, anualizado quando a DRE tiver menos de 12 meses.

## Smoke tests já executados no motor
- RBT12 de R$ 10.068.691,91 retornou somente `presumed` e `real` como modelos aplicáveis.
- Dívida inicial de R$ 1.000.000, final de R$ 1.400.000 e juros de R$ 182.400 produziram dívida média de R$ 1.200.000 e custo financeiro de 15,2% a.a.
- Caixa de R$ 20.000 + aplicações imediatas de R$ 11.504,18 produziram reserva financeira de R$ 31.504,18.
- Ativo circulante de R$ 850.000 e passivo circulante de R$ 710.000 produziram CCL de R$ 140.000.
- CNAE industrial 25.11-0/00 sugeriu perfil B2B de 95%, compras potencialmente creditáveis de 92% e fornecedores regulares de 92%.
