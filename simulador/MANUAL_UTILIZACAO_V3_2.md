# Manual de utilização do Simulador Empresarial da Reforma Tributária

**Versão:** 3.2  
**Projeto:** O Brasil muda de imposto  
**Finalidade:** apoio educativo à análise dos efeitos da Reforma Tributária sobre regime tributário, créditos, competitividade, split payment, capital de giro e custo financeiro.

## 1. O que mudou na V3.2

A V3.2 reduz o preenchimento manual e torna o relatório condicionado à realidade da empresa. O simulador tenta identificar ou estimar informações antes de pedir que o usuário as confirme.

As principais mudanças são:

1. identificação automática da empresa pelo CNPJ e CNAE;
2. análise automática da elegibilidade prospectiva ao Simples Nacional pelo faturamento;
3. exclusão de Simples Nacional e Simples híbrido do relatório quando não forem cenários aplicáveis;
4. estimativa por perfil setorial de vendas para PJ, compras potencialmente creditáveis e participação de fornecedores no regime regular;
5. sugestão inicial da composição do faturamento por tratamento de IBS/CBS;
6. separação entre reserva financeira disponível e capital de giro líquido;
7. cálculo do custo médio da dívida com dados do Balanço Patrimonial e da DRE;
8. importação de Balanço, DRE e relatórios auxiliares para reduzir digitação;
9. relatório final dinâmico, mostrando apenas comparações coerentes com o enquadramento da empresa.

## 2. Fluxo recomendado de utilização

A ordem mais segura é:

1. informar o CNPJ e buscar a empresa;
2. revisar os dados cadastrais e o enquadramento sugerido;
3. informar ou confirmar faturamento e folha;
4. revisar as estimativas de mercado, compras e créditos;
5. revisar a composição do faturamento por tratamento de IBS/CBS;
6. importar Balanço, DRE e relatórios disponíveis;
7. confirmar as sugestões encontradas nos documentos;
8. revisar as premissas financeiras e de transição;
9. gerar o diagnóstico;
10. analisar o relatório por ano e imprimir quando necessário.

## 3. Empresa e enquadramento

### 3.1 CNPJ

Digite o CNPJ e clique em **Buscar empresa**.

Quando a consulta for bem-sucedida, o simulador tenta preencher:

- razão social;
- nome fantasia;
- situação cadastral;
- CNAE principal;
- porte;
- município e UF;
- natureza jurídica;
- informação disponível sobre opção pelo Simples;
- informação disponível sobre MEI;
- atividade principal;
- sugestão de Anexo do Simples, quando aplicável.

Os dados cadastrais são um ponto de partida. Eles não substituem a confirmação contábil do enquadramento efetivo.

### 3.2 Faturamento médio mensal e RBT12

Por padrão, os dois campos ficam sincronizados.

Ao alterar o faturamento médio mensal, o simulador estima a RBT12 multiplicando o valor por 12. Ao alterar a RBT12, o faturamento médio pode ser recalculado.

Se a empresa tiver sazonalidade ou se a RBT12 real for diferente da média mensal multiplicada por 12, desmarque **Sincronizar mensal ↔ 12 meses** e informe os valores reais separadamente.

### 3.3 Regra de R$ 4,8 milhões

Quando a RBT12 superar **R$ 4.800.000**, o simulador trata o Simples Nacional como indisponível para a análise prospectiva.

Nessa situação:

- Simples Nacional puro não entra no ranking de alternativas futuras;
- Simples híbrido não entra no ranking;
- Anexo do Simples deixa de ser decisivo para a comparação prospectiva;
- Fator R deixa de ser relevante para o cenário futuro;
- o relatório concentra a análise nos regimes fora do Simples.

Se a empresa tiver sido optante em parte do período ou estiver em situação de transição por excesso de receita, essa condição histórica deve ser analisada separadamente. O simulador não deve confundir situação histórica com alternativa futura.

Importante: faturar até R$ 4,8 milhões não garante, por si só, o direito de optar pelo Simples. Permanecem as demais condições legais.

