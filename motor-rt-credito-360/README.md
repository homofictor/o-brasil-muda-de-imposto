# Motor RT Crédito 360 (protótipo técnico)

Núcleo inicial isolado em `core.js`, sem alteração da página pública. Projeta cinco anos por padrão e compara cenário de referência com cenário de reforma, calculando tributos líquidos, EBITDA simplificado, caixa disponível simplificado e ICSD.

## Limitações bloqueadoras de uso em crédito

- As alíquotas anuais precisam ser informadas e validadas externamente. O núcleo **não implementa** a legislação da transição, regimes setoriais, nem cálculo jurídico de créditos.
- Os créditos informados são usados no mesmo ano, sem controle de estoque, prazo de ressarcimento ou compensação. `creditoNaoUtilizado` é apenas indicativo e **não é transportado**.
- O modelo usa receita e margem EBITDA constantes em termos relativos, e uma aproximação para variação tributária. Não constitui DRE ou fluxo de caixa contábil completos.
- O ICSD é indicativo e não segue necessariamente a metodologia contratual ou institucional do Bandes.
- Falta validar consistência de impostos, CAPEX, NCG, custos, tributos na receita e serviço da dívida; evitar dupla contagem antes da homologação.
- Não há importação de demonstrativos, relatórios PDF/DOCX, interface, persistência ou controle de acesso.

## Próximas etapas

1. Auditar o código do simulador atual e documentar regras reutilizáveis.
2. Criar modelo anual de créditos gerados, utilizados, ressarcidos e carregados, com conciliação.
3. Implementar DRE, balanço e fluxo de caixa integrados com cenários e dívida.
4. Validar com casos sintéticos e casos setoriais de locação de veículos.
5. Gerar relatório com memória de cálculo e ressalvas, sujeito à revisão do analista.

Não publicar como ferramenta homologada de concessão de crédito.

## Liberação de NCG (31/10/2026)

Entrega limitada à ponte financeira multissetorial: a variação anual da
necessidade de capital de giro (NCG) agora admite valor negativo, que representa
liberação de recursos e aumenta o caixa disponível. CAPEX, impostos sobre
resultado e serviço da dívida continuam não negativos. Nenhuma regra de IBS/CBS,
fórmula tributária ou permissão foi modificada.

Commits de implementação e regressão:
`2902c3413fdd4c1b50be4776a12caee6bd8cbc0d` e
`873bfe4add1866f45347e0418e8cdef7c5919ffa`.

Verificação: 24 testes Node executados com sucesso em cópia local dos módulos
e arquivos de teste obtidos da branch, incluindo dois novos casos de NCG
negativa, ICSD e rejeição de entradas inválidas. A primeira execução ampliada
falhou porque a cópia local de `indicadores-financeiros.js` estava incompleta;
após completar a cópia com a função existente no repositório, 24/24 passaram.
Isto não constitui execução da suíte integral do repositório nem QA da interface.

Prontidão: **não pronto para testes integrados**. Permanecem sem comprovação
a conciliação manual de cenários setoriais e demonstrações, o FCADS contratual,
a interface utilizável e os controles de acesso e armazenamento privado de
documentos. Revisão legal e aprovação do analista continuam obrigatórias.
Não houve merge na `main` nem publicação em produção.

Próxima ação: conciliar um cenário multissetorial com DRE, balanço e fluxo
de caixa, incluindo a memória da variação de NCG, antes de ampliar a interface.

## Rastreabilidade dos componentes de caixa e ICSD (31/10/2026)

A projeção anual da ponte IBS/CBS agora expõe `componentesCaixa` com
CAPEX, variação da NCG, impostos sobre resultado, juros e amortizações.
Os mesmos valores alimentam o caixa pré-tributos e o serviço da dívida;
nenhuma fórmula, regra fiscal, permissão ou fonte de dados foi alterada.
A memória permite conferir, por exercício, a formação do caixa e do ICSD
sem confundir a conta-corrente do IBS com a da CBS.

Commits: implementação `e63eff43c621c79818b3fa3f0e695fc08b5e320d`;
regressão `f092ee07d61495d5b3c7f4b4cde7a8951224dd4a`.
Verificação após os commits: 25 casos de teste existentes e acrescentados,
executados com sucesso em um harness JavaScript V8 que adapta as asserções
`node:test`; 0 falhas. Não foi executado o comando `node --test` nem
a suíte completa do repositório. Os arquivos alterados foram relidos da branch
após as escritas e conferidos por SHA de conteúdo.

Prontidão: **não pronto para testes integrados**. Faltam conciliação manual
de DRE, balanço e fluxo de caixa por setor, conferência do FCADS/ICSD por
analista, interface utilizável, rastreabilidade jurídica por exercício,
controle de acesso e armazenamento privado de documentos. Não houve merge
na `main`, implantação em produção ou uso de dados pessoais.

