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

## Proteção contra overflow na conta-corrente IBS/CBS (31/10/2026)

Problema reproduzido: entradas individualmente finitas, como saldo inicial
de 1e308 e créditos gerados de 1e308, produziam saldo disponível infinito
em `apurarCreditosAnuais`. A conciliação virava NaN e a condição anterior
não rejeitava esse resultado, permitindo propagação de valores não finitos.
A correção bloqueia o saldo disponível não finito antes de utilizar créditos,
sem alterar fórmulas, regras tributárias, alíquotas ou compensações.

Commits: correção `ae6cc0db23ac288adb3dcbf9ea179d00d8a0507c`;
regressão `f4c923c8772ce627fd8134d283c7a72bcb51740b`.
Teste reproduzido antes da correção: 1 falha e 1 aprovação em dois casos
nativos Node. Depois da correção, `npm test` em diretório isolado com os
blobs de `creditos.js`, `core.js`, `creditos.test.mjs` e o novo teste:
**5 testes aprovados, 0 falhas**. Arquivos alterados relidos na branch,
com SHA de blob coincidente com `git hash-object` local:
`2b005cb3d457930b38cbf10d10c6b641b14aa4c4` e
`8069503bf7ed0a75ad05c650cd5f72ba03195662`.
Não foi executada a suíte integral do repositório.

**Prontidão: não pronto para testes integrados.** A verificação numérica
local passou, mas os cenários setoriais seguem apenas sintéticos e sem
conciliação manual completa; caixa e ICSD não constituem DFC ou FCADS
contratual auditados; a interface não está integrada; autorização
institucional e armazenamento privado documental não estão comprovados.
A entrada financeira sem auditoria NCG continua acessível e exige
isolamento no fluxo operacional antes de uso. Não houve merge na
`main`, publicação ou alteração de produção, gasto ou uso de dados pessoais.
Próxima ação: localizar o ponto de entrada operacional e impedir exibição
de projeções sem conciliação como resultados validados.


## Proteção de resultados financeiros não finitos (31/10/2026)

Falha reproduzida na ponte `integrarIBSCBSAoCredito`: valores de entrada
individualmente finitos podiam produzir `Infinity` no caixa antes dos
tributos, no serviço da dívida ou no ICSD. Exemplo sintético: EBITDA de
`1e308` e liberação de NCG de `-1e308`; outro: juros e amortizações
de `1e308` cada. A saída anterior não rejeitava esses resultados, que
poderiam contaminar a leitura da capacidade de pagamento.

A ponte agora rejeita resultados não finitos de caixa pré-tributos,
caixa de referência, caixa da reforma, serviço da dívida, ICSD e
variação de caixa. As fórmulas, as alíquotas, os créditos e a separação
entre IBS e CBS foram preservados. O bloqueio vale para todos os setores
que utilizem a ponte, inclusive o caminho com NCG auditada.

Commits: implementação `fdc8a6b030e30c62886f72322024002602296123`;
regressão `ee3764833a44d9aeb8f1b71a8ddfeff041db8d31`.
Verificação **após os commits**: 13 casos executados em JavaScript V8
com adaptador de `node:test` e `assert`, sendo 9 regressões existentes
e 4 novos testes (caso normal, overflow do caixa, do serviço da dívida
e do ICSD); **13 aprovados, 0 falhas**. Os arquivos foram relidos
diretamente da branch e os blobs conferidos:
`d7b365b490c8f02b8694294fd23eb51f5a2df9a0` (módulo) e
`ea3408c826492560dd778fb65ddbf0913b85a68a` (novo teste).
**Não houve execução nativa de `node --test` nem da suíte integral,
nem QA de interface.** Status GitHub do commit de regressão:
contexto Vercel `success`; não é comprovação de publicação em
produção e não houve ação manual de publicação.

**Prontidão: não pronto para testes integrados.** Os testes focados
passaram, mas a conciliação multissetorial é sintética e não substitui
revisão manual da DRE, balanço, DFC e FCADS contratual. A entrada
financeira antiga continua acessível sem o gate global de NCG;
a interface disponível é apenas cadastral. Segurança documental,
autorização institucional e rastreabilidade legal por exercício não
estão homologadas. Próxima ação: localizar e proteger o ponto de
entrada operacional antes de exibir qualquer projeção como validada,
sem publicação em produção ou alteração da `main`.

## Triagem CNAE multissetorial: agronegócio (31/10/2026)

Lacuna comprovada: CNAEs das divisões 01 (agropecuária), 02 (produção
florestal) e 03 (pesca e aquicultura) eram classificados como `geral`,
sem perguntas sobre sazonalidade e capital de giro. A triagem agora os
identifica como `agronegocio`, solicita dados de produção, receitas,
exportações, insumos, estoques e sazonalidade, e destaca a necessidade de
diferenciar produtor, agroindústria e operações com tratamento específico.
Uma empresa com CNAE agropecuário principal e indústria secundária mantém
as duas atividades separadas e exige alocação por operação.

Não foram criadas alíquotas, benefícios, créditos automáticos ou regras
tributárias por CNAE. A classificação é somente orientação para revisão
do analista, não homologação legal ou financeira. Locadoras continuam
apenas um dos setores testados, sem mudança de seu tratamento.

