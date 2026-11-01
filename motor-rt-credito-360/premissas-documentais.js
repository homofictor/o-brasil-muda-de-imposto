export const VERSAO='documental-1.0.0';
export const DATA_BASE='2026-11-01';
export const FONTES=[
 {id:'LC214',tipo:'Legislação consolidada',titulo:'LC 214/2025, com alterações da LC 227/2026',url:'https://www2.camara.leg.br/legin/fed/leicom/2025/leicomplementar-214-16-janeiro-2025-796905-normaatualizada-pl.html',uso:'Incidência, base por fora, não cumulatividade e tratamentos por operação. CNAE não comprova benefício.'},
 {id:'RFB',tipo:'Orientação oficial',titulo:'Receita Federal: transição do IBS e CBS',url:'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/entenda/entenda-a-reforma-tributaria-do-consumo/',uso:'Regime integral em 2033. Esta análise não calcula a trajetória anual da transição.'},
 {id:'REG',tipo:'Regulamentação',titulo:'Legislação da RT: EC 132, LC 214, LC 227 e Decreto 12.955/2026',url:'https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria-do-consumo/legislacao/',uso:'Catálogo oficial consultado em 01/11/2026. Regras operacionais não equivalem a prazo garantido de monetização dos créditos.'},
 {id:'TCU',tipo:'Referência calculada, não alíquota definitiva',titulo:'TCU: referência de CBS de 11,3%, 28/10/2026',url:'https://portal.tcu.gov.br/imprensa/noticias/tcu-calcula-aliquota-de-referencia-de-113-para-novo-tributo-sobre-consumo',uso:'Referência calculada para 2027, ainda sujeita à fixação pelo Senado. Sua manutenção em 2033 é hipótese, não previsão legal.'},
 {id:'IPEA',tipo:'Estudo econômico, 2023',titulo:'Ipea: Propostas de reforma tributária e seus impactos',url:'https://www.ipea.gov.br/cartadeconjuntura/wp-content/uploads/2023/07/230706_cc_60_nota_01_reforma_tributaria.pdf',uso:'Direção dos efeitos em cadeias produtivas. Não fornece os percentuais empresariais adotados neste motor.'},
 {id:'FGV',tipo:'Estudo econômico, 2025',titulo:'FGV EPGE: Tax reforms and network effects',url:'https://portal.fgv.br/noticias/reforma-tributaria-poderia-elevar-o-pib-brasileiro-em-ate-8-aponta-estudo',uso:'Efeitos indiretos e interdependência setorial. Ganhos de PIB não são convertidos em lucro da empresa.'},
 {id:'OMIE',tipo:'Pesquisa empresarial, 2026',titulo:'Omie: Radar Setorial da Reforma Tributária',url:'https://www.omie.com.br/blog/radar-setorial-omie-reforma-tributaria-impacto-pmes/',uso:'Estrutura da triagem: posição na cadeia, créditos e resiliência de caixa. Não é calibração estatística dos cenários.'},
 {id:'CNA',tipo:'Cenários econômicos, 2023',titulo:'FGV/CNA: impactos econômicos em diferentes cenários',url:'https://cnabrasil.org.br/storage/arquivos/pdf/Reforma_Tributaria_Impactos_Sociedade_Brasil.pdf',uso:'Sensibilidade do agro e alimentos ao tratamento diferenciado; anterior à legislação final.'},
 {id:'IBRE',tipo:'Sondagem empresarial, 2026',titulo:'FGV IBRE: adaptação da construção',url:'https://blogdoibre.fgv.br/node/2317',uso:'Heterogeneidade contratual e risco de adaptação, sem coeficiente universal de aumento de custo.'}
];
// Faixas de estresse propostas pelo modelo. NÃO são coeficientes estimados pelos estudos.
export const PERFIS={
 industria:{nome:'Indústria',elegivel:[.75,.55,.35],embutido:[.10,.05,.01],atual:[.24,.18,.12],fontes:['IPEA','FGV','OMIE'],nota:'Mix de produtos, benefícios, exportações e seletivo podem alterar substancialmente o resultado.'},
 comercio:{nome:'Comércio e distribuição',elegivel:[.90,.75,.55],embutido:[.06,.03,0],atual:[.22,.16,.10],fontes:['IPEA','OMIE'],nota:'CMV não equivale a compras. Regime dos fornecedores e mix de produtos precisam de revisão.'},
 servicos:{nome:'Serviços',elegivel:[.35,.20,.08],embutido:[.08,.04,0],atual:[.15,.10,.05],fontes:['IPEA','FGV','OMIE'],nota:'Folha salarial não gera crédito. Diferenciações profissionais não são aplicadas automaticamente.'},
 saude:{nome:'Serviços de saúde',elegivel:[.45,.25,.10],embutido:[.08,.04,0],atual:[.15,.10,.05],fontes:['LC214','OMIE'],nota:'Redução de 60% depende das operações elegíveis e do Anexo III. Não confundir prestador com plano de saúde.'},
 educacao:{nome:'Educação',elegivel:[.30,.15,.05],embutido:[.08,.04,0],atual:[.15,.10,.05],fontes:['LC214','OMIE'],nota:'Redução de 60% restrita aos serviços elegíveis do Anexo II.'},
 agronegocio:{nome:'Agronegócio e alimentos',elegivel:[.75,.50,.25],embutido:[.10,.05,0],atual:[.16,.09,.03],fontes:['CNA','IPEA'],nota:'Faixa ampla: produtos, exportações, produtor rural e créditos presumidos não podem ser determinados só pelo CNAE.'},
 construcao_civil:{nome:'Construção e imóveis',elegivel:[.65,.40,.15],embutido:[.10,.05,0],atual:[.17,.10,.04],fontes:['IBRE','LC214'],nota:'Regime imobiliário, redutores de base e contratos antigos não estão calculados. Resultado é estresse genérico até parametrização específica.'},
 transporte_logistica:{nome:'Transporte e logística',elegivel:[.65,.40,.20],embutido:[.10,.05,0],atual:[.20,.12,.05],fontes:['IPEA','OMIE'],nota:'Combustíveis, modais, transporte de passageiros e renovação da frota exigem tratamento específico.'},
 locacao_veiculos:{nome:'Locação de veículos',elegivel:[.50,.30,.10],embutido:[.10,.05,0],atual:[.14,.09,.04],fontes:['LC214','OMIE'],nota:'Não deduzir crédito de frota como lucro. Sem CAPEX e venda de usados segregados, o caixa e o impacto líquido total permanecem incompletos.'},
 geral:{nome:'Outros / atividades mistas',elegivel:[.75,.40,.05],embutido:[.10,.04,0],atual:[.24,.12,.03],fontes:['IPEA','OMIE'],nota:'Perfil heterogêneo. Não representa apuração de regimes específicos como financeiro, combustíveis e planos de saúde.'}
};
export const PARAMETROS=[
 ['cbs','CBS de referência (%)',0,40],['ibs','IBS hipotético (%)',0,40],['redutor','Redução média ponderada da alíquota (%)',0,100],
 ['atual','Tributos atuais sobre vendas / receita líquida (%)',0,60],['elegivel','Parcela dos gastos com potencial de desoneração (%)',0,100],
 ['embutido','Tributo irrecuperável embutido nessa parcela (%)',0,30],['repasse','Repasse da diferença aos preços (%)',0,100],
 ['volume','Variação do volume vendido (%)',-50,30],['variavel','Parcela variável dos gastos (%)',0,100],
 ['dias','Dias adicionais de capital de giro',0,365],['adaptacao','Custo de adaptação / receita líquida (%)',0,10]
];
export function premissasPadrao(setor){const p=PERFIS[setor]||PERFIS.geral;return ['Favorável','Central','Adverso'].map((nome,i)=>({nome,cbs:11.3,ibs:[16,18,20][i],redutor:0,atual:p.atual[i]*100,elegivel:p.elegivel[i]*100,embutido:p.embutido[i]*100,repasse:[90,50,10][i],volume:[0,-2,-5][i],variavel:[80,60,40][i],dias:[0,15,45][i],adaptacao:[.1,.4,1][i]}));}