Próxima ação: conciliar manualmente DRE, balanço, NCG e fluxo de caixa de um
cenário sintético multissetorial, verificando o ICSD e a dupla contagem.

## Conciliação sintética multissetorial de DRE, balanços, NCG e ICSD (31/10/2026)

Novo teste de regressão `conciliacao-multissetorial.test.mjs`, commit
`350448bea76512a873630b5662c93e71103e2b4d`. Exercício-base sintético
2026: receita 800, custos 480, despesas operacionais 160 e EBITDA 160;
balanço 1.000 = 600 + 400. Balanço projetado 2027: 1.060 = 640 + 420.
NCG operacional ilustrativa: 110 para 120, variação positiva de 10.
O teste concilia oito atividades com alíquotas hipotéticas distintas, IBS
36 (créditos utilizados 12; a pagar 24), CBS 31 (créditos utilizados 6;
a pagar 25), sem compensação cruzada. Caixa pré-tributos 125, caixa de
referência 45, caixa na reforma 76, serviço da dívida 40 e ICSD 1,125 e
1,900, respectivamente. Confere conciliações zeradas e ausência de dupla
dedução de tributos. Um segundo teste verifica divergência patrimonial de 1
e status pendente de revisão. Todas as taxas, classificações e evidências
são **fictícias**, não conclusões jurídicas nem contábeis.

Verificação posterior ao commit: 14 testes dos três arquivos de regressão
`integracao-ibs-cbs-credito.test.mjs`, `conciliacao-contabil.test.mjs` e
`conciliacao-multissetorial.test.mjs` executados em JavaScript V8 com
adaptador das asserções `node:test`; **14 aprovados, 0 falhas**. O arquivo
novo foi relido da branch (blob SHA
`ef6c773d4b0e72787bc4639becc8113ac5f6abbb`). Não houve execução
nativa de `node --test`, suíte completa nem QA de interface.

**Prontidão: não pronto para testes integrados.** A conciliação do balanço
ainda é independente da ponte tributária, e a NCG foi derivada manualmente;
não existe conciliação completa da DFC, do FCADS contratual ou do
financiamento de CAPEX. Faltam validação manual por setor, revisão legal
por exercício, interface utilizável, autorização, armazenamento privado e
auditoria documental. Próxima ação: vincular, sem cálculo presumido, a
conciliação da origem da NCG e os demonstrativos à revisão obrigatória do
analista. Nenhum merge ou deploy autorizado.

## Auditoria documental da origem da NCG (31/10/2026)

Entrega limitada ao novo módulo isolado `auditoria-origem-ncg.js` e seus
testes, sem alterar a ponte financeira existente. Para dois balanços
consecutivos, reconcilia clientes + estoques - fornecedores operacionais,
compara a variação apurada com a informada e exige referência de documento,
demonstração e linha para cada saldo. Identifica divergências, falta de
evidência e ausência de revisão declarada pelo analista; aceita liberação
de capital de giro com variação negativa. Nenhuma classificação ou valor
é inferido automaticamente. `aptoParaParecer` permanece sempre falso.

Commits: implementação `827105580c98f20948b27b1ad599dee922e472bd`;
regressão `010cd81b8b1f88803d1acd6cbf7ac08816a6fe8a`.
Verificação posterior aos commits: os dois blobs relidos diretamente da
branch coincidem com `git hash-object` dos arquivos locais testados
(`930f91f98c48ea423a77a4569e0db77a324310f0` e
`9dbb162b465ae5673415a826a2dc83f646e5b385`).
`npm test` no diretório isolado contendo exatamente esses dois arquivos
e `package.json` mínimo: **6 testes nativos Node aprovados, 0 falhas**.
Não foi executada a suíte integral do repositório.

**Prontidão: não pronto para testes integrados.** A auditoria da origem da
NCG ainda não é consumida por `integracao-ibs-cbs-credito.js`; a revisão
é apenas declarativa, sem autenticação institucional. A conciliação da DFC
e do FCADS contratual, validação manual por setor, rastreabilidade legal
por exercício, interface operacional, autorização e armazenamento privado
de documentos continuam pendentes. Não houve merge, deploy ou alteração
de produção. Próxima ação: conectar a conciliação documental da NCG à
ponte financeira com bloqueio seguro quando faltar evidência, preservando
os testes de IBS/CBS e ICSD.


## Entrada financeira com NCG documental auditada (31/10/2026)