### 3.4 Fator R

Quando a atividade puder depender do Fator R, o modo **Automático** usa a folha mensal informada e a RBT12 para estimar o indicador e sugerir o Anexo correspondente.

Se o Simples não for aplicável, o Fator R permanece apenas como dado histórico ou de referência e não deve influenciar a recomendação futura.

## 4. Mercado, compras e crédito

A V3.2 parte do princípio de que muitos empresários não sabem estimar diretamente esses percentuais. Por isso, o sistema tenta sugeri-los a partir do CNAE e do perfil econômico da atividade.

### 4.1 Vendas para clientes PJ, B2B

Representa a parcela estimada das vendas realizadas para pessoas jurídicas.

O sistema usa o perfil da atividade como primeira aproximação. Indústrias, atacadistas e fornecedores empresariais tendem a apresentar maior participação B2B. Varejo, padarias, supermercados e lojas voltadas ao consumidor final tendem a apresentar maior participação B2C.

A estimativa é revisável. Se a empresa conhecer a composição real da carteira de clientes, deve substituir a sugestão pelo dado efetivo.

### 4.2 Compras e insumos sobre o faturamento

Representa o peso das aquisições e insumos sobre a receita.

Esse percentual é mais confiável quando obtido da DRE, razão contábil ou relatório de compras. O simulador pode sugerir o valor a partir dos documentos importados.

### 4.3 Compras potencialmente creditáveis

É a parcela dos gastos e aquisições que, em uma aproximação inicial, pode estar relacionada a créditos de IBS/CBS.

O simulador utiliza o perfil setorial como ponto de partida. Empresas industriais e comerciais tendem a apresentar maior intensidade de aquisições potencialmente creditáveis do que atividades intensivas em folha de pagamento.

Essa estimativa não substitui a classificação fiscal de cada aquisição.

### 4.4 Fornecedores no regime regular

Representa a parcela estimada das compras provenientes de fornecedores cuja tributação tende a permitir o aproveitamento normal de créditos de IBS/CBS.

O percentual pode ser sugerido pelo perfil da cadeia de suprimentos ou calculado a partir de relatórios de fornecedores, quando o arquivo possuir informação suficiente.

## 5. Composição do faturamento por tratamento de IBS/CBS

A composição distribui 100% do faturamento entre os tratamentos simulados:

- tributação integral;
- redução de 30%;
- redução de 40%;
- redução de 60%;
- redução a zero.

A soma deve ser sempre **100%** para que o diagnóstico seja gerado.

O sistema pode sugerir uma composição inicial com base no CNAE e na atividade. Essa sugestão é apenas uma aproximação, porque o cClassTrib pertence à operação ou ao item, e não simplesmente à empresa.

Quando a empresa realizar operações diferentes, revise os percentuais para refletir a composição mais próxima da realidade.

## 6. Premissas de CBS e IBS

Os campos **CBS plena de referência** e **IBS pleno de referência** são premissas do sistema para a simulação da transição e do regime pleno.

Eles permanecem visíveis e editáveis para permitir cenários alternativos.

Alterar esses campos modifica os resultados projetados. Portanto, qualquer alteração manual deve ser interpretada como cenário e não como confirmação oficial de alíquota definitiva.

## 7. Reserva financeira e capital de giro

### 7.1 Reserva financeira disponível

O simulador calcula:

**Reserva financeira disponível = caixa e equivalentes + aplicações de liquidez imediata**

Essa é a medida usada prioritariamente para avaliar quanto da necessidade criada pelo split payment pode ser absorvida sem financiamento externo.

### 7.2 Capital de giro líquido

O simulador calcula:

**Capital de giro líquido = ativo circulante - passivo circulante**

O capital de giro líquido não é tratado como dinheiro disponível. Estoques e contas a receber podem fazer parte do ativo circulante sem representar liquidez imediata.

Por isso, reserva financeira disponível e capital de giro líquido aparecem separadamente.

## 8. Custo financeiro anual

### 8.1 Modo automático

No modo **Automático por BP + DRE**, o simulador procura utilizar:

