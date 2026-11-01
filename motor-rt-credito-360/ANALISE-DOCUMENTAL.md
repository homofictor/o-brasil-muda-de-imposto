# Análise documental para crédito

Rota: `/motor-rt-credito-360/analise-documental.html`.

Criada em 01/11/2026 a pedido do usuário: análise exploratória com três BP/DRE e balancete recente. Reutiliza diretamente o leitor `simulador/v3/import.js` para PDF, OCR, CSV, XLS e XLSX. Sem envio, persistência ou comunicação entre abas. A extração preenche candidatos por coluna; revisão obrigatória, conflitos preservados para conferência, CNPJ divergente recusado quando identificado. Documentos comparativos exigem conferência da coluna; não há extração automática de todos os exercícios de um arquivo. Balancetes com movimentos são usados para os saldos disponíveis; EBIT e receita líquida não são fabricados a partir de receita bruta. Escala escolhida antes da leitura.

Entradas vazias permanecem ausentes. Fluxos só são anualizados quando período parcial é selecionado e confirmado. Saldos nunca são anualizados. Não converter lucro líquido em EBITDA; não converter passivo circulante em amortização; não converter CMV em compras.

Modelo: comparação estática contra regime integral em 2033, moeda constante da base. Ponte parte da receita líquida + impostos sobre vendas, extrai IVA por fora e aplica cenário de repasse/volume. Desoneração limitada à fração hipotética de tributos antigos irrecuperáveis dos gastos. Não somar novos créditos ao lucro. D&A explícita é retirada da base de gastos elegíveis e usada para EBITDA; se ausente, isso é ressalvado e EBITDA/cobertura indisponíveis. Giro é estoque incremental, não despesa recorrente. ICSD, FCADS e decisão de crédito não calculados sem seus dados.

Premissas numéricas são hipóteses iniciais propostas pelo motor, NÃO estimativas empíricas dos estudos citados. Fontes acadêmicas e empresariais dão suporte qualitativo às dimensões do estresse. Registro inclui LC 214 consolidada com LC 227, catálogo RFB com Decreto 12.955, transição RFB, cálculo TCU de 28/10/2026. CBS 11,3% refere-se a cálculo para 2027, não a alíquota fixada para 2033. IBS é hipótese. Não aplicar benefícios só por CNAE. Regimes específicos, seletivo, redutores imobiliários, créditos de frota e exportações não estão apurados. Necessário calibrar faixas com evidências microeconômicas antes de uso institucional.

Saídas: relatório sintético, histórico, três cenários, efeito sobre EBIT/margem, estresse de giro, indicador aproximado de cobertura de despesas financeiras quando disponível, limitações e memória. Exportação HTML, JSON e impressão/PDF pelo navegador. Sem probabilidade atribuída ou nível de confiança estatístico.

Validação: `node --test motor-rt-credito-360/documental.test.mjs simulador/tests/*.test.cjs`. Suite histórica ampla tem três falhas preexistentes: uma em integracao-setorial.test.mjs e duas em mvp-validacao-sinais.test.mjs; módulos não alterados. Navegador de QA indisponível no ambiente (falha de inicialização bwrap/read-only). Preview Vercel, sem promoção para produção.