Commits: implementação `2032aebbe00b2a322fb556291140523a7a71263c`;
regressão `a760342a775c0af91e7d4df1a1e2cde25d467d64`.
Reprodução antes da correção: quatro testes novos falharam (0/4).
Após a correção: `node --test classificador-cnae.test.mjs
classificador-agronegocio.test.mjs` executado em Node 22.16.0,
**7 testes aprovados, 0 falhas**. Os dois blobs relidos da branch após
os commits coincidiram com `git hash-object` dos arquivos locais
testados: `9e7cba0172c7e0620982357201da552e38fe7d6a` e
`7c290cb60d050436ea699c88545c60bd2c92daef`.
A suíte completa do repositório não foi executada. Contexto GitHub
Vercel do commit de regressão: `success`, sem comprovação de publicação
em produção; nenhuma publicação manual foi autorizada ou realizada.

**Prontidão: não pronto para testes integrados.** Testes de triagem:
aprovados, mas sem homologação de todos os setores ou cenários contábeis.
Caixa e ICSD permanecem simplificados, sem DFC/FCADS contratual auditados;
a entrada financeira sem gate global da NCG segue acessível; interface
apenas cadastral; revisão legal por exercício, autorização institucional
e armazenamento privado documental não comprovados. Próxima prioridade:
proteger o fluxo operacional para impedir interpretação de simulação
sem conciliação como parecer validado. Não houve merge na `main`,
alteração intencional de produção, gastos ou uso de dados pessoais.

## Tolerância documental na auditoria isolada da NCG (31/10/2026)

O módulo `auditoria-origem-ncg.js` aceitava `tolerancia` arbitrária
quando chamado diretamente. Isso permitia classificar como
`conciliado_revisado` uma variação de NCG divergente dos dois balanços,
mesmo com evidências e revisão apenas declaradas. A entrada auditada já
limitava a tolerância, mas a função isolada permanecia permissiva.
A auditoria agora rejeita tolerâncias fora de 0 a 0,01, inclusive no
uso direto. Não há mudança em fórmulas, alíquotas, IBS, CBS ou ICSD.

Commits: correção `e07529383c6dcfb96881c75854cc8267b069b87f`;
regressão `182b2afd031bc2d4473a90cf03aae3d8582392ea`.
O novo teste falhou antes da correção (6 aprovados, 1 falha).
Depois: `npm test` em Node 22.16.0, diretório isolado com o módulo e
seus testes: **7 aprovados, 0 falhas**. Blobs relidos da branch após
os commits e conferidos com `git hash-object` dos arquivos testados:
`ccd2b947bfbab7d0571aeb84e3b4547b2b65bffe` e
`bcad82d1a6ca1c27d8e5059ed18e64fa6eef05af`.
Não foi executada a suíte integral do repositório.

**Prontidão: não pronto para testes integrados.** Cenários de oito setores
seguem sintéticos e sem homologação manual de DRE, balanço e DFC.
Caixa/ICSD ainda não representam FCADS contratual auditado. A entrada
financeira sem auditoria NCG continua acessível, a interface não
está integrada, a rastreabilidade legal não foi homologada e faltam
autorização institucional e armazenamento privado documental.
Próxima prioridade: isolar o fluxo operacional não auditado antes
de qualquer exibição de projeções como validadas. Não houve merge,
publicação em produção, uso de dados pessoais ou gasto.

## Proteção contra overflow de receitas multissetoriais (31/10/2026)

Na projeção por atividade, duas receitas individualmente finitas podiam
produzir `receitaTotal = Infinity`, mesmo quando os débitos individuais
de IBS e CBS permaneciam finitos. A função retornava essa receita inválida
ao consumidor. A correção em `atividades-ibs-cbs.js` rejeita receitas
projetadas, débitos por tributo e totais de receita não finitos antes de
entregar a projeção. Não modifica alíquotas, fórmulas, direitos a crédito,
regras legais nem compensação entre IBS e CBS.

Commits: implementação `322c32ed3007a8fc873899b154a14cf212d55357`;
regressão `62b441be0e1bede8b90dbcdcecdb47ea6390d4cf`.
Reprodução antes da correção: `npm test` em diretório isolado com Node 22,
**1 aprovado e 2 falhas**. Depois da correção: **3 testes nativos Node
aprovados, 0 falhas**, cobrindo overflow de receita consolidada, overflow
por crescimento e conciliação de oito atividades sintéticas com IBS/CBS
separados. Os arquivos locais testados têm os mesmos hashes Git blob
dos arquivos relidos da branch: `446f19846f732b0d9b18bc1335381b43b78f7d5f`
e `c5bbf7baeef7a29e034afe46c27a4dc5cb58d2b9`. Dependências
`ibs-cbs.js` e `creditos.js` também foram copiadas e conferidas
por hash. **A suíte completa do repositório não foi executada.** Verificação adicional: executados também os testes existentes de
`atividades-ibs-cbs.test.mjs` e `ibs-cbs.test.mjs` no mesmo ambiente
Node 22, totalizando **9 testes nativos aprovados, 0 falhas**. Hashes
conferidos: `30ea3ab437f4aa42b261ac538f227727499c09b0` e
`37d024bf51fdb0c991e9ea601d475b36d9a16ae6`.


**Prontidão: não pronto para testes integrados.** A regressão isolada
passou, mas não há homologação manual dos cenários setoriais, conciliação
completa de DFC/FCADS, validação contratual do ICSD, interface financeira
operacional, controle de acesso e armazenamento privado comprovados.
A entrada financeira antiga ainda permite simulações sem auditoria global
da NCG. A revisão legal por exercício permanece obrigatória.
Não houve merge na `main`, publicação ou alteração de produção.
