# Escopo multissetorial e critérios de aceite

## Finalidade
Avaliar efeitos da reforma tributária sobre lucratividade, fluxo de caixa,
capital de giro e capacidade de pagamento de financiamentos, sem privilegiar
um setor econômico. Locadoras são apenas um caso de teste.

## Arquitetura
1. Cadastro: CNPJ, CNAE principal/secundários, regime e exercícios.
2. Operações: receitas, custos, investimentos e créditos por atividade,
   produto/serviço, competência e tributo.
3. Motor tributário: IBS e CBS separados, transição, regimes específicos,
   benefícios condicionados e validação de premissas com fundamento legal.
4. Motor financeiro: DRE, balanço, fluxo de caixa, EBITDA, CAPEX, NCG,
   impostos sobre resultado, caixa disponível e serviço da dívida.
5. Auditoria: conciliação entre bases, vedação à dupla contagem, trilha de
   origem documental, aprovação do analista e bloqueio de parecer automático.
6. Cenários: referência, reforma, sensibilidades de preços, margens,
   investimentos, prazos de ressarcimento e inadimplência.

## Matriz mínima de homologação
- Comércio: mix de produtos, estoque, compras e fornecedores.
- Indústria: insumos, produção, exportação e investimento.
- Serviços gerais: pessoal, subcontratações e créditos elegíveis.
- Construção civil: contratos longos e regimes por operação.
- Saúde: classificação e tratamentos específicos quando comprovados.
- Transporte/logística: combustível, serviços e frota.
- Agronegócio: produtor, agroindústria, exportação e operações especiais.
- Locação: aluguel, alienação de ativos e renovação da frota.
- Empresa multissetorial: receitas e créditos separados por operação.

## Bloqueios antes de uso em concessão de crédito
- Executar testes automatizados e conciliar resultados com casos manuais.
- Comprovar fontes legais e tratamento por exercício.
- Separar tributos sobre consumo de efeitos já embutidos no EBITDA.
- Demonstrar financiamento de CAPEX e variação de NCG no fluxo.
- Não projetar créditos sem comprovação de elegibilidade e competência.
- Implementar controle de acesso, armazenamento privado e auditoria documental.
- Distinguir simulação de parecer homologado.

Status: especificação de desenvolvimento, não homologação tributária ou
financeira. Nenhuma regra especial decorre apenas do CNAE.