- juros e encargos de empréstimos e financiamentos na DRE;
- dívida financeira inicial;
- dívida financeira final;
- quantidade de meses cobertos pela DRE.

A dívida financeira considera empréstimos e financiamentos de curto e longo prazo.

Quando existem saldo inicial e saldo final:

**Dívida financeira média = (dívida inicial + dívida final) / 2**

Quando existe apenas um saldo, ele pode ser usado como aproximação, devendo ser revisado pelo usuário.

O custo financeiro é estimado por:

**Custo financeiro do período = juros e encargos da dívida / dívida financeira média**

Se a DRE cobrir menos de 12 meses, o sistema anualiza a taxa:

**Custo financeiro anualizado = custo do período × 12 / meses da DRE**

### 8.2 Despesa financeira genérica

O sistema deve preferir contas específicas de juros e encargos da dívida.

Se localizar apenas **Despesas financeiras**, a sugestão deve ser tratada com baixa confiança, pois a conta pode incluir tarifas bancárias, IOF, variação cambial, multas, descontos e outros itens que não representam o custo dos empréstimos.

### 8.3 Modo manual

Use o modo manual quando os demonstrativos não permitirem separar adequadamente juros e dívida financeira, ou quando houver uma taxa corporativa mais representativa disponível.

## 9. Importação de documentos

A seção **Importar dados da empresa** aceita vários arquivos simultaneamente.

Formatos aceitos:

- PDF com texto pesquisável;
- CSV;
- XLS;
- XLSX.

Nesta versão, os arquivos são processados localmente no navegador para gerar sugestões.

### 9.1 O que o simulador tenta localizar

Dependendo do documento, o sistema procura informações como:

- faturamento;
- caixa e equivalentes;
- aplicações financeiras de liquidez imediata;
- ativo circulante;
- passivo circulante;
- empréstimos e financiamentos;
- juros e encargos da dívida;
- folha e encargos;
- margem de lucro aproximada;
- vendas para clientes PJ;
- fornecedores no regime regular;
- compras ou custos relacionados ao faturamento.

### 9.2 Confiança das sugestões

Cada informação importada pode aparecer com indicação de confiança.

**Alta confiança:** o valor foi localizado em uma estrutura ou conta relativamente específica.

**Média confiança:** o dado é plausível, mas depende de confirmação de período, classificação ou composição.

**Baixa confiança:** a informação é genérica ou pode incluir componentes que não correspondem exatamente ao campo do simulador.

Use o botão **Aplicar sugestões de alta confiança** apenas depois de conferir se os documentos correspondem ao período correto.

### 9.3 PDFs digitalizados

PDFs que são apenas imagens, sem texto pesquisável, podem não ser interpretados corretamente nesta versão. Nesses casos, prefira o arquivo original do sistema contábil, planilha ou PDF com camada de texto.

## 10. Cores e estados dos campos

O preenchimento guiado utiliza estados visuais.

**Amarelo, REVISAR:** campo ainda precisa ser confirmado pelo usuário.

**Verde, OK:** campo informado ou confirmado.

**AUTO ou SUGERIDO:** informação preenchida automaticamente a partir de CNPJ, CNAE ou regra do sistema.

**CALCULADO:** informação derivada matematicamente de outros campos.

**IMPORTADO:** valor trazido de documento enviado pelo usuário.

A automação não elimina a responsabilidade de revisar os dados antes de gerar o diagnóstico.

## 11. Gerar diagnóstico

Depois de revisar os campos, clique em **Gerar diagnóstico**.

Antes de processar, o simulador valida pelo menos:

- faturamento médio mensal maior que zero;
- RBT12 maior que zero;
- composição do faturamento por tratamento de IBS/CBS totalizando 100%.

O processamento cruza enquadramento, regimes aplicáveis, créditos, competitividade, transição tributária e caixa.

Se algum dado for alterado depois da geração, o resultado anterior é ocultado e o sistema solicita uma nova atualização para evitar leitura de números desatualizados.

## 12. Como ler o relatório