Criado `integracao-ncg-auditada.js`, ponto de entrada **alternativo e
restritivo** para `integrarIBSCBSAoCredito`. Antes de calcular qualquer
projeção, exige para **cada exercício** a variação explícita da NCG e
auditoria de dois balanços consecutivos, com origem por documento/linha,
conciliação dentro da tolerância e revisão declarada pelo analista.
Exercícios incompatíveis, documentos ausentes, divergências e falta de
revisão bloqueiam a projeção inteira. O retorno inclui `auditoriaNCG`
em cada exercício, mantendo `homologado` e `aptoParaParecer` falsos.
Não altera fórmulas, alíquotas, contas de IBS/CBS ou dados de usuários.

Commits: entrada auditada
`1f81951dd130845c37728db3eff7a9010fa5f444`;
regressão `8c3798cd373335766d89e9c0bf1428b076cb3927`;
ajuste de comentário `87f47efca7e94a99ec47cc40339caef132448cd4`.
Teste real: `npm test` com Node 22 em diretório isolado contendo os
**mesmos blobs** dos sete módulos existentes da branch e os dois arquivos
novos. **7 testes nativos aprovados, 0 falhas**, incluindo oito atividades
sintéticas, liberação de NCG, ICSD, IBS/CBS segregados, exercícios
incompatíveis e bloqueios por evidência ausente ou divergente. Os blobs
novos relidos no GitHub coincidiram com `git hash-object` dos arquivos
testados: `f8ab4feed09a64edc4ab50b1d1364ea838122de6` e
`a3efbc012fd4fff8d3bf87dc99a156a4c990dd8a`.
A suíte integral do repositório e o QA da interface **não** foram executados.

**Prontidão: não pronto para testes integrados.** Testes isolados: aprovados.
Cenários multissetoriais: somente sintéticos, sem homologação manual.
Caixa/ICSD: auditáveis no caminho novo para os casos testados, ainda sem
FCADS contratual ou DFC completa. Interface: não integrada. Documentos:
sem autorização institucional nem armazenamento privado comprovados.
Bloqueio crítico: a entrada antiga `integrarIBSCBSAoCredito` permanece
acessível sem exigir auditoria NCG; o novo caminho não é um gate global.
Não há rastreabilidade legal completa por exercício. Próxima ação:
conectar a interface e o fluxo efetivo exclusivamente à entrada auditada,
sem contornar controles e após validação da segurança documental.
Não houve merge nem ação manual de publicação. Status Vercel do commit
`87f47ef` observado como `pending`, sem deploy confirmado.

## Limite de tolerância da NCG na entrada auditada (31/10/2026)

Falha comprovada: a entrada `integrarCreditoComNCGAuditada` repassava
`tolerancia` da própria evidência para `auditarOrigemNCG`. Um valor
arbitrariamente elevado (por exemplo, 1.000.000) permitia aceitar uma
variação de NCG divergente dos balanços, mesmo com o bloqueio documental
aparentemente ativo. A entrada auditada agora fixa a tolerância em 0,01,
sem modificar as fórmulas financeiras ou tributárias e sem alterar a
função isolada de auditoria. O teste de regressão reproduziu a falha antes
da correção e passou depois dela.

Commits: correção `9528981cdf1fb0e3f6e5df53592fc5b0ea50b2b2`;
regressão `0cdefeeeae175428182399bc7cede9e461c2020b`.
Verificação posterior aos commits: 8 testes da entrada auditada
executados em JavaScript V8, usando os corpos dos módulos relidos da
branch e um adaptador de `node:test` / `assert`: **8 aprovados,
0 falhas**. Os blobs relidos são `dcf159f95bcb4e26d0ab5444c3b600e64f1cbe0b`
e `8d66483d71e82f33d544096e3f123a51a4283d78`. Não foi
executado `node --test` nativo nem a suíte integral. O teste novo falhou
antes da correção, demonstrando o bypass.

**Prontidão: não pronto para testes integrados.** Testes focados passaram,
mas falta a suíte nativa completa. Os oito setores foram cobertos apenas
por dados sintéticos, sem conciliação manual ou revisão legal. Caixa e ICSD
são rastreáveis somente na entrada auditada e não substituem DFC/FCADS
contratual. A interface não está integrada. Segurança documental,
autorização institucional e armazenamento privado não estão comprovados.
A entrada financeira anterior continua acessível sem o gate de NCG.
Próxima ação: localizar o fluxo operacional efetivo e impedir que resultados
sem conciliação sejam apresentados como validados, sem liberar a interface
antes dos controles documentais.

Verificação do commit de regressão: contexto Vercel `pending`, sem
confirmação de deploy. Nenhum merge na `main`, publicação manual,
modificação de produção, gasto ou uso de dados pessoais nesta entrega.