### 12.1 Decisão no ano selecionado

Mostra a alternativa que apresenta melhor resultado nas premissas informadas para o ano escolhido.

### 12.2 Visão estrutural em 2033

Mostra como a análise se comporta no cenário de regime pleno projetado.

### 12.3 IBS/CBS e transição

Apresenta débito bruto, créditos estimados e carga líquida de IBS/CBS ao longo dos anos simulados.

### 12.4 Comparação de modelos

O simulador mostra apenas os modelos aplicáveis ao enquadramento prospectivo.

Exemplo: se a RBT12 superar R$ 4,8 milhões, Simples Nacional puro e Simples híbrido não devem aparecer como alternativas futuras.

Quando aplicáveis, os modelos podem incluir:

- Simples Nacional 100%;
- Simples híbrido;
- Lucro Presumido;
- Lucro Real.

Os cenários de Lucro Presumido e Lucro Real são aproximações de apoio à decisão e exigem validação contábil detalhada.

### 12.5 Competitividade B2B

Avalia quanto o tratamento tributário pode afetar o crédito percebido pelo cliente pessoa jurídica.

O indicador considera, entre outros fatores, a participação B2B e a tributação efetivamente incidente nas operações simuladas.

### 12.6 Split payment, caixa e financiamento

Esta seção separa:

- valor potencialmente segregado;
- reposição do float tributário;
- eventual retenção temporária excedente;
- necessidade de capital de giro;
- parcela não coberta pela reserva financeira disponível;
- custo financeiro estimado do gap.

O split payment não é tratado automaticamente como custo tributário adicional. O foco é o efeito sobre a liquidez e o momento em que o dinheiro deixa de permanecer no caixa da empresa.

### 12.7 O que fazer agora

O sistema gera um checklist com providências relacionadas ao perfil da empresa, aos dados informados e ao resultado da simulação.

## 13. Alterar o ano analisado

O relatório permite navegar entre **2027 e 2033**.

Alterar o ano modifica as premissas de transição e pode alterar a recomendação.

Por isso, leia separadamente:

- a decisão para o ano selecionado;
- a posição estrutural projetada para 2033.

## 14. Imprimir relatório

Depois de gerar o diagnóstico, use **Imprimir relatório** no topo da página.

A impressão deve ser feita somente depois de confirmar os dados e gerar a versão atualizada do diagnóstico.

## 15. Dados salvos no navegador

O simulador pode manter os campos preenchidos no armazenamento local do navegador para facilitar a continuidade da análise.

O botão **Refazer simulação** limpa os dados salvos pelo simulador e reinicia os campos.

## 16. O que deve ser sempre revisado

Mesmo com automação, confirme especialmente:

- RBT12 real;
- atividade e CNAE efetivamente utilizados;
- enquadramento atual no Simples;
- eventual situação de exclusão ou transição;
- composição do faturamento por tratamento de IBS/CBS;
- percentual de vendas B2B quando houver informação real;
- compras e insumos;
- elegibilidade dos créditos;
- regime dos principais fornecedores;
- disponibilidade real de caixa e aplicações;
- saldos de empréstimos e financiamentos;
- conta de juros utilizada no custo da dívida;
- período coberto pela DRE;
- premissas de margem, carga residual e custos de conformidade.

## 17. Limitações do simulador

O simulador é uma ferramenta educativa e de apoio à decisão. Ele não substitui apuração fiscal, planejamento tributário, parecer contábil ou jurídico.

Benefícios fiscais, regimes específicos, créditos presumidos, particularidades estaduais e municipais, tratamentos especiais, operações interestaduais, ajustes de IRPJ e CSLL, prejuízos fiscais, bases negativas e outras situações podem alterar significativamente o resultado.

As estimativas automáticas por CNAE são pontos de partida. Dados reais da empresa devem prevalecer quando disponíveis.

## 18. Regra prática de uso

A lógica da V3.2 pode ser resumida assim:

**o sistema estima primeiro, o usuário revisa depois e o relatório só compara o que realmente pode ser aplicado à empresa.**
