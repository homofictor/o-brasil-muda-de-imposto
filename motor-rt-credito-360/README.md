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


## Proteção da consolidação IBS/CBS contra overflow (31/10/2026)

A soma dos valores anuais de IBS e CBS podia produzir `Infinity` mesmo quando
cada conta-corrente isolada tinha valores finitos. A consolidação agora rejeita
resultados não finitos nos totais de débitos, créditos gerados e utilizados,
tributos a pagar e ressarcimentos recebidos, sem compensação cruzada nem
alteração das fórmulas ou regras tributárias. Falha reproduzida antes da
correção em três casos sintéticos de overflow; o cenário ordinário passou.

Commits: implementação `91cb1172b190c87bf5bc822a5fcb7b272afa2068`;
testes `ab7cb0848a2b8c74a98dce502690820cf17fe421`.
Após os commits, os módulos e testes foram relidos da branch; 9 testes
executados em JavaScript V8 com adaptação de `node:test` e
`node:assert/strict`: **9 aprovados, 0 falhas** (3 casos IBS/CBS
existentes, 2 casos de créditos existentes e 4 novos casos de consolidação).
Blobs verificados: módulo `4ff203eb1f6d91fbb6de686d4a76c36c4625cacb`, regressão
`603162530db454615f9ddb99d8f6038936cbf17e`.
**Não** houve execução nativa de `node --test`, suíte integral ou QA da interface.

**Prontidão: não pronto para testes integrados.** A conciliação setorial ainda
não foi homologada manualmente; DFC e ICSD contratual não estão auditados;
interface financeira não está integrada; revisão legal por exercício,
controle de acesso e armazenamento privado dos documentos permanecem
pendentes. A entrada financeira não auditada continua acessível.
Próxima ação: tornar explícito no fluxo operacional o bloqueio de validação
sem NCG documental e revisão institucional. Não houve merge, deploy manual,
uso de dados pessoais nem contratação de serviços nesta execução.

## Bloqueio explícito de ponte tributária já refletida no EBITDA (31/10/2026)

A auditoria da ponte tributária não sinaliza mais `autorizadoParaProjecao=true` quando os tributos sobre consumo já estão refletidos no EBITDA de ambos os cenários e não existe ajuste tributário de caixa autorizado (`null`). Agora registra alerta e retorna autorização falsa. A integração financeira já bloqueava caixa e ICSD nesse caso; suas fórmulas, valores e a segregação IBS/CBS não foram alterados.

Commits da entrega: correção `d4a5e215545b5e7f2e1ee59448aa4d9a55680281`, teste unitário `49990ee0a332386f159994a5eec6a119fb811a6e`, regressão de integração `65f09ad530efbbfc2f18f4469338a936bb7be63d`.

Verificação posterior às alterações: 13 testes executados em JavaScript V8 com adaptador de `node:test` e `assert` (4 da auditoria e 9 da integração), todos aprovados; 0 falhas. A falha foi reproduzida antes da correção. Não houve execução nativa de `node --test`, suíte completa nem QA da interface.

**Prontidão: não pronto para testes integrados.** Cenários multissetoriais continuam sintéticos e sem homologação manual; DFC e FCADS/ICSD contratual não estão conciliados; o caminho financeiro antigo permanece acessível sem gate global de NCG; a interface ainda não opera o fluxo financeiro; autorização e armazenamento privado de documentos não estão comprovados. Próxima ação: localizar e proteger o fluxo operacional efetivo contra exibição de projeções não auditadas como validadas. Nenhum merge ou deploy autorizado.


## Origem documental única por conta na auditoria NCG (31/10/2026)

Falha reproduzida antes da correção: duas contas do mesmo balanço
(clientes e estoques) podiam apontar para o mesmo documento e linha,
sem gerar pendência; o resultado era `conciliado_revisado`. A auditoria
`auditarOrigemNCG` agora rejeita a reutilização de um par
`documentoId + linhaOrigem` entre contas do **mesmo exercício**.
Permanece permitida a referência à mesma linha em balanços de exercícios
diferentes, pois podem existir colunas anuais no mesmo documento.
A entrada auditada bloqueia projeções quando essa duplicidade ocorre.
Não houve alteração de fórmulas de NCG, IBS, CBS, caixa ou ICSD.

Commits: código `ea9ea37062badce74cfa7e6ab6cc227a6f2301ea`;
testes da auditoria `f61bcdc23b70e1a22f7bb023becb93ed9d36037f`;
regressão da integração `66f8147e265e7c27fbc628a821d2c5d78e1bfc38`.
Verificação **após os commits**: 27 testes executados em JavaScript V8
com adaptação de `node:test` e `node:assert/strict`, 27 aprovados,
0 falhas. Foram relidos diretamente da branch os oito módulos necessários
e três arquivos de testes; os blobs alterados foram confirmados:
`916e02e4cf449522e675daca597b8d89ce085c1b` (auditoria),
`211a7c3e899ab75d4e9dbba87cbf5b58778f7b4c` (teste unitário),
`b98a273cddd7196cc5fa684fd72559c4740f54f2` (teste integração).
**Não** houve execução nativa de Node, suíte integral nem QA da interface.

**Prontidão: não pronto para testes integrados.** Cenários setoriais
continuam sintéticos e sem homologação manual; DFC e FCADS/ICSD contratual
não estão conciliados; interface financeira não está integrada; falta
controle de acesso, armazenamento privado e revisão legal por exercício.
O caminho financeiro sem gate global da NCG permanece acessível.
Próxima ação: localizar consumidores da ponte financeira e impedir que
projeções sem auditoria documental sejam exibidas como validadas.
Nenhum merge na `main`, deploy manual, gasto ou dado pessoal nesta entrega.


## Identificação explícita da auditoria NCG no resultado financeiro (31/10/2026)

Entrega limitada à identificação do caminho de execução, sem mudar fórmulas,
valores de IBS/CBS, caixa ou ICSD. A ponte direta
`integrarIBSCBSAoCredito` agora informa
`statusAuditoriaNCG: "nao_auditada"` no resultado e em cada exercício.
A entrada `integrarCreditoComNCGAuditada` informa
`statusAuditoriaNCG: "conciliada_documentalmente"` somente depois de
validar as evidências de todos os exercícios. Em ambos os casos,
`homologado` e `aptoParaParecer` permanecem falsos. A etiqueta de
conciliação da NCG não equivale a homologação de DFC, FCADS ou ICSD.

Commits: ponte direta `f14fd857ad90effb402e973e355951c7574e3e33`;
entrada auditada `b6f3e83f1f246fba13ebe9c384da84827ef86209`;
testes `0f78e421c4f2ffda601bb7bfd18c78ba1f3b8497`.
Verificação após commits: **29 testes aprovados, 0 falhas** em executor
JavaScript V8 com adaptações síncronas de `node:test` e `assert/strict`,
a partir de 8 módulos e 3 arquivos de teste relidos da branch.
A primeira execução do adaptador apresentou 1 erro por ausência de
`assert.notEqual` no próprio adaptador; após acrescentá-lo, 29/29 passaram.
Não houve execução nativa do Node nem da suíte completa.

**Prontidão: não pronto para testes integrados.** A ponte direta continua
tecnicamente acessível e não impõe auditoria documental da NCG; agora
expõe seu status para que consumidores não a confundam com projeção
conciliada. Não foi comprovado que todos os consumidores respeitem o campo.
Faltam conciliação completa da DFC, FCADS/ICSD contratual, validação
manual de cenários multissetoriais, interface financeira, controle de acesso
e armazenamento privado de documentos, além de revisão legal.
Próxima ação: localizar consumidores reais e impedir exibição como
resultado validado quando `statusAuditoriaNCG !== "conciliada_documentalmente"`.
Nenhum merge na main, deploy manual, uso de dados pessoais ou gastos.


## Bloqueio de aprovação de revisão contábil sem registros válidos (31/10/2026)

Falha reproduzida: `aprovarRevisaoContabil` liberava como revisada e
`aptoParaProjecao:true` uma extração sem linhas contábeis, bem como
um objeto de revisão sem a lista obrigatória de erros. A aprovação agora
exige estado `aguardando_revisao`, aptidão anterior falsa, listas
`erros` e `registros` presentes, ao menos uma linha válida e
valores finitos. Reaprovação de resultado já aprovado e linhas
adulteradas são rejeitadas. Não houve alteração de cálculos tributários,
caixa ou ICSD, nem implantação de armazenamento de documentos.

Commits: código `a364e3fc3fe5c8566bcb04a4cbb725c9d8b99730`;
testes `39b41b2a969aa7cf7f0e255e983cc2d81b40f07b`.
Regressão: três novos testes reproduziram a falha antes da correção;
após os commits, **6 testes aprovados, 0 falhas** em JavaScript V8,
com adaptação síncrona de `node:test` e `assert`. Blobs relidos
da branch e conferidos: código `cbd3db8d5c82414926c94073d67e6e8780c4da3d`,
testes `c3914e2b9676c0cb3f30f1648a8e291cd72be1ae`.
Não houve execução nativa de `node --test`, suíte integral ou QA de interface.

**Prontidão: não pronto para testes integrados.** A revisão permanece
declarativa e sem autenticação institucional. Falta armazenamento privado
e autorização documental efetivos; DFC e FCADS/ICSD contratual ainda
não foram conciliados; os cenários multissetoriais são sintéticos e
não homologados manualmente; a interface financeira não está integrada.
A ponte financeira direta continua acessível sem gate global de NCG.
Próxima ação: proteger o consumidor efetivo dos resultados não auditados
antes de habilitar qualquer parecer. Nenhum merge na `main`, deploy
manual, gasto ou uso de dados pessoais nesta entrega.

## Conciliação patrimonial: tolerância e overflow (31/10/2026)

Falha reproduzida em `demonstracoes.js`: `conciliarBalanco` aceitava
tolerância arbitrária (por exemplo, 1.000), permitindo classificar um
balanço divergente como conciliado. Valores de entrada individualmente
finitos também podiam gerar diferença infinita por overflow, sem rejeição.

Correção restrita à validação da tolerância (intervalo de 0 a 0,01) e
da diferença patrimonial finita. Nenhuma fórmula de IBS/CBS, caixa ou ICSD
foi alterada. Testes novos cobrem tolerância elevada, negativa, limite
permitido e overflow.

Commits: correção `db4f6734a92d56b53fdd18cc03cd8921fd024526`;
regressão `3a88b58fa650cb23a5226903b1ee43af06700932`.
Verificação após os commits: 6 testes do arquivo
`demonstracoes.test.mjs` executados em JavaScript V8 com adaptador
para `node:test` e `assert`, **6 aprovados, 0 falhas**.
Blobs relidos da branch: módulo
`e5b67ba14e0fb283c80fb9e2b831a8172eaffb5a` e testes
`a8b8dca25a67594480b679957e6025d9fcd1cd83`.
O comando nativo `node --test` e a suíte integral **não** foram
executados. Não houve QA de interface ou deploy confirmado.

**Prontidão: não pronto para testes integrados.** Os cenários setoriais
seguem sintéticos, sem conciliação manual e revisão legal por exercício.
DFC e FCADS/ICSD contratual não foram homologados; a interface
financeira não está integrada; controle de acesso, autorização e
armazenamento privado documental não foram comprovados. A entrada
financeira direta ainda permite NCG não auditada, embora rotulada.
Próxima ação: localizar consumidores efetivos da ponte financeira e
bloquear a apresentação de projeções com NCG não auditada como
resultados validados. Nenhum merge na `main`, alteração manual de
produção, uso de dados pessoais ou contratação de serviços nesta entrega.

## Componentes anuais explícitos na entrada com NCG auditada (31/10/2026)

A entrada `integrarCreditoComNCGAuditada` não aceita mais a omissão
silenciosa de CAPEX, impostos sobre resultado, juros ou amortizações em
qualquer exercício. Cada componente exige valor explícito, finito e não
negativo; zero declarado é permitido. A NCG permanece obrigatoriamente
conciliada por evidência documental. A entrada direta preliminar não foi
alterada, assim como fórmulas de IBS/CBS, caixa e ICSD. Isso evita que
ausência de dados seja confundida com despesa ou dívida zero no caminho
auditado. Não comprova elegibilidade tributária, origem documental dos
demais componentes ou FCADS contratual.

Commits: código `c2b44f43365f77a0b0cdc55c59a9a9944c917779`;
regressão `73cd713361a1439817f85c1c2c2a21b40ee0e266`.
O teste novo de ausência de componente falhou antes da correção;
após os commits, **32 testes aprovados, 0 falhas** em JavaScript V8
com adaptação síncrona de `node:test` e `assert/strict`: 14 da
entrada NCG auditada, 9 da ponte financeira e 9 da origem da NCG.
Os arquivos alterados foram relidos da branch, com blobs
`1845a580a40b12e0a9839cc87c0803b6127222b9` (código) e
`347e15571184205812794eb09e6c7907f9ed8be0` (testes).
Não foi executado `node --test` nativo, a suíte integral nem QA
de interface.

**Prontidão: não pronto para testes integrados.** A cobertura de oito
atividades é sintética e não homologada manualmente. Caixa e ICSD são
preliminares, sem conciliação completa da DFC ou FCADS contratual.
A interface atual é cadastral; faltam revisão legal por exercício,
controle de acesso, armazenamento privado e auditoria documental
institucional. A ponte financeira direta continua acessível com NCG
não auditada, embora identificada no resultado.
Próxima ação: localizar e proteger consumidores reais da ponte, sem
apresentar simulações não auditadas como resultados validados.
Sem merge na `main`, deploy manual, gasto ou dados pessoais.


## Proteção contra overflow na auditoria documental da NCG (31/10/2026)

Falha reproduzida: valores de saldos individualmente finitos podiam produzir
`Infinity` na NCG, na variação entre exercícios ou na diferença de
conciliação. O relatório retornava números não finitos, embora seu status
ficasse pendente. A correção rejeita essas três situações com erro explícito
antes de retornar qualquer relatório. Não modifica fórmulas de IBS/CBS,
caixa, ICSD, tolerâncias ou critérios documentais.

Commits: código `b8af54fda6aced9619ad6a0aaebf41668c4ab92f`;
testes `91c0d163058221117843fd7350e559779e31fbbd`.
Verificação após os commits: **35 testes aprovados, 0 falhas** em executor
JavaScript V8 com adaptação síncrona de `node:test` e `assert/strict`.
Foram executados 12 testes de origem da NCG, 9 da ponte IBS/CBS e 14
da entrada com NCG auditada. Os três novos casos de overflow foram
reproduzidos antes da correção. Arquivos relidos da branch:
código blob `5828a09dad971b5bd25df5c6bf6dcb0fa9a458a7`;
testes blob `992dd852082ad6793124d834b3b51eef30626802`.
Não foi executado `node --test` nativo, a suíte integral nem QA da interface.

**Prontidão: não pronto para testes integrados.** A cobertura setorial
permanece sintética, sem conciliação manual homologada. Caixa e ICSD são
preliminares e não substituem DFC e FCADS contratual. Interface financeira,
revisão legal por exercício, autenticação institucional, autorização e
armazenamento privado de documentos continuam pendentes. A entrada direta
ainda permite NCG não auditada, embora a identifique.
Próxima ação: localizar e proteger consumidores reais das projeções para
impedir apresentação de resultados não auditados como validados.
Sem merge na `main`, deploy manual, dados pessoais ou gastos.


## Indicadores financeiros finitos na projeção (31/10/2026)

**Objetivo e falha reproduzida:** a função
`calcularIndicadoresFinanceiros` aceitava entradas individualmente finitas
que geravam `Infinity` em razões financeiras (inclusive ICSD e margem
EBITDA), dívida líquida, fluxo de caixa livre e endividamento geral.
Exemplos sintéticos: `1e308 / 1e-308` e `1e308 - (-1e308)`.
Antes da correção, esses indicadores retornavam `Infinity`.

**Entrega:** cálculos aritméticos não finitos passam a retornar `null`
(indicador indisponível), com aviso explícito de cálculo não finito.
Dados ausentes continuam `null`; nenhum valor é presumido como zero.
Fórmulas tributárias, segregação IBS/CBS, projeções de caixa e ICSD
projetado não foram alterados. O controle é setorialmente neutro.

**Commits:** correção `9fc4ca0f62d402bc84fc1041cbe5d6acba43130f`;
regressão `fd3e2a9e007352b4376e7e4f961a5076154f10c4`.
**Verificação após commits:** arquivos relidos da branch autorizada.
Blobs: `indicadores-financeiros.js`
`6e0e0a540502c27a3b9671244e25148c5360c24c`;
`indicadores-financeiros.test.mjs`
`fbec830b3ff57265ed35ee27fa27445b3692c36a`.
Foram executados **28 testes em JavaScript V8, 28 aprovados e 0 falhas**:
5 de indicadores (3 anteriores e 2 novos), 9 da ponte IBS/CBS e
14 da entrada com NCG auditada, usando 8 módulos da branch e adaptação
síncrona de `node:test` e `node:assert/strict`.
**Não** houve execução nativa do comando `node --test`, suíte integral,
teste de banco, QA de interface ou comprovação de deploy.

**Critérios de prontidão:** testes focados passaram, mas cenários de
comércio, indústria, serviços, construção, saúde, transporte, agronegócio
e empresa multissetorial continuam sintéticos, sem homologação manual.
Caixa e ICSD da entrada auditada têm memória preliminar, não DFC
conciliada ou FCADS contratual validado. A interface é cadastral,
não financeira; faltam rastreabilidade jurídica por exercício,
autenticação institucional, autorização e armazenamento privado de
documentos. A entrada direta sem gate documental de NCG continua
acessível e identificada como `nao_auditada`.
**Não pronto para testes integrados.**

**Próxima ação exata:** localizar o primeiro consumidor operacional
de projeções e impedir que a entrada sem auditoria da NCG ou resultados
não homologados sejam exibidos como validados, sem publicar interface
financeira antes da segurança documental. Sem merge na `main`,
publicação manual, gastos ou dados pessoais.

## Revisão booleana obrigatória na ponte tributária (31/10/2026)

**Falha reproduzida:** `auditarPonteTributaria` usava a condição
`!validadoPorAnalista`. Valores truthy não booleanos, como `"true"`,
`1`, `{}` ou `[]`, eram aceitos como revisão declarada. Em cenário
com EBITDA documentado antes dos tributos, isso autorizava indevidamente
a projeção de caixa e ICSD. A verificação prévia executou 29 testes
em JavaScript V8, com **27 aprovados e 2 falhas** nos novos casos
de regressão.

**Correção:** somente `validadoPorAnalista === true` autoriza a
revisão na ponte tributária. Entradas não booleanas geram alerta de
revisão pendente e mantêm caixa e ICSD indisponíveis. A regra é neutra
quanto ao setor. Não foram alterados cálculos, alíquotas, segregação
IBS/CBS, fórmulas de caixa ou ICSD.

**Commits reais na branch autorizada:**
código `c24983a8810746b72d01236a18cb0e39fb332a33`;
teste unitário `585825d01480198a699a3238c0cce6db7fceb9d2`;
teste de integração `2edd1c7cecbe05c57a60c67cab7368f7b8a4d470`.

**Verificação posterior aos commits:** os onze arquivos dos módulos
e testes utilizados foram relidos diretamente da branch. Os blobs
alterados são `9108fe08f9d400d1266b2f2d10060cf308a55cf6`
(código), `2b171e4718e1dcc343d97cd6e3ab9327d446d402`
(teste unitário) e `e53249a9fc8c3820f756eef6b92aef5d75c9ec23`
(teste de integração). Foram executados **29 testes, 29 aprovados,
0 falhas**, em JavaScript V8 com adaptador síncrono de `node:test`
e `assert/strict`: 5 de auditoria tributária, 10 de integração
IBS/CBS com caixa e ICSD e 14 da entrada com NCG auditada.
Não foi executado `node --test` nativo, a suíte integral, testes
de banco ou QA de interface. Nenhum deploy foi confirmado.

**Prontidão: não pronto para testes integrados de aceitação.**
Os cenários de comércio, indústria, serviços, construção civil, saúde,
transporte, agronegócio e empresa multissetorial continuam sintéticos
e não homologados manualmente. Caixa e ICSD permanecem preliminares,
sem DFC integral conciliada nem FCADS contratual validado.
A interface financeira não está integrada e faltam rastreabilidade
jurídica por exercício, autenticação institucional, autorização e
armazenamento privado dos documentos. A entrada direta ainda permite
NCG não auditada, embora rotulada como `nao_auditada`.

**Próxima ação exata:** localizar o consumidor operacional efetivo
da ponte e exigir a interpretação explícita de
`statusAuditoriaNCG`, `homologado` e `aptoParaParecer` antes de
qualquer apresentação como resultado validado. Sem merge na `main`,
publicação manual, gastos ou dados pessoais.

## Ajuste tributário indisponível sem evidência e revisão (01/11/2026)

**Falha reproduzida:** a auditoria da ponte podia retornar um valor monetário
em `ajusteTributarioCaixa` mesmo com `autorizadoParaProjecao: false`, por
falta de evidência ou revisão do analista. Um consumidor que utilizasse o
ajuste sem verificar a autorização poderia incorporar tributo não auditado
no fluxo de caixa e no ICSD. Evidência com tipo objeto também provocava
exceção inesperada em `.trim()`.

**Correção:** `ajusteTributarioCaixa` agora é `null` enquanto não houver
memória contábil textual não vazia, revisão booleana explícita e bases
comparáveis pré-tributos. Evidências malformadas geram alerta em vez de
exceção de tipo. A segregação IBS/CBS e as fórmulas financeiras não foram
alteradas. O resultado continua preliminar e não homologado.

**Commits na branch exclusiva:** código
`edc3896e52ed44717d330cb875e1e9665722d94f` e teste
`ace2fcae432ab24fb0c55a0460b57e5f452cdb51`.
Blobs confirmados por releitura no GitHub e `git hash-object` da cópia
executada: código `524fd75bb52aa1510ee557753e3e4a4fd64c3aeb`,
teste `b4c8d94de719475e54ddc2ed6f68558e390e3d8d`.

**Testes realmente executados:** Node.js v22.16.0,
`node --test auditoria-ponte-tributaria.test.mjs` em cópia local isolada
dos arquivos com blobs idênticos aos do GitHub. Antes da correção:
5 aprovados, 1 reprovado. Após os commits e conferência de blobs:
**6 aprovados, 0 reprovados**. Não foi executada a suíte integral,
integração com banco, QA de interface ou teste em produção.

**Prontidão:** não pronto para testes integrados de aceitação. A matriz
multissetorial continua sem homologação manual por setor, DFC e FCADS
contratual não foram conciliados, o ICSD permanece preliminar, a interface
financeira não está integrada e faltam controles institucionais de acesso,
armazenamento privado de documentos e revisão jurídica por exercício.
A entrada direta ainda produz projeções com NCG não auditada, identificadas
como `nao_auditada`; nenhum consumidor operacional de projeções foi
confirmado nesta execução. Próxima prioridade: bloquear apresentação de
resultados não auditados como validados no primeiro consumidor real.
Nenhum merge na `main`, publicação em produção, dado pessoal ou gasto.

## MVP financeiro navegável, demonstração sintética (01/11/2026)

**Entrega prioritária:** criada a página `motor-rt-credito-360/mvp.html`,
acessível a partir do cadastro `index.html`. O adaptador
`mvp-cenario.js` transforma receitas e alíquotas hipotéticas de oito
atividades (comércio, indústria, serviços, construção, saúde, transporte,
agronegócio e empresa multissetorial) em entrada para o motor existente
`integrarCreditoComNCGAuditada`. A tela permite alterar receita por
atividade, IBS e CBS separados, EBITDA pré-tributos, CAPEX, impostos sobre
resultado, juros, amortizações e seis saldos de balanço para NCG. Exibe
caixa, ICSD indicativo, tributos por conta e memória de conciliação.

O cálculo é bloqueado até três confirmações explícitas, separadas para
DRE, ponte tributária sem dupla contagem e NCG. Mesmo após a confirmação,
`homologado` e `aptoParaParecer` permanecem falsos. A origem da NCG é
**inteiramente sintética**: a marcação de revisão nesta página não
autentica analista nem valida documentos reais. Não há upload, gravação,
persistência ou processamento de dados pessoais nesta página. O importador
existente de PDF, XLS/XLSX, CSV e revisão de candidatos permanece no
Simulador RT v3.2, acessível por navegação, sem leitor duplicado. **A
transferência dos candidatos importados para o motor ainda não está
integrada**, pois exige mapeamento e revisão documental seguros.

**Commits da entrega na branch `feature/motor-rt-credito-360`:**
adaptador `9bc88c36925a98030c72b1fe76c2feda3c0891b4`;
testes `3f5001eda11f6e5b2ea89bc19196742d8aedabcd`;
interface `2e4f4e4e60a18473ca44f3bc5b8e30b04bfe1974`;
correção da interpolação HTML `189e019452ab276ba573ef0a3e0ea3442ccbf3cc`;
navegação `b806e9b9ec757aed06dd89e7e58896ad8243694c`.

**Testes efetivamente executados:** Node.js 22.16.0,
`node --test mvp-cenario.test.mjs` em cópia local isolada:
**5 aprovados, 0 falhas**. Os blobs Git do adaptador
`2b4030928aa614238c7d2be1a4bea42a3bd32bcf`, dos testes
`f14c0d1e372daabcd0a4a56b527d2c44e0c9ded5` e do HTML
`ef7f4e09d20b2cb5cacd2cdef3349be9f84e27b8`
coincidiram com `git hash-object` dos arquivos locais.
O script da interface passou em `node --check` local.
Adicionalmente, foi executada integração em JavaScript V8 com os
**nove módulos reais relidos da branch**, obtendo receita 800,
IBS 40, CBS 24, caixa da reforma 61 e ICSD 1,525, com NCG
documental sintética conciliada e `homologado:false`.
Esta verificação de integração **não foi `node --test` nativo**.
A suíte integral, QA visual/interativo no navegador e auditoria
institucional não foram executados.

**Preview Vercel automático:** deploy
`dpl_EjpxKHNyYE7WuHnydi5b4bhDroUs`, commit
`b806e9b9ec757aed06dd89e7e58896ad8243694c`,
ambiente preview (`target:null`), estado **READY**.
A Vercel retornou **HTTP 200** ao consultar a página
`/motor-rt-credito-360/mvp.html`, o adaptador, a integração
financeira, o cadastro e a página do importador v3.2, mediante acesso
autenticado à implantação protegida. O projeto exige autenticação
Vercel nas prévias. Foi emitido link temporário de compartilhamento
para teste; **o segredo de compartilhamento não é registrado no Git**.
Acesso externo em navegador não autenticado e execução de cliques
não foram comprovados nesta execução.

**Critérios de prontidão:** há uma interface navegável com dados
sintéticos e testes focados aprovados. **Não é homologação para
análise real de crédito**. Persistem ausência de integração do
importador com revisão de candidatos, conciliação integral da DFC,
FCADS/ICSD contratual, auditoria jurídica de alíquotas e créditos,
autenticação institucional, autorização e armazenamento privado de
documentos, além da homologação manual dos oito setores.
Próxima prioridade: testar interação real da página e ligar
candidatos revisados do importador existente ao formulário sem
duplicar leitura de arquivos. Não houve merge na `main`,
publicação em produção, gastos ou dados pessoais.

## Invalidação de revisões após edição no MVP (01/11/2026)

**Entrega:** a interface financeira sintética não conserva mais as três
confirmações de revisão quando o usuário modifica receitas, alíquotas,
EBITDA, CAPEX, juros, amortizações, impostos ou saldos da NCG.
Eventos `input` e `change` nos grupos financeiro, atividades e NCG
desmarcam as três revisões, ocultam resultados anteriores e exigem
nova conferência. Alterações nos próprios checkboxes após um cálculo
também ocultam resultados anteriores. Não há mudança de fórmula,
alíquota legal, dados ou integração documental.

**Commits reais na branch exclusiva:** módulo de proteção
`0ce764bee3b33afb2b3f2a2cfd223efff5b21b7a`,
testes `7c242c6a08846504eac32bbadcc18ec87877f0f1`,
integração da interface `9e438b88f4c8aeb73e7e384ed873f46b173760be`.
Blobs relidos do GitHub e confrontados com `git hash-object` da
cópia executada: módulo
`b2b7dc32641a98ab360a074872f6ad1a93509a19`;
testes `cf281579b576626715b4df6ded77119600c8588b`.
HTML integrado blob `e70ab37016acd4719cb68e4ce929db098fc84c9f`.

**Verificação realmente executada:** Node.js v22.16.0,
`node --test mvp-revisao.test.mjs`, **4 testes aprovados,
0 falhas**. O módulo passou em `node --check`.
Cobertura: alteração dos três grupos, evento `change`, alteração
de revisão após cálculo e ausência de falso alerta na edição inicial.
Os testes usam elementos `EventTarget` simulados, não um navegador.
Não foram executados a suíte integral, cliques reais em navegador,
conciliação manual multissetorial nem testes institucionais de segurança.

**Preview:** a Vercel recebeu deploy automático
`dpl_34NTv9Zrs34bS5TTBFH2atteiDpm` para o commit de interface,
na branch correta, alvo preview (`target:null`). No instante
da consulta estava `BUILDING`, portanto a nova versão não foi
declarada acessível ou publicada com sucesso nesta verificação.

**Bloqueios e próxima ação:** o MVP anterior já possui demonstração
sintética navegável, mas falta validar a interação real em navegador
e integrar somente candidatos documentais revisados do importador
existente `simulador/v3/import.js`, sem duplicar leitores.
DFC/FCADS contratual, ICSD auditável, controles institucionais de
documentos, revisão jurídica por exercício e homologação manual
dos setores seguem pendentes. Não usar para parecer de crédito.
Não houve merge na `main`, alteração da produção, gasto ou dado pessoal.

### Confirmação posterior do preview da correção (01/11/2026)

O deployment automático `dpl_34NTv9Zrs34bS5TTBFH2atteiDpm`
do commit `9e438b88f4c8aeb73e7e384ed873f46b173760be`
atingiu **READY**, ambiente **preview**, sem promoção à produção.
Com acesso autorizado ao deployment protegido, a Vercel retornou
**HTTP 200** para `/motor-rt-credito-360/mvp.html`,
`mvp-revisao.js`, `mvp-cenario.js`,
`integracao-ncg-auditada.js` e `/simulador/v3/index.html`.
O HTML servido contém a chamada de invalidação de revisões.
Foi obtido link de compartilhamento temporário, não armazenado neste
repositório. A confirmação HTTP não substitui teste interativo real
em navegador; a interface segue apenas como demonstração sintética.


## Ponte de candidatos revisados v3.2 para o MVP (01/11/2026)

**Entrega prioritária:** o MVP agora abre o importador documental **já existente**
em `simulador/v3/index.html` com canal temporário `BroadcastChannel`.
A página do v3.2, sem modificar `import.js` ou duplicar leitores de PDF,
XLS/XLSX e CSV, mostra botão para enviar **somente candidatos numéricos
explicitamente aceitos** pelo usuário. A ponte não transmite documentos,
nomes de arquivos, fontes documentais, CNPJ ou identificações. Não grava
os dados no backend nem na sessão do Motor. O v3.2 mantém seu
comportamento preexistente de armazenamento local independente.

O Motor mostra os candidatos para conferência. Somente a despesa
financeira (`interestExpense`) pode preencher uma premissa do MVP,
mediante confirmação adicional de período e unidade. Se o documento
cobre menos de 12 meses, anualiza linearmente uma única vez
(`valor * 12 / meses`); período ausente impede preenchimento. Receita
bruta/RBT12 **não** é confundida com receita líquida, nem ativo/passivo
circulante com NCG. A edição de juros dispara invalidação das três
revisões contábeis anteriores e dos resultados. Esta ponte é
**experimental** e não torna as demonstrações importadas auditadas.

**Commits exclusivos da branch:** ponte
`47357043d3db846d00f2ceebcf760cd209b382a0`; testes
`9852e25cbb91fe389afd02de67dd24655f2d611c`; interface
`59fb294c62a94d2fc12a495288bcd25dfd116861`; carregamento
no importador existente
`7a301326f457e02bd30de0fc4e491cf751fcc229`.

**Testes nativos realmente executados:** Node.js v22.16.0,
`node --test mvp-import-bridge.test.mjs`, **5 aprovados, 0 falhas**.
`node --check mvp-import-bridge.js` também passou. Os hashes Git
dos arquivos locais testados coincidiram com os blobs relidos na branch:
`a5a06389ebbcf1a81b505fc960f66a8100c81f4d` (ponte) e
`2585ae28f740f89af179daf570b6006796143ab8` (testes).
Cobertura: revisão explícita, descarte de CNPJ/fonte, conflitos,
dados não finitos, períodos inválidos, anualização e proibição
de mapear receita bruta ou ativos circulantes como receita líquida/NCG.
Não foram executados testes reais de duas abas em navegador nem
suíte integral.

**Preview verificado:** deployment automático
`dpl_AWm7pUeWygStRMBXfR8YtbNrse4N`, commit
`7a301326f457e02bd30de0fc4e491cf751fcc229`,
estado **READY**, alvo preview, sem promoção à produção.
Com acesso autorizado, a Vercel respondeu **HTTP 200** para
`/motor-rt-credito-360/mvp.html`,
`/motor-rt-credito-360/mvp-import-bridge.js`,
`/simulador/v3/index.html` e `/simulador/v3/import.js`.
O link temporário de compartilhamento não é gravado neste README.

**Bloqueios:** interação ponta a ponta em duas abas ainda não
homologada em navegador, compatibilidade de período e unidade monetária
dependem do analista, DFC e FCADS/ICSD contratual não conciliados,
regras legais e matriz multissetorial não homologadas, ausência de
controles institucionais para documentos reais. Nenhum resultado
constitui parecer validado. Próxima prioridade: teste interativo real
de importação e revisão, seguido de conciliação do caixa e ICSD com
dados sintéticos. Não houve merge na `main`, alteração da produção,
gastos ou utilização de dados pessoais nesta entrega.


## Invalidação de candidatos pendentes ao reabrir o importador (01/11/2026)

**Correção pontual do MVP:** ao iniciar nova sessão de transferência do
Simulador RT v3.2, o Motor fecha o canal anterior, descarta os candidatos
pendentes, oculta a tabela anterior, desmarca a confirmação de juros importados
e desabilita o botão de aplicação até receber novo pacote aceito. Isso impede
que candidatos de uma importação anterior sejam aplicados por engano depois
de abrir outra aba. Juros já aplicados como premissa financeira **não são
alterados silenciosamente**. O importador existente em
`simulador/v3/import.js` não foi modificado nem duplicado.

**Commits na branch exclusiva:**
código `c4755e40002435e2fb1941deba5f09aec2338be3`;
regressão `f7e11f8aa3d3381c12503a4034e6fc612f51808d`;
interface `577630a87dfad9b3a7cfed247d33e8f8ee3cc92d`.
Hashes dos blobs de código e teste conferidos com a cópia local executada:
`1f1c24287321cc72b50a75353137bbf12f0e6056` e
`233ade3b7314f101ddefc8eaf71c9de6c3522b84`.

**Testes realmente executados:** Node.js v22.16.0,
`node --test mvp-import-bridge.test.mjs`: **6 aprovados, 0 falhas**.
O novo teste reproduziu a falha antes da correção (**5 aprovados,
1 falha**) e passou depois. Também passou
`node --check mvp-import-bridge.js`.
O teste usa eventos e canais simulados em Node, não interação real
em duas abas. A interface foi inspecionada no código e a publicação
dos arquivos HTML/JS foi verificada por HTTP, mas não houve QA
interativo em navegador nem execução da suíte integral.

**Preview verificado:** deployment `dpl_9rNRBxRRwBdiZzYtmtPzBZGZ9cSX`
da branch `feature/motor-rt-credito-360`, commit
`577630a87dfad9b3a7cfed247d33e8f8ee3cc92d`, estado
**READY**, alvo preview (`target:null`). Com acesso autorizado
à implantação protegida, a Vercel respondeu **HTTP 200** para
`/motor-rt-credito-360/mvp.html`,
`/motor-rt-credito-360/mvp-import-bridge.js`,
`/simulador/v3/index.html` e `/simulador/v3/import.js`.
O HTML e o módulo servidos contêm a correção. Link de compartilhamento
temporário obtido, sem registrar o token no Git.

**Bloqueios:** sem teste ponta a ponta com cliques em navegador;
DFC/FCADS e ICSD contratual ainda não conciliados, documentação
institucional sem controle de acesso/armazenamento privado, regras
legais por exercício e homologação manual multissetorial pendentes.
A interface continua **somente sintética, não homologada para crédito**.
Próxima prioridade: validar interação real entre abas e conciliar caixa,
IBS/CBS e ICSD com casos sintéticos multissetoriais. Nenhum merge
na `main`, alteração de produção, gasto ou dado pessoal.


## Confirmação efetiva da transferência local entre abas (01/11/2026)

**Entrega prioritária do MVP:** a interface do importador v3.2 não afirma
mais que os candidatos chegaram ao Motor apenas porque `postMessage`
foi chamado. A ponte `mvp-import-bridge.js` agora usa o módulo
`mvp-confirmacao-transferencia.js` para identificar cada envio por
número efêmero, aguardar confirmação de recebimento da aba do Motor,
recusar confirmações atrasadas e avisar após 5 segundos quando o
recebimento não foi confirmado. O Motor responde **somente depois**
de validar o pacote e entregar os candidatos ao formulário de revisão.
A mensagem de êxito não representa conciliação ou auditoria contábil.
O protocolo não inclui arquivos, CNPJ, fontes ou nomes de documentos.

**Commits reais exclusivamente na branch:**
módulo `b193b78059cd42703b8e80ac2314eca37dc788e9`;
testes `74fb5b3e86d044cf171dcdf6544ac3cd4bdab760`;
integração `1457c8be1e13cd35bfa0c756377f7bfb832777c8`;
teste de troca entre abas simuladas
`5eeb61bb9e08d1abecc34b870032595137f49b64`.

**Testes realmente executados:** Node.js v22.16.0,
`node --check mvp-confirmacao-transferencia.js` aprovado e
`node --test mvp-confirmacao-transferencia.test.mjs` com
**6 aprovados, 0 falhas**. Cobertura: confirmação correlacionada,
ausência de destinatário, resposta atrasada, identificadores inválidos,
falha de canal e troca entre duas abas simuladas.
Os blobs Git relidos coincidem com `git hash-object` dos arquivos
executados: módulo `74ef530da21e0444d41de98b7842bc5d5c0c4307`;
testes `87ef0c2de3cc1a9774085ee1c6fef5f49ee14740`.
A suíte integral e a interação em navegador real **não** foram executadas.

**Preview:** deployment automático `dpl_BWtFX6wKjKhGzXmE97Yho8Nirmja`
do commit de integração `1457c8be1e13cd35bfa0c756377f7bfb832777c8`
confirmado **READY**, alvo preview, branch correta.
Com acesso autorizado ao ambiente protegido, a Vercel respondeu
**HTTP 200** para `mvp.html`, `mvp-import-bridge.js`,
`mvp-confirmacao-transferencia.js` e `simulador/v3/index.html`.
Não houve teste de cliques reais em duas abas. Links temporários de
compartilhamento não são armazenados no repositório.

**Bloqueios:** conciliação integral da DFC, FCADS/ICSD contratual,
homologação dos oito setores e das regras legais, autorização e
armazenamento privado de documentos e QA interativo permanecem
pendentes. Apenas simulação sintética, nunca parecer validado.
**Próxima prioridade:** executar QA real da transferência em navegador
e conferir a conciliação IBS/CBS, caixa e ICSD com cenários sintéticos
multissetoriais. Nenhum merge na `main`, publicação em produção,
dado pessoal ou gasto adicional.


## Validação do identificador de envio no importador MVP (01/11/2026)

Entrega pontual na interface multissetorial de demonstração: o receptor da
ponte local com o importador v3.2 passa a recusar pacotes sem `envioId`
inteiro seguro e positivo **antes** de exibir candidatos ou tentar confirmar
recebimento. O protocolo de confirmação existente é preservado. Não houve
mudança de leitores PDF/XLSX/CSV, regras IBS/CBS, fórmulas de caixa/ICSD ou
tratamento de dados reais.

Commits: correção `3a85766744bc529bf5e33dcbc005edf9a7983fc0`;
atualização de teste existente `70e190efddb5f55b45c888a7e6841c182ea237b7`;
novo teste `3f181011fff3ec9acea62df5d3883bf98672818e`.
Blobs relidos da branch e conferidos com `git hash-object` dos arquivos
locais testados: ponte `2dc2836980eec782472aba6d7111a56a82b72047`,
teste existente `20e5391d8e9b9f09b3f283d088beabff6c42f9ff`,
novo teste `c7c40e073790ad69c6de6e082c4cea97fb0af271`.
Dependência de confirmação também conferida por SHA
`74ef530da21e0444d41de98b7842bc5d5c0c4307`.

Teste nativo: Node.js 22.16.0, comando
`node --test mvp-import-bridge.test.mjs recepcao-id.test.mjs`
em cópia local idêntica aos blobs citados (o segundo arquivo está no
repositório como `mvp-recepcao-id.test.mjs`): **7 aprovados, 0 falhas**.
O teste novo falhou contra o módulo original e passou após a correção.
Não foi executada a suíte integral, nem homologada interação real em navegador.

Prontidão: interface sintética existente, mas não homologada para crédito.
Cenários multissetoriais e conciliação integral da DFC ainda pendentes;
caixa e ICSD são indicativos e não contratuais. Persistem revisão legal
por exercício, controles institucionais de documentos e QA completo.
Próxima ação: verificar em navegador a ida e volta entre abas e a
conciliação de IBS, CBS, NCG, caixa e ICSD com cenários sintéticos.
Sem merge na `main`, alteração de produção, dados pessoais ou gastos.


## Proteção contra pacotes atrasados ou repetidos na transferência v3.2 (01/11/2026)

**Entrega pequena e verificável:** o receptor do MVP agora registra o maior
`envioId` efetivamente aceito na sessão de importação e rejeita mensagens
com identificador igual ou inferior. Pacotes atrasados ou repetidos não
substituem os candidatos mais recentes nem recebem nova confirmação de
entrega. Um pacote inválido não avança o contador, e a abertura de uma nova
sessão reinicia a sequência. O importador original
`simulador/v3/import.js` não foi modificado; nenhum leitor foi duplicado.

**Commits na branch exclusiva:**
correção `49bf597ac5836ec58c4355893c3e1bc5eecb2cc2`;
regressão `e5f8fabb2a4919c6dc6366a409aba75c4baf3e29`.
Blobs relidos da branch e conferidos com `git hash-object` das cópias
locais executadas: ponte `d369a6e9cd9b15d1430f55e73308b2626c8cb995`;
novo teste `d137218f6f522b41c93ff501bfdb9d1792077bcb`.
O teste anterior também foi conferido:
`20e5391d8e9b9f09b3f283d088beabff6c42f9ff`.

**Testes nativos efetivamente executados:** Node.js 22.16.0,
`node --check mvp-import-bridge.js` aprovado;
`node --test mvp-import-bridge.test.mjs mvp-ordem-transferencia.test.mjs`,
**7 aprovados, 0 falhas**. O teste novo falhou antes da correção
(1 falha, 0 aprovados) e passou depois. Cobre replay, ordem inversa,
rejeição de pacote inválido e reinício de sessão. Os testes usam
`EventTarget` e canais simulados, não navegador real. Não foi executada
a suíte integral do repositório.

**Preview isolado:** deployment automático da correção
`dpl_BpFKxjWciMSj4kWKp1LrdMSNN3pc`, commit `49bf597`,
confirmado `READY` na branch `feature/motor-rt-credito-360`,
alvo preview (`target:null`). A Vercel respondeu HTTP 200 para
`/motor-rt-credito-360/mvp.html` e
`/motor-rt-credito-360/mvp-import-bridge.js`, contendo a proteção
nova. Não houve verificação de cliques reais entre abas. O deployment
do commit de testes estava `BUILDING` na primeira consulta, portanto
seu estado final não foi afirmado aqui.

**Prontidão e bloqueios:** MVP sintético navegável, sem homologação
para parecer de crédito. Continuam pendentes QA real entre abas,
conciliação integral da DFC, FCADS/ICSD contratual, homologação manual
multissetorial e legal, autorização institucional e armazenamento privado
de documentos. Próxima ação prioritária: validar interação real entre
abas e conferir IBS, CBS, NCG, caixa e ICSD por cenário sintético.
Não houve merge na `main`, promoção à produção, gastos ou uso de
dados pessoais nesta entrega.


## Classificação correta do cenário multissetorial no MVP (01/11/2026)

**Entrega pontual:** a categoria "Empresa multissetorial" deixou de ser
tratada como uma oitava atividade econômica fictícia com receita e
alíquotas próprias. O exemplo mantém oito atividades reais da matriz
de escopo: comércio, indústria, serviços, construção, saúde, transporte,
agronegócio e locação (somente caso de teste). A empresa multissetorial
é representada pela composição de duas ou mais atividades, cada uma com
receita e alíquotas hipotéticas de IBS e CBS independentes. A interface
explicita essa distinção. Não foram alterados o importador v3.2, as
fórmulas de caixa/ICSD, o cálculo de créditos nem o tratamento legal.

**Commits na branch autorizada:** adaptação
`bcf0854c8a579e8a9dab4517aadacbf7ef6a26f9`; regressão
`e0bf2af1361f7b17457e2a5898307bf15c4927d9`; esclarecimento
na interface `26ecd4e79d4ed6c3bc008702d73539c8f24fa180`.
Blobs da adaptação e regressão relidos no GitHub e conferidos com
`git hash-object` dos arquivos efetivamente testados:
`48f75fe7c8b85a9b97d1ef4ca9c7b1b72b385a0f` e
`c538d82a986bb853ee9783c9129d436f08377191`.
O teste preexistente também coincidiu com seu blob
`f14c0d1e372daabcd0a4a56b527d2c44e0c9ded5`.

**Testes nativos executados:** Node.js v22.16.0,
`node --check mvp-cenario.js` aprovado e
`node --test mvp-cenario.test.mjs mvp-setores-reais.test.mjs`:
**8 aprovados, 0 falhas**. Os três casos novos verificam que
"multissetorial" não é uma atividade tributável, que receitas e
alíquotas IBS/CBS permanecem segregadas em uma empresa com comércio
e indústria, e que locação não recebe tratamento especial. Não foi
executada a suíte integral nem o QA interativo em navegador.

**Preview da implementação:** deployment
`dpl_4wN9ZqA4PaBeuZMd9YfHjNLeVqAX`, commit de interface
`26ecd4e`, confirmado **READY** e associado à branch autorizada,
sem promoção à produção. Com acesso autorizado, a Vercel respondeu
**HTTP 200** para `mvp.html`, `mvp-cenario.js`,
`mvp-setores-reais.test.mjs` e `simulador/v3/import.js`.
O código publicado contém a substituição. Não houve teste de cliques
reais, e link temporário de compartilhamento não é registrado no Git.

**Prontidão:** interface sintética navegável e testes focados aprovados;
cenários multissetoriais sem homologação manual completa; caixa/ICSD
indicativos, sem DFC integral ou FCADS contratual; controles de acesso,
armazenamento privado e auditoria institucional de documentos não
comprovados; rastreabilidade legal por exercício pendente. A simulação
não é parecer validado. Próxima ação: QA de interação real entre abas
e conciliação financeira sintética por setor, sem ampliar funcionalidades.
Não houve merge na `main`, alteração de produção, gasto ou uso de dados
pessoais.

## Conciliação independente da memória de caixa do MVP (01/11/2026)

O MVP passa a executar `validarMemoriaCaixaMVP` antes de exibir qualquer
resultado financeiro. A verificação independente recompõe o caixa a partir
de EBITDA, CAPEX, variação da NCG, impostos sobre resultado, tributo de
referência, IBS e CBS separados e ressarcimentos efetivamente recebidos.
Também confere serviço da dívida (juros + amortizações), ICSD de cada
cenário, variação do caixa, total IBS + CBS e as conciliações individuais
das contas tributárias. Divergências superiores a 0,01, valores não
finitos ou ICSD indevido quando não há serviço da dívida bloqueiam a
exibição. A memória visível apresenta a decomposição e o status
"Conciliado somente para simulação sintética".

Commits: verificador `af34e0ad35a370562953f5740b8f7816627d569a`,
regressões `7e1c4cc88111b10426db157b3a154442f179e5f8`,
integração de interface `efaaf30478a717a2341ae03ff60d92776e520be1`.
Teste executado em Node.js 22.16.0: `npm test` com
`node --test *.test.mjs`, **6 testes aprovados, 0 falhas**.
Cobertura: cenário sintético normal, dupla dedução de IBS, divergência
de IBS + CBS, ICSD incoerente, liberação de NCG com ressarcimento e
serviço da dívida nulo. Os blobs relidos da branch coincidem com os
arquivos testados: `b54a2fc067449ab199df154a6901c0a14e153ac5`
(módulo) e `5b7cb85fb7d3de561579ee0bd7558e9e5cfa83ac`
(testes). Não foi executada a suíte integral do repositório nem
homologação interativa em navegador.

**Prontidão limitada ao MVP sintético:** esta conciliação aritmética
não substitui DFC integral, FCADS/ICSD contratual, revisão legal por
exercício ou auditoria de documentos reais. Segurança institucional,
conciliação multissetorial completa e QA real entre abas permanecem
pendentes. Não usar como parecer de crédito. Nenhuma alteração na
produção ou merge na `main`. Próxima ação: validar a navegação real
entre abas e conciliar os indicadores de diferentes setores no preview.


## Verificacao independente das subcontas IBS e CBS (01/11/2026)

Entrega limitada ao verificador `mvp-conciliacao-caixa.js`, consumido pela
interface `mvp.html`. A memória do MVP passa a recompor **separadamente**
para IBS e CBS: tributo a pagar = débito menos crédito utilizado;
saldo final = saldo inicial + créditos gerados - utilizados - ressarcidos -
ajustes negativos. Também verifica limites de utilização, valores não
negativos e se os ressarcimentos consolidados correspondem à soma das
duas contas. Um campo `conciliacao: 0` declarado pelo próprio motor
não é mais evidência suficiente de consistência. Nenhuma regra legal,
alíquota, fórmula da ponte principal ou importador foi alterado.

Commits: implementação `7397881a93e82ab29149578372dec7c9e7b3d5b5`;
regressão `1635e95c42cafc3259a71b5cf31941b8b1503e7d`.
Verificação nativa **Node.js 22.16.0**: comando
`node --test mvp-conciliacao-caixa.test.mjs`, **9 testes aprovados,
0 falhas**, em diretório isolado com os dois blobs exatos da branch.
Os hashes Git SHA-1 dos arquivos testados coincidem com os blobs publicados:
`d64830208c680b57e13af7d92a736089bce875e3` e
`ff0e6f9763e8fdfac09deab33978622f3db03fc6`.
Três regressões novas cobrem débito de IBS divergente, saldo final de
CBS adulterado e ressarcimento consolidado sem origem. Não foi
executada a suíte integral nem teste interativo real entre abas.

**Bloqueios mantidos:** conciliação completa da DFC, FCADS/ICSD
contratual, validação jurídica por exercício, homologação multissetorial
manual, controle de acesso e segurança documental. A simulação sintética
não equivale a parecer de crédito. Sem merge na `main`, alteração
da produção, dados pessoais ou gastos autorizados.

Próxima ação: homologar o fluxo interativo real entre importador v3.2
e Motor e conferir um cenário sintético com créditos e ressarcimentos,
incluindo conciliação manual de IBS, CBS, caixa e ICSD.

## Verificacao independente dos sinais financeiros (01/11/2026)

Entrega focada no verificador de caixa do MVP, sem alterar formulas tributarias,
classificacoes setoriais, importador documental ou o motor financeiro.
Foi reproduzido um caso em que CAPEX, impostos sobre resultado, juros,
amortizacoes ou tributo de referencia negativos podiam ser aceitos pelo
verificador quando caixa e ICSD eram recalculados de forma coerente com
os sinais indevidos. A protecao independente agora rejeita esses cinco
componentes negativos, preservando EBITDA negativo e variacao negativa
da NCG como situacoes economicamente possiveis.

Commits: implementacao `ec3c8c06b6370974017fcf11b8d83973995ea08f`;
regressao `b7349c7d1269532f0adefeaaa170395ad70ad504`.
Teste antes da correcao: 5 falhas em 7 casos novos. Depois da correcao,
`npm test` com Node 22.16.0 em diretorio isolado contendo o verificador,
o teste anterior e o teste novo: **16 testes nativos aprovados, 0 falhas**.
Os blobs dos arquivos alterados foram relidos da branch e coincidiram com
os hashes locais: `1d201c611a71e7bc273bba2d89bb5f3d47745950` e
`c545b0598f9cb8f20b55fbc9d3eda9b16c303381`.
A suite completa do repositorio nao foi executada.

Preview da branch confirmado como READY no deployment
`dpl_13PURUqJXxjBY5yowc9kHJ9Qyunt` (commit de regressao).
A pagina `motor-rt-credito-360/mvp.html`, o modulo corrigido e
`simulador/v3/import.js` responderam com HTTP 200 no acesso
autorizado. Isto nao equivale a homologacao de cliques reais ou da
transferencia entre abas.

Bloqueios: faltam testes interativos reais entre abas, conciliacao
integral da DFC, FCADS e ICSD contratual, fundamentacao legal por
exercicio, homologacao multissetorial e controles institucionais de
acesso e documentos. A simulacao permanece sintetica e nao pode
ser usada como parecer de credito. Nao houve merge na `main`,
publicacao em producao, gastos ou uso de dados pessoais.

Proxima acao: executar QA interativo entre o importador existente e o
MVP em navegador real, com candidatos ficticios, e conciliar
manual e independentemente caixa e ICSD de cenarios multissetoriais.


## Cancelamento de importação ao restaurar o exemplo sintético (01/11/2026)

Correção focada na navegação já existente: antes, o botão **Restaurar exemplo
sintético** redefinia os campos financeiros e as três revisões, mas mantinha
a sessão de transferência aberta e os candidatos aceitos do importador
v3.2 visíveis e potencialmente reaplicáveis. Agora, o botão chama a
rotina de cancelamento da ponte antes de restaurar os valores: fecha o
BroadcastChannel, remove seu receptor, descarta candidatos pendentes,
desmarca a confirmação de juros e desabilita sua aplicação. Uma nova
importação cria uma sessão independente. A rotina também encerra o canal
no descarregamento da página.

Commits exclusivos da branch `feature/motor-rt-credito-360`:
ponte `6c379560b6c40a34e8fe5649966476949f7a62bd`;
interface `e570b0ed3124b4ff0ad34374e8ceb857bbafaec7`;
regressão `03021e05c79deab5206d1e098a06b680d355eb3d`.

**Testes nativos executados:** Node.js 22.16.0,
`node --test mvp-import-bridge.test.mjs mvp-reset-importacao.test.mjs`
em diretório isolado: **8 aprovados, 0 falhas**. O teste novo simula
recebimento, cancelamento, fechamento do canal, remoção do receptor e
abertura de nova sessão. A segunda asserção verifica a ligação do botão
no HTML; foi executada contra um recorte local desse trecho, não contra
a página HTML completa. O trecho também foi conferido diretamente no
arquivo da branch e na página publicada. Os hashes dos módulos e testes
locais coincidiram com os blobs da branch: ponte
`64592ee0b4677fd8842e746273802e62abb425ee`, dependência
`74ef530da21e0444d41de98b7842bc5d5c0c4307`, regressão anterior
`20e5391d8e9b9f09b3f283d088beabff6c42f9ff` e teste novo
`737ff5683baf5b3f692c21f3e872fd718ebaa233`.
Não houve execução da suíte integral nem teste interativo real com duas
abas de navegador.

**Preview verificado:** deployment automático
`dpl_AyP3NV3RaMuJSzLD8qNLtQGyhyFo`, commit
`03021e05c79deab5206d1e098a06b680d355eb3d`, estado **READY**,
branch correta e alvo preview. Com acesso autorizado, a Vercel respondeu
HTTP 200 para `mvp.html`, `mvp-import-bridge.js`, teste novo e
`simulador/v3/import.js`. O HTML publicado contém a chamada de
cancelamento e o módulo publicado retorna a função de cancelamento.
Nenhuma alteração do leitor de PDF/XLSX/CSV ou dos cálculos IBS/CBS,
EBITDA, NCG, caixa e ICSD.

**Bloqueios:** a comunicação real entre abas ainda requer QA com cliques
no navegador. DFC integral, FCADS/ICSD contratual, conciliação manual
multissetorial, validação jurídica por exercício, controle de acesso e
segurança institucional dos documentos permanecem pendentes. A revisão
é apenas sintética e declarativa, não auditoria ou parecer de crédito.
Próxima ação prioritária: QA interativo da transferência entre abas e
conciliação independente dos cenários sintéticos. Sem merge na
`main`, promoção à produção, uso de dados pessoais ou gastos.


## Transporte real BroadcastChannel em Node e bloqueio do QA de navegador (01/11/2026)

Entrega restrita à regressão de integração `mvp-canal-nativo.test.mjs`.
A suíte usa **dois canais BroadcastChannel nativos do Node**, em vez de
substitutos de EventTarget, para exercitar o módulo existente
`mvp-confirmacao-transferencia.js` sem alterar o importador v3.2, o
MVP, os cálculos de IBS/CBS ou o comportamento de produção. Verifica
(1) envio de candidato fictício e confirmação somente após recebimento,
(2) ausência de falsa confirmação quando o receptor não responde e
(3) rejeição de confirmação antiga depois de uma transferência nova.

**Execução real:** Node.js v22.16.0,
`node --test mvp-canal-nativo.test.mjs`, **3 testes aprovados, 0 falhas**.
O teste foi executado em diretório isolado com cópia idêntica do módulo
existente (blob SHA `74ef530da21e0444d41de98b7842bc5d5c0c4307`).
Após corrigir um erro de escrita no predicado de espera no próprio
arquivo de teste, o blob publicado do teste passou a coincidir com
o arquivo efetivamente executado (SHA
`3554812edc8da2bee59d12da533c48c5c2e21582`).
Commits na branch autorizada: criação `4a514c6df3274937390a9a5f6bd0bf7b1d46ff27`;
correção do teste `60f93c6961bc0db1c241b6b8c8df62af527c104f`.
A suíte integral do repositório não foi executada.

**Preview:** deployment `dpl_DYSQSb1CFxKqqc71taUPj9FyQiHg`,
commit `60f93c6`, confirmado `READY` pela Vercel, na branch
`feature/motor-rt-credito-360` e sem alvo de produção (`target:null`).
A verificação HTTP autorizada posterior confirmou **HTTP 200** para
`motor-rt-credito-360/mvp.html`,
`motor-rt-credito-360/mvp-confirmacao-transferencia.js`,
`motor-rt-credito-360/mvp-canal-nativo.test.mjs` e
`simulador/v3/import.js`. Os três arquivos JavaScript publicados são
idênticos aos da branch. O HTML publicado coincide integralmente com o
arquivo do GitHub e recebeu apenas um script adicional de feedback da
Vercel após o fechamento do documento. Foi criado um link temporário
de compartilhamento, válido até 02/11/2026 16:00:45 conforme
informação da Vercel (fuso horário não especificado).

**Bloqueio específico:** foi tentado QA interativo em duas abas com
Chromium/Playwright e servidor local usando o módulo real de confirmação.
O navegador recusou a navegação com
`net::ERR_BLOCKED_BY_ADMINISTRATOR`. Portanto, **não houve
homologação em navegador**, e o teste nativo não deve ser apresentado
como teste ponta a ponta da interface ou do importador documental.

**Próxima ação:** validar em navegador autorizado o fluxo completo
Simulador v3.2 -> revisão de candidatos -> transferência confirmada ->
conferência no MVP -> aplicação opcional de juros -> restauração.
Conferir manualmente IBS, CBS, NCG, caixa e ICSD em cenários
multissetoriais sintéticos. Persistem os bloqueios de DFC integral,
FCADS/ICSD contratual, fundamentação legal por exercício, segurança
documental e homologação para concessão de crédito. Nenhum parecer
validado, merge na `main`, alteração da produção ou dado pessoal.

## Encerramento seguro da importação ao navegar (01/11/2026)

Correção limitada à ponte existente `mvp-import-bridge.js`. O evento
`pagehide` agora chama a mesma rotina `cancelar()` usada no reset:
fecha o BroadcastChannel, remove o receptor, descarta candidatos aceitos
pendentes e desabilita a aplicação de juros na interface via callback
`limpar`. O aviso informa que é necessário reabrir o importador.
Isso evita reaproveitar valores da sessão anterior após voltar à página
pelo histórico/cache do navegador. Não modifica o leitor documental
`simulador/v3/import.js`, os cálculos financeiros ou a produção.

Commits na branch `feature/motor-rt-credito-360`:
implementação `c6cf800c496f4734ea1990124c16ecb702332e79`;
regressão `384c90dc496af01522b0f3b8f5073b4c99049808`.

Teste nativo **Node.js 22.16.0** em diretório isolado:
`node --test mvp-import-bridge.test.mjs mvp-pagehide-importacao.test.mjs`,
**7 aprovados, 0 falhas**. O teste novo falhou antes da correção
(esperava limpeza dos candidatos ao navegar) e passou depois. Testa
cancelamento, fechamento e remoção do receptor, descarte dos candidatos
e nova sessão independente. Arquivos locais executados correspondem
aos blobs da branch: ponte `07f73d55b4f8f574abcb8a3849765f293bc8065a`,
regressão nova `d53a8d0e368946c13a2b3d4d010bbd38a7422d26`,
regressão anterior `20e5391d8e9b9f09b3f283d088beabff6c42f9ff`
e dependência `74ef530da21e0444d41de98b7842bc5d5c0c4307`.
Não foi executada a suíte integral.

**Preview verificado:** deployment `dpl_3R7R2NPLpQuMdugk3whXiMULw7PD`
do commit `384c90dc`, estado `READY`, branch autorizada, alvo
`target:null` (não produção). Com acesso autorizado, responderam
HTTP 200 `motor-rt-credito-360/mvp.html`,
`mvp-import-bridge.js`, `mvp-pagehide-importacao.test.mjs`
e `simulador/v3/import.js`. Os três arquivos JavaScript
publicados foram comparados byte a byte com a branch e coincidiram.
O HTML recebeu uma pequena injeção da infraestrutura Vercel.
Link temporário compartilhável criado/reutilizado, expiração informada
pela Vercel em 02/11/2026 às 15h56min25s (fuso não informado).

**Bloqueios:** Chromium/Playwright recusou até navegação `data:`
com `net::ERR_BLOCKED_BY_ADMINISTRATOR` neste ambiente, portanto
não houve homologação interativa real entre abas. Faltam DFC completa,
FCADS/ICSD contratual, conciliação manual multissetorial, validação
jurídica por exercício e controles institucionais de acesso e documentos.
Todos os valores são sintéticos, sem aptidão para parecer de crédito.

**Próxima ação prioritária:** homologar em navegador autorizado a
transferência de candidatos fictícios do importador v3.2 ao Motor,
incluindo navegação de ida e volta, e conciliar manualmente IBS, CBS,
NCG, caixa e ICSD. Sem merge na `main`, sem alteração da produção,
sem dados pessoais e sem gasto adicional autorizado.


## Encerramento do envio no importador após navegação (01/11/2026)

Correção pequena e isolada na integração com o Simulador RT v3.2. Ao ocorrer
`pagehide` na aba do importador, o emissor é encerrado, o BroadcastChannel é
fechado, o botão **Enviar candidatos aceitos ao Motor RT Crédito 360** é
desabilitado e a mensagem informa que a sessão terminou. Assim, ao retornar
pelo cache de navegação (BFCache), o usuário não tenta enviar por um canal
obsoleto. O evento de montagem tardia do painel também deixa de criar uma
nova interface de envio após o encerramento. A nova sessão deve ser iniciada
pelo botão do Motor. Não houve alteração em `simulador/v3/import.js`, nem
duplicação dos leitores PDF, XLSX ou CSV. Nenhuma fórmula IBS/CBS, EBITDA,
NCG, caixa ou ICSD foi modificada.

Commits na branch `feature/motor-rt-credito-360`:
módulo de encerramento `59a3df2f36612584da3422d59bee440e97daf8f3`;
regressão `3bb1e83b6b94cc28c1c74aa4b1c6d8a88617b33e`;
integração `24bd3faa61a502fdb961f9438523668b2aab22c0`.

**Teste nativo executado:** Node.js v22.16.0,
`node --test mvp-encerramento-v3.test.mjs`, **3 aprovados, 0 falhas**.
Foram verificados encerramento do emissor/canal, bloqueio do botão no
retorno pelo cache, encerramento antes de montar o painel e ausência de
alteração nos candidatos sintéticos. Os blobs relidos do GitHub
coincidiram com os arquivos executados localmente: módulo
`824b64c6c210d06924df8050339acb4294c9eb62` e regressão
`78cd0aa159673d4490bec36a982966644b63acc0`.
A integração foi relida da branch e contém a chamada do novo módulo,
mas **não** foi executada a suíte integral do repositório.

**Preview confirmado:** Vercel deployment
`dpl_74XmrZG1o6k8nBtHT599FYSevP4u`, commit `24bd3faa`,
estado **READY**, branch autorizada e `target:null` (preview).
Leitura autenticada do deployment retornou **HTTP 200** para
`mvp.html`, `mvp-import-bridge.js`, `mvp-encerramento-v3.js`
e `simulador/v3/import.js`. Os dois módulos novos/alterados estão
presentes na publicação. Link de compartilhamento temporário
criado/reutilizado, com expiração informada pela Vercel em
02/11/2026 às 17h05min16s (fuso horário não especificado).

**Bloqueios e próxima ação:** Chromium/Playwright neste ambiente
recusou navegação `data:` com `net::ERR_BLOCKED_BY_ADMINISTRATOR`;
portanto **não houve QA interativo real** nem homologação ponta a ponta
das abas. Testar em navegador autorizado o fluxo completo de aceitação,
envio, confirmação, retorno e restauração, além da conciliação manual
multissetorial de IBS, CBS, NCG, caixa e ICSD. Permanecem pendentes
DFC integral, FCADS/ICSD contratual, fundamentação legal por exercício
e segurança documental institucional. Apenas dados sintéticos;
nenhum parecer de crédito validado, merge na `main`, mudança em
produção ou gasto adicional.


## Conciliação independente do detalhamento multissetorial (01/11/2026)

Entrega focada na interface financeira existente, sem novo leitor documental.
O verificador `mvp-conciliacao-caixa.js` passou a exigir detalhamento
por atividade e a reconciliar, com tolerância absoluta de 0,01,
(1) soma das receitas setoriais com a receita consolidada,
(2) débito de IBS e CBS de cada atividade com receita x alíquota
hipotética e (3) soma dos débitos setoriais com as contas separadas
de IBS e CBS. Rejeita atividade duplicada, memória ausente,
alíquota fora de 0 a 100%, valor negativo ou não finito.
Os controles anteriores de caixa, créditos, ressarcimentos, NCG
e ICSD foram preservados. Não houve alteração de premissas
legais, fórmulas do motor, interface de importação ou produção.

Commits exclusivos da branch `feature/motor-rt-credito-360`:
implementação `cc09080a637b7857f76c69d131e536803af796bd`;
adaptação dos testes existentes `18deba967c1ab7d609b2fadbd6b3356d66a9cef3`;
regressão setorial `f156ca90c7ecc1e26bceaf3d9a9bf556ae7bf63d`.

**Testes nativos executados:** Node.js v22.16.0,
`node --test mvp-conciliacao-caixa.test.mjs mvp-detalhamento-setorial.test.mjs`,
**14 aprovados, 0 falhas**. Antes da correção, 4 dos 5 casos
do novo arquivo falhavam, expondo ausência de conciliação setorial.
Após a correção, os 14 passaram. Os três blobs relidos da branch
coincidiram com os arquivos executados localmente:
`20569fc5e72aab283347b16dac186839eca0eeba`,
`ba2f41f3274b9c70d5a800dd5dc3c292391c46df` e
`d5ae62bd72d94d62915a926e9e040d6f2839d462`.
Não houve execução da suíte integral do repositório ou QA real de navegador.

**Preview verificado:** deployment automático
`dpl_69js6UVcBJcAGkREaDcPCmKw9xi1`, commit `f156ca90`,
estado `READY`, branch autorizada e `target:null`
(sem destino de produção). A leitura autorizada da Vercel retornou
HTTP 200 para `mvp.html`, `mvp-conciliacao-caixa.js`,
`mvp-detalhamento-setorial.test.mjs` e
`simulador/v3/import.js`. A URL temporária compartilhável foi
reutilizada, com expiração informada para 02/11/2026 às 18:03:53
(fuso não especificado). A checagem pública independente via ferramenta
web não conseguiu acessar a URL, embora a leitura autorizada tenha
retornado HTTP 200.

**Bloqueios:** ainda faltam testes reais entre abas em navegador
autorizado, DFC integral, FCADS/ICSD contratual, conciliação manual
de balanço e CAPEX por atividade, fundamentação legal por exercício,
controle de acesso e segurança institucional de documentos. A
revisão permanece declarativa e exclusivamente sintética.
Nenhum resultado deve ser tratado como parecer de crédito validado.

**Próxima ação:** validar navegação real do importador v3.2 para o Motor
com candidatos fictícios e revisar manualmente um cenário multissetorial
com créditos, ressarcimentos e liberação de NCG, antes de homologar.
Sem merge na `main`, alteração de produção, gasto adicional ou
uso de dados pessoais nesta entrega.


## Ponte incremental da projeção do economista (01/11/2026)

**Diretriz funcional prioritária do usuário:** receber DRE, balanços e a
planilha de fluxo de caixa projetado pelo economista, reproduzir e preservar
a projeção original, calcular uma segunda projeção com efeitos da Reforma
Tributária e comparar a capacidade de pagamento ano a ano. O objetivo não
é substituir a metodologia de crédito nem apresentar IBS/CBS isoladamente.

**Entrega pequena e navegável:** `projecao-economista.html`, ligada ao
`mvp.html`, com oito exercícios sintéticos (2026 a 2033). O módulo puro
`mvp-ponte-economista.js` preserva caixa original e serviço da dívida,
calcula diferenças incrementais de EBITDA, NCG, CAPEX, imposto sobre
resultado, IBS, CBS e outros ajustes, exibindo caixa ajustado, ICSD original,
ICSD ajustado, delta acumulado e anos com cobertura inferior a 1x. IBS e CBS
permanecem separados. Efeitos IBS/CBS nesta ponte são **somente ajustes
incrementais de caixa ainda não refletidos no EBITDA**, não alíquotas ou
tributos brutos. Há três revisões obrigatórias e invalidação dos resultados
após editar entradas. Não foram alterados leitores do Simulador v3.2,
mecanismos fiscais ou dados de produção.

Commits exclusivos da branch `feature/motor-rt-credito-360`:
módulo `b7fc4993eeda7146d381ad7e819166591f99f595`;
regressão `99abf541f95eff93a7a51a3588301eef19fdf40d`;
interface `ed5984c0a2f40f5db74c0e1c0b9f9fac200cab8e`;
navegação `1882c1585c4f4a808a311accab766545fbbff289`.

**Teste nativo executado:** Node.js v22.16.0,
`node --test mvp-ponte-economista.test.mjs`: **7 aprovados, 0 falhas**
na cópia local dos módulos e da página. Cobertura: preservação da
referência, IBS/CBS separados, NCG negativa, bloqueio das três revisões,
números inválidos, dívida zero, oito exercícios, alerta de insuficiência
e ligação estática da interface ao módulo/importador. Não é teste de
navegação real, de importação XLSX nem suíte integral.

**Bloqueios para uso real:** esta tela **ainda não faz upload nem interpreta
a planilha do economista**. Não preserva fórmulas, abas e vínculos de XLSX,
não reconcilia DRE/BP/DFC nem aplica automaticamente as regras da transição
e regimes por atividade. Os ajustes são preenchidos manualmente com
números fictícios, sem homologação tributária ou de crédito. FCADS e ICSD
contratual, créditos comprovados, controles de acesso, segurança documental
e validação jurídica por exercício permanecem pendentes. Não inserir dados
reais, CNPJ ou documentos confidenciais.

**Próxima ação prioritária:** reutilizar a leitura XLSX e a revisão de
candidatos do Simulador v3.2 para identificar a planilha de projeção do
economista, mapear anos/rubricas/fórmulas, reproduzir exatamente o caixa
original e exigir conciliação antes de aplicar ajustes tributários. Não
duplicar leitor documental, não sobrescrever a projeção original, não
alterar produção e não efetuar merge na `main`.


## Conciliação aritmética do ICSD da projeção original (01/11/2026, fim da tarde)

**Objetivo prioritário:** antes de ajustar o fluxo de caixa do economista
pela RT, impedir a comparação quando o ICSD original transcrito não
coincidir com o caixa disponível e o serviço da dívida do mesmo exercício.
O modelo integrado `.xls` enviado pelo usuário **não foi incorporado
nem enviado ao GitHub ou à Vercel**. Nenhum dado empresarial ou pessoal
foi usado nesta entrega. A leitura das abas/fórmulas do modelo real
permanece pendente, com necessidade de ambiente autorizado e validação
da metodologia de FCADS do economista.

**Entrega sintética:** `mvp-ponte-economista.js` exige agora o campo
`icsdConferido` em cada exercício com serviço da dívida positivo,
compara com `caixaOriginal/servicoDivida` e bloqueia divergência
absoluta superior a 0,01x. Sem serviço da dívida, o ICSD deve ficar
explicitamente vazio (`null`), sem indicador fictício. A interface
`projecao-economista.html` apresenta a coluna de conferência, instrução
e contagem de exercícios conciliados. A referência é preservada, e IBS,
CBS, EBITDA, NCG, CAPEX, IR e serviço da dívida continuam separados.

**Commits exclusivos da branch:**
implementação `d51ea8d823ac97781c85ccb76cdd533fdf7e09b0`;
testes `19335d8947546f993a9289942c8c61f7a6e2d152`;
interface `9f3339509c5e3072b15c939f83f05a12b302a0c8`.

**Teste nativo executado:** Node.js v22.16.0,
`node --test --test-skip-pattern='a interface usa' mvp-ponte-economista.test.mjs`:
**8 aprovados, 0 falhas** em cópia local dos arquivos idênticos aos
blobs da branch (módulo `db79d14f5eb5f6b4fe34fd49af1070ba28682c5a`,
teste `2402e180a0eebbc4384f922625d70ca322baa92d`).
O teste de leitura estática do HTML foi excluído da execução local
porque a página completa não foi copiada ao ambiente de teste.
Em contrapartida, oito verificações estáticas da integração foram
executadas diretamente contra os blobs do GitHub, todas aprovadas:
navegação, import do módulo, coluna, coleta, nulo, aviso, importador
original e revisões. **Não houve teste interativo de navegador** nem
execução da suíte integral.

**Limitações:** conciliação somente aritmética do ICSD, sem validação
da composição do FCADS, dos contratos ou das fórmulas da planilha.
A entrada continua manual e sintética; a incidência legal de IBS/CBS,
créditos, regras de transição e fluxos multissetoriais reais não está
homologada. A conferência de ICSD não substitui auditoria ou parecer.

**Próxima ação prioritária:** mapear a estrutura da planilha integrada
retrospectiva/prospectiva em ambiente seguro, sem copiar dados para
o repositório, e reutilizar a leitura documental do Simulador RT v3.2
para identificar períodos e rubricas da projeção original, preservando
fórmulas e exigindo conciliação antes de aplicar ajustes tributários.
Sem merge na `main`, sem alteração de produção e sem gastos.

**Publicação de preview desta entrega:** deployment automático
`dpl_7tDWpftqDwiG3AtBfA7tVDoGHQM6`, commit `b6e650f`,
estado `READY`, branch `feature/motor-rt-credito-360`, `target:null`
(sem produção). Leitura autorizada na Vercel retornou HTTP 200 para
`projecao-economista.html`, `mvp-ponte-economista.js`, `mvp.html`
e `simulador/v3/import.js`. Link temporário de compartilhamento
reutilizado, expiração informada em 02/11/2026 às 20:02:30
(fuso não especificado). O link compartilhável também retornou HTTP 200
na leitura autorizada, mas a verificação pública independente não
conseguiu acessá-lo. **Não afirmar homologação de navegador**.


## Separação de risco preexistente e agravamento simulado (01/11/2026)

**Objetivo de crédito:** a projeção ajustada não deve atribuir à reforma um
déficit que já existia no fluxo de caixa original do economista. A nova
camada `mvp-alertas-credito.js` calcula, por exercício, folga de pagamento
(`caixa disponível - serviço da dívida`) nos dois cenários e classifica
se a cobertura era insuficiente na referência, tornou-se insuficiente
apenas após os ajustes, recuperou-se ou permaneceu suficiente com menor
ou maior folga. Sem serviço da dívida, não inventa cobertura nem déficit.

**Interface:** `projecao-economista.html` agora mostra a folga original e
a ajustada, identifica os exercícios já insuficientes na referência e os
novos exercícios insuficientes no cenário ajustado. O texto adverte que
os ajustes são hipotéticos e não comprovam causalidade tributária.
A projeção original não é sobrescrita, e o importador documental original
`simulador/v3/import.js` não foi alterado nem duplicado.

**Commits na branch autorizada:** módulo `ac812291`, regressão
`38f2fa40`, interface `9fb57e2f`.

**Teste nativo executado:** Node.js 22.16.0,
`node --test mvp-alertas-credito.test.mjs`, **4 aprovados e 0 falhas**.
Abrange déficit preexistente versus novo, recuperação, redução da folga
sem déficit, exercício sem dívida, imutabilidade e entradas inválidas.
Os hashes Git dos arquivos executados localmente coincidiram com os
blobs relidos do GitHub: módulo
`e5c0a58a175b646ce727d3c8766b4da52fe40347`, teste
`c1226c3bdf35d9e56962eb7fdf200c408a40f0ed`.
Integração HTML conferida estaticamente: import do novo módulo, colunas,
cartões de risco e alertas. **Não** houve teste interativo de navegador
nem execução da suíte integral.

**Bloqueios:** a planilha integrada real do economista ainda não é
importada nem interpretada automaticamente; permanecem pendentes
mapeamento seguro de abas/fórmulas, conciliação de DRE/BP/DFC, FCADS e
ICSD contratuais, regras legais de transição, créditos e ressarcimentos,
segurança documental e validação institucional. Os dados usados nesta
entrega são exclusivamente sintéticos. Não utilizar para parecer de
crédito. Nenhum dado do arquivo enviado pelo usuário foi publicado.

**Próxima ação prioritária:** integrar a leitura XLSX do Simulador v3.2
à identificação das rubricas da projeção original, exigir a reprodução
do caixa e ICSD antes da segunda projeção e conciliar manualmente
a decomposição de impactos. Manter somente preview, sem merge na main,
sem alteração da produção e sem custos.


## Memória explicativa dos impactos no caixa (01/11/2026, noite)

**Objetivo de análise de crédito:** demonstrar por que a projeção ajustada
apresenta diferença em relação à projeção original do economista, em vez de
mostrar apenas um ICSD final. A página `projecao-economista.html` passou a
apresentar, por exercício de 2026 a 2033, a contribuição ao caixa de EBITDA,
NCG, CAPEX, IR, IBS, CBS e outros ajustes, com sinais financeiros corretos,
diferença total, diferença acumulada e maior pressão acumulada entre as
rubricas informadas. A memória impede dupla interpretação de NCG e CAPEX:
ajustes positivos nessas entradas são saídas de caixa na decomposição.

**Conciliação:** `mvp-decomposicao-caixa.js` valida valores finitos,
exercícios ordenados, soma das sete contribuições com `deltaCaixa` e
`caixaReforma - caixaOriginal`, com tolerância absoluta de 0,01 unidade.
Uma divergência bloqueia a apresentação da memória. A tela invalida os
resultados quando o usuário edita premissas, exigindo novamente as revisões.
O importador existente `simulador/v3/import.js` foi preservado, sem duplicar
leitores de PDF, XLS, XLSX ou CSV.

**Commits exclusivos da branch:** módulo `912dc63d`, regressões
`7c262c21`, integração visual `503117b7`.
**Testes nativos executados:** Node.js v22.16.0,
`node --test mvp-decomposicao-caixa.test.mjs`: **5 aprovados, 0 falhas**.
Os blobs publicados no GitHub coincidem com os arquivos testados localmente:
módulo `227e0f0639dc539415af38fc6672f1d01946f42b` e teste
`f79030bcd77a17d9ae2c76d242dfdb1e99290f7b`.
A integração HTML foi conferida estaticamente, mas não houve QA interativo
de navegador nem execução da suíte integral.

**Limitações:** todos os efeitos permanecem manuais e sintéticos, sem
demonstração de causalidade fiscal. A memória aritmética não substitui
a importação e reprodução da planilha integrada de crédito, conciliação
de DRE/BP/DFC, aplicação legal da transição e dos créditos, cálculo
contratual do FCADS/ICSD ou auditoria documental. Nenhum documento real,
dado pessoal ou empresarial foi enviado ao GitHub ou à Vercel.

**Próxima ação prioritária:** mapear, em ambiente privado, as abas e fórmulas
da planilha padronizada do economista, preservar a projeção original e
reutilizar a leitura e a revisão de candidatos do importador v3.2 para
reproduzir e conciliar caixa e ICSD antes dos ajustes fiscais.
Sem merge na `main`, sem alterações na produção e sem custos autorizados.

**Verificação de preview (01/11/2026):** deployment
`dpl_AwhZmURiizVTYHDpjPJyVdY48kdX` do commit `23021ac1`,
estado `READY`, branch `feature/motor-rt-credito-360`,
`target:null` (não produção). A leitura autorizada da Vercel
retornou HTTP 200 para `projecao-economista.html`,
`mvp-decomposicao-caixa.js`, `README.md` e
`simulador/v3/import.js`. A interface contém a memória de caixa
e o módulo foi publicado. O link temporário de compartilhamento
foi criado com expiração informada pela Vercel em
02/11/2026 às 22:04:02 (fuso não especificado).
A verificação externa independente de navegação e cliques
não foi executada. Nenhuma alteração na produção.


## Referência anual do economista por colagem controlada (01/11/2026)

Entrega incremental restrita à branch `feature/motor-rt-credito-360`, sem produção e sem arquivos de clientes. A tela `projecao-economista.html` ganhou uma transferência **manual e temporária** de quatro colunas de valores previamente calculados na planilha: ano, caixaOriginal, servicoDivida e icsdConferido. Exige oito exercícios completos, 2026 a 2033, separados por tabulação. Aceita vírgula ou ponto decimal, sem separadores de milhares, e valida ICSD = caixa / serviço da dívida com tolerância 0,01x. Não interpreta fórmulas, não lê arquivos e não substitui o importador PDF/XLSX/CSV existente em `simulador/v3/import.js`.

Ao aceitar a referência, a interface **zera todos os ajustes hipotéticos de RT**, oculta resultados anteriores, limpa as três confirmações e exige nova revisão. Isso impede misturar uma referência copiada com ajustes sintéticos previamente carregados. A colagem não é persistida e o campo de texto é limpo após sucesso. Em caso de dados incompletos ou inconsistentes, nenhuma célula é aplicada. Somente valores sintéticos devem ser usados no preview.

Commits de implementação:
- `a2fc7f06caa6d77a472887cb5331c277675004fc`: validador isolado `mvp-referencia-colada.js`.
- `abc5aee71ec3f0f6373a939c5d6f749b1eb19636`: testes `mvp-referencia-colada.test.mjs`.
- `ee0b6f8a153bf6576d9d6aba52fc1d3dc6fd0771`: integração à página de comparação.

**Teste nativo executado:** Node.js 22.16.0, `node --test mvp-referencia-colada.test.mjs`, **6 aprovados e 0 falhas**. Cobertos oito anos, cabeçalho, vírgula decimal, conciliação do ICSD, exercício sem dívida, valores inválidos, fórmulas e linhas incompletas. Os hashes Git dos dois arquivos executados localmente coincidem com os blobs relidos da branch (`f622c771f6d7b637fbeb69e049415b9abd71299b` e `47522fee4725c6dc98c43e7b4fec75563fffeace`). Não foi executada a suíte integral.

**Preview verificado:** deployment `dpl_FwEjsJ2DiXznH6jF8VNsfJfEx61b`, commit `ee0b6f8a`, estado READY, target null, branch autorizada. Leitura autenticada Vercel HTTP 200 para `projecao-economista.html`, `mvp-referencia-colada.js`, teste e `simulador/v3/import.js`. A resposta da página contém importação do novo módulo, textarea, botão de aplicação, zeragem de ajustes, referência ao importador existente e aviso de não homologação. URL temporária compartilhável criada/reutilizada; expiração informada 02/11/2026 às 22:56:29, fuso não especificado. Sem homologação visual/interativa em navegador externo.

**Bloqueios e próxima ação:** esta é uma ponte manual para dados sintéticos, não upload ou leitura da planilha integrada `.xls` fornecida pelo usuário. Não há mapeamento auditado das abas, fórmulas, FCADS/ICSD institucional, DRE/DFC ou transição legal setorial; não há segurança documental para informações reais. Priorizar o mapeamento da planilha padronizada, a reprodução exata da projeção original e sua integração segura ao importador v3.2, sem duplicar leitor. Não utilizar para parecer de crédito.


## Bloqueio de overflow na ponte da projeção do economista (01/11/2026)

A ponte `mvp-ponte-economista.js` agora rejeita resultados não finitos em
`deltaCaixa`, `caixaReforma`, `icsdOriginal`, `icsdReforma` e
`deltaCaixaAcumulado`, mesmo quando cada entrada individual é finita.
Isso impede que `Infinity` seja apresentado como capacidade de pagamento
ou variação acumulada válida. Nenhuma fórmula tributária, alíquota ou
separação entre IBS e CBS foi alterada.

Commits: correção `d665ef7da075c471c12f7c3c7d8e2f7a3ecaf36a`;
regressão `1ae6de8c5e2d86643a2963a74edf412c76482e84`.
Verificação: `node --test mvp-ponte-overflow.test.mjs` em Node 22.16.0,
**5 testes nativos aprovados, 0 falhas**, em cópia local com os mesmos
blobs SHA da branch (`73fbc059d20bdf4dae1eb160f997a977609e5c4f`
e `2485d351396b6f2ae20f36bde0c5ce0ad514a47b`).
Os casos incluem operação normal, overflow da soma IBS/CBS, do caixa
ajustado, do ICSD e do acumulado entre exercícios.
Não foi executada a suíte completa nem homologação da interface.

**Bloqueios:** a importação automática da planilha integrada do economista
ainda não existe; a transferência atual é manual e exige oito exercícios.
As demonstrações e fórmulas não foram auditadas, as premissas de IBS/CBS
continuam manuais e hipotéticas, e o FCADS/ICSD contratual requer revisão.
Não utilizar dados reais ou confidenciais no preview nem emitir parecer.
Nenhum dado empresarial foi enviado ao GitHub. Não houve merge na
`main` ou alteração deliberada da produção.

**Próxima ação:** testar o fluxo navegável da branch no preview e avançar
no mapeamento de campos da planilha padronizada para importar a referência
sem duplicar o leitor `simulador/v3/import.js`, mantendo revisão explícita.


## Candidatos do importador v3.2 na projeção do economista (01/11/2026, noite)

**Entrega verificável:** a página `projecao-economista.html` agora abre o
importador documental existente do Simulador RT v3.2 por meio de
`iniciarPonteImportacaoMVP`, sem criar outro leitor de PDF, XLS, XLSX ou
CSV. O usuário aceita candidatos no importador e a tela da projeção recebe
somente números revisados via `BroadcastChannel`, com sessão efêmera e
limpeza ao restaurar o exemplo ou sair da página. A exibição usa
`textContent`, não HTML originado dos documentos. O arquivo original,
nomes, CNPJ e fontes documentais não são transferidos à projeção.

**Elegibilidade financeira restritiva:** o módulo
`mvp-elegibilidade-projecao.js` classifica os seis indicadores
retrospectivos já autorizados na ponte e informa por que nenhum pode
ser aplicado automaticamente como caixa disponível, serviço da dívida,
ICSD, ajuste de IBS/CBS ou projeção do economista. Em particular,
despesa financeira não equivale a juros mais amortizações; receita bruta
não equivale à receita líquida; ativo/passivo circulante não constituem
NCG. A chegada de candidatos invalida os resultados e as três revisões
anteriores. Não há importação de fórmulas nem tratamento de documentos
empresariais reais neste preview.

**Commits exclusivos da branch:**
`c016e9811006464d29f0a56a773838f055562597` (elegibilidade),
`90010f44351239413eb997a04fb46ec823f99e2e` (testes) e
`2584827119a22d68102fa19458a9f886f941ec3d` (interface).

**Testes nativos executados:** Node.js v22.16.0,
`npm test` em diretório isolado com o módulo e teste da branch:
**4 aprovados, 0 falhas**. Casos: campos e rótulos permitidos, ausência
de autopreenchimento, distinção de NCG e receita, rejeição de campos
desconhecidos, duplicados, não finitos e períodos inválidos. Os hashes
dos arquivos relidos da branch coincidiram com `git hash-object` dos
arquivos testados:
`81bf1c5337b42a3d561948095738c9abbbcfc95f` e
`1487fd1a658a5f8a9e146598c035f2ed0dd3758b`.
O HTML foi relido da branch e teve oito pontos de integração conferidos
estaticamente. Não foi realizado teste interativo do navegador nem
executada a suíte integral do repositório.

**Preview conferido:** deployment automático
`dpl_3UhoZHVniSA11pYRodRYbKfinpxC` do commit
`2584827119a22d68102fa19458a9f886f941ec3d`,
estado `READY`, `target:null`, exclusivamente na branch
`feature/motor-rt-credito-360`. A leitura autenticada da Vercel
retornou HTTP 200 para a página de projeção, o novo módulo de
elegibilidade, a ponte de importação, `simulador/v3/import.js` e
`mvp.html`. O endereço temporário de compartilhamento também
respondeu HTTP 200 na leitura autorizada. O teste externo independente
e o fluxo interativo entre abas permanecem sem homologação.

**Bloqueios:** o arquivo integrado `.xls` enviado pelo usuário não foi
interpretado nem publicado; a planilha do economista continua sem
mapeamento de abas, fórmulas e FCADS. Não existe conciliação contábil
completa da DRE/BP/DFC nem validação legal de IBS/CBS e créditos por
atividade. Dados sintéticos não equivalem a parecer de crédito.
Sem controle institucional de acesso ou armazenamento privado
comprovados, não inserir dados reais ou confidenciais.

**Próxima ação prioritária:** mapear de forma privada a estrutura da
planilha integrada, identificar as abas e fórmulas que geram o fluxo
de caixa e o ICSD e reutilizar o leitor v3.2 para propor candidatos
de referência por ano com confirmação explícita. Preservar a projeção
original, conciliar antes dos ajustes fiscais e não presumir serviço
da dívida a partir de despesa financeira. Nenhum merge na `main`,
alteração deliberada de produção ou gasto nesta entrega.

## Interface principal em três etapas e relatório fictício de três cenários (02/11/2026)

**Entrega única:** `index.html` agora apresenta somente três etapas visíveis: (1) identificação pelo CNPJ/CNAE, (2) envio e revisão no importador já existente do Simulador RT v3.2, (3) análise e relatório sintético. O botão de relatório permanece fixo na parte inferior, inclusive no celular. A consulta de CNPJ reutiliza `fluxo-cadastral.js`; como a integração atual não verifica o Simples Nacional, o status é explicitamente **não verificado**, sem presunção pelo CNAE. O importador é aberto pela ponte existente `mvp-import-bridge.js`; nenhum novo leitor de PDF, XLSX ou CSV foi criado.

**Exemplo demonstrativo:** `mvp-tres-cenarios.js` reutiliza `mvp-ponte-economista.js` para oito exercícios de 2026 a 2033 e apresenta três sensibilidades fictícias (0,5x, 1x e 1,5x sobre ajustes incrementais já sintéticos), com EBITDA, NCG, IBS e CBS separados, caixa original e ajustado, serviço da dívida, ICSD e ressalvas. A referência do economista é preservada e conciliada aritmeticamente antes de calcular as sensibilidades. Esses fatores não são estimativas legais, setoriais ou probabilísticas. O relatório só é habilitado após seleção explícita de exemplo fictício e nunca utiliza CNPJ consultado nem candidatos importados.

**Teste executado:** Node.js v22.16.0, `node --test mvp-tres-cenarios.test.mjs`, **5 aprovados, 0 falhas**, em diretório isolado com cópia funcional local da ponte já existente. Testados: três cenários completos, referência preservada, segregação IBS/CBS, conciliação de caixa, ressalvas e estrutura estática de três etapas. Uma falha inicial por comparação exata de ponto flutuante foi corrigida para tolerância 1e-9 antes do resultado final. A suíte integral do repositório e a navegação interativa em navegador ainda não foram executadas.

**Bloqueios:** importação real de BP/DRE/balancete ainda não produz reconciliação completa, classificação material nem FCADS contratual; candidatos aceitos permanecem informativos. Não há consulta comprovada do Simples Nacional. Não há matriz setorial auditada, elegibilidade de créditos comprovada, transição legal de 2027 a 2033, tratamento fiscal de compra e revenda de frota, nem parecer homologado. Os cenários desta entrega são apenas sensibilidades de demonstração e não devem ser utilizados para crédito.

**Próxima ação:** implementar a conciliação das rubricas revisadas de BP/DRE/balancete com a projeção original do economista, mantendo a interface de três etapas e solicitando revisão somente de exceções materiais. Não houve merge na main, alteração intencional de produção, uso de dados pessoais ou gasto autorizado.

**Rastreio desta entrega (02/11/2026):** commit de implementação e testes
`f70fcefbd4b13cf47ee1e2be83821c9e5ecc3940`, somente na branch
`feature/motor-rt-credito-360`. Preview Vercel
`dpl_By4zqaZLr9rtcjCjrZorkYkUEESs`, estado `READY`, `target:null`,
vinculado ao commit informado. Verificação autenticada da Vercel: HTTP 200
para `index.html`, `mvp-tres-cenarios.js`, `mvp-ponte-economista.js`,
`mvp-import-bridge.js` e `simulador/v3/import.js`. Link temporário de
compartilhamento retornou HTTP 200 na verificação autorizada; acesso externo
independente não pôde ser homologado. Não houve execução interativa do
navegador, merge na `main` ou alteração intencional da produção.

## Exemplo contábil sintético conciliado na etapa 2 (02/11/2026)

**Entrega limitada:** o botão `Usar exemplo fictício` agora preenche também a
etapa 2 com uma conciliação aritmética ilustrativa de balancete, BP e DRE,
sem acrescentar uma quarta etapa e sem alterar o importador existente
`simulador/v3/import.js`. O novo módulo `mvp-exemplo-contabil.js` representa
um balancete antes do encerramento (débitos = créditos = 1.700), BP de
2026 após o encerramento (ativo 1.060 = passivo 640 + PL 420), DRE
(receita líquida 800, custos 480, despesas 160, resultado operacional
ilustrativo 160), evolução do PL (400 - distribuições 140 + resultado
160 = 420) e NCG operacional ilustrativa (220 para 230, variação +10).
Todos os números são fictícios e sem unidade monetária de empresa real.
A interface usa `textContent` e não envia dados ao servidor.

**Separação e limites:** a conciliação do exemplo é somente aritmética.
O resultado operacional ilustrativo iguala o EBITDA apenas porque a DRE
fictícia não inclui depreciação; não representa lucro líquido auditado.
A NCG do exemplo não alimenta automaticamente o caixa ou a projeção
original do economista. Não existe DFC/FCADS conciliada, nem apuração
jurídica de IBS/CBS, elegibilidade de créditos ou tratamento da frota
de locadoras. Ao consultar CNPJ ou receber candidatos reais revisados,
o relatório fictício é desabilitado para evitar mistura de origens.
O Simples Nacional continua sem status inferido.

**Commits exclusivos da branch:** módulo
`1598e01a1b0320a81f060cd001ddab80fe5021ed`, testes
`e7ce274b774489ddb2277be52780680d6f4a64c7` e interface
`cee9aeead75d63eab61990849c6c54ec72b36c25`.

**Testes executados:** Node.js v22.16.0,
`node --test mvp-exemplo-contabil.test.mjs` em diretório isolado com
arquivos de mesmo blob da branch: **3 aprovados, 0 falhas**.
Conferência de `git hash-object` local contra blobs remotos:
`384f652a7e05712ee38615ec824ec820f42ac3ac` (módulo) e
`8f5d8af4ec6057f51567424a3b8b33514e41a215` (testes).
Também foram conferidas estaticamente três etapas, importador reutilizado
e exibição do exemplo na página publicada. Não foram executados testes
interativos de navegador nem a suíte completa do repositório.

**Preview verificado:** deployment automático
`dpl_EL81zWZxfBWs7RjqfGk54HF3EKSz`, estado `READY`,
`target:null`, commit `cee9aeead75d63eab61990849c6c54ec72b36c25`.
A leitura autenticada da Vercel retornou HTTP 200 para `index.html`,
o novo módulo, seus testes e `simulador/v3/import.js`. O link
temporário de compartilhamento da página também retornou HTTP 200
nessa verificação; não há homologação externa independente.

**Bloqueios e próxima ação:** o exemplo é completo somente para a
demonstração aritmética, não para avaliação de crédito real. Próxima
entrega: classificar e conciliar rubricas revisadas dos documentos reais
por período e materialidade, sem presumir NCG, dívida ou créditos
tributários a partir de indicadores agregados. Exigir reconciliação
da projeção original do economista antes de qualquer ajuste.
Nenhum merge na `main`, publicação em produção, gasto ou uso de dados
pessoais nesta entrega.


## Memória contábil no relatório demonstrativo (02/11/2026)

**Entrega pequena e verificável:** a etapa 3 passou a incluir, no relatório
imprimível do exemplo fictício, cinco indicadores derivados da conciliação
já existente em `mvp-exemplo-contabil.js`: balancete (débitos e créditos),
BP (ativo, passivo e PL), receita da DRE, EBITDA ilustrativo e variação da
NCG. O módulo `mvp-memoria-relatorio.js` exige fechamento aritmético
antes de apresentar esses números. A interface principal permanece com
**somente três etapas** e botão de relatório fixo. O importador original
`simulador/v3/import.js` não foi alterado nem duplicado.

**Separação metodológica:** a memória contábil fictícia não alimenta
automaticamente a projeção do economista, nem transforma dados ilustrativos
em demonstrações auditadas. O relatório explicita a ausência de DFC,
FCADS contratual, conciliação entre bases e homologação tributária.

**Commits na branch exclusiva:** módulo
`9b5ee20f6b0bc28a4224d9127be007f65f92638a`; testes
`820bf469d47971130702592827680603709e8b01`; interface
`c9682b706674709b1aed79aab82d69c92fbb797a`.
**Testes nativos executados:** Node.js 22.16.0,
`node --test mvp-memoria-relatorio.test.mjs`, **3 aprovados,
0 falhas**, em diretório isolado com cópia idêntica do módulo contábil
existente. Blobs do módulo e dos testes relidos da branch e conferidos
contra `git hash-object` local:
`b8648ef0c9dead92ba5e1c0c33bf106abca91e51` e
`9495f15329ee65ebc298a319c42f5d97cd61d53c`.
Conferência estática da integração no HTML, sem teste interativo do
navegador e sem execução da suíte completa do repositório.

**Preview verificado:** deployment automático
`dpl_CofcfUMZcndHCaM4Un5RTNapqiLJ`, `READY`, `target:null`,
commit `c9682b706674709b1aed79aab82d69c92fbb797a`.
A Vercel respondeu HTTP 200 para a interface, módulo, testes e
importador original; a URL temporária compartilhável também respondeu
HTTP 200 na leitura autenticada. Acesso independente externo e interação
real em navegador ainda não homologados.

**Bloqueios:** ainda não há classificação e reconciliação completas
de BP/DRE/balancete reais, matriz de créditos IBS/CBS validada por
atividade, transição legal comprovada, FCADS/ICSD contratual ou
tratamento fiscal auditado de compra e revenda de frota.
Não inserir dados empresariais reais no preview nem emitir parecer.

**Próxima ação:** implementar classificação e reconciliação das rubricas
efetivamente revisadas no importador v3.2 por exercício, sinalizando
exceções materiais, e exigir conciliação da projeção original do economista
antes de qualquer ajuste. Sem merge na `main`, sem alteração intencional
de produção, sem dados pessoais e sem gastos nesta entrega.


## Triagem de exceções dos candidatos do importador v3.2 (02/11/2026)

**Entrega pequena:** a etapa 2 da interface passa a resumir pendências de
conciliação dos candidatos numéricos explicitamente aceitos pelo importador
existente, sem criar outro leitor, outra etapa ou preencher projeções.
O módulo `mvp-triagem-excecoes.js` valida o pacote e agrupa ativo e passivo
circulantes numa única ressalva de NCG. Diferencia receita bruta de receita
líquida, margem EBITDA de EBITDA monetário, despesas financeiras de serviço
da dívida e tributos atuais de créditos IBS/CBS elegíveis. Não infere
materialidade quantitativa sem base conciliada. Nenhum dado de origem ou
identificação documental é exibido. O exemplo fictício e o botão fixo
de relatório permanecem disponíveis e isolados da importação real.

**Commits exclusivos da branch:** módulo
`50c842cf6532c76f45d0c3bd5f629412ab71b4ec`, testes
`6e90bb404c247349d18beac11c35ffef3367a3e3` e interface
`a2742ad110e88e780d76989b1bacd0de11daabd1`.
**Testes executados:** Node.js 22.16.0, `npm test` em diretório isolado,
**6 aprovados, 0 falhas**. Os arquivos locais testados foram conferidos
contra os blobs relidos da branch via `git hash-object`:
`fd1c1724e6e818ed2e871a645eb8390e2ab74bd0` e
`b6d437d00931c884c6d6b4cc1fe9e8b422c3f0c4`.
Conferência estática da interface: exatamente três seções principais,
importação do novo módulo e reutilização de `mvp-import-bridge.js`.
Não foi executada a suíte integral do repositório nem QA interativo móvel.

**Preview:** Vercel `dpl_2NmDy7bPdScehLrjB2dGbKKQ3qAS`, estado
`READY`, `target:null`, commit da interface
`a2742ad110e88e780d76989b1bacd0de11daabd1`. Leitura autenticada
da Vercel: HTTP 200 para `index.html`, novo módulo, teste e
`simulador/v3/import.js`. Link compartilhável temporário gerado ou
reutilizado; o acesso externo independente não pôde ser confirmado.

**Bloqueios:** a ponte v3.2 transfere apenas indicadores agregados e
não oferece rubricas por período com evidência suficiente para reconciliar
BP, DRE e balancete reais. A triagem identifica riscos de classificação,
mas não mede materialidade, não calcula ICSD contratual, não valida
alíquotas/créditos IBS/CBS nem implementa regras de locação e revenda
de frota. **Próxima ação:** estruturar a transferência mínima de rubricas
contábeis revisadas com período, origem não identificável e trilha de
conciliação, preservando a projeção do economista e bloqueando cálculos
com dados reais não conciliados. Nenhum merge na `main`, alteração
de produção, gasto ou uso de dados pessoais nesta entrega.


## Competência dos candidatos contábeis revisados (02/11/2026)

**Entrega pequena e verificável:** a triagem da etapa 2 agora ressalva explicitamente
a falta de comprovação do período de RBT12, dos tributos atuais anuais,
das despesas financeiras e da margem operacional. Para RBT12 e tributos
anuais, período diferente de 12 meses (inclusive desconhecido) gera alerta;
despesas financeiras e margem sem período também geram alerta. Saldos de
ativo e passivo circulantes continuam tratados como posições, sem
anualização. A triagem não altera valores, não calcula materialidade e
não alimenta a projeção do economista, o ICSD ou IBS/CBS.

**Commits exclusivos da branch:** implementação
`56d8832e964735d617d2c576b2338ca0c87e2929`; regressão
`3eca1e1f6767d8fb4d0ca8403951ee36aafc7eb6`.
**Testes nativos executados:** Node.js 22.16.0,
`npm test` em diretório isolado, **9 aprovados, 0 falhas**.
Os arquivos testados foram conferidos por `git hash-object` contra
os blobs relidos da branch:
`8cc26c78a2a282027d32ba766187875629964268` e
`9026ef42f2cc42882abfca4e75810f3623f8f4ba`.
Não foi executada a suíte integral nem QA interativo móvel.

**Preview verificado pela Vercel:** deployment automático
`dpl_WQk8Wd3uAS2ag1UyhhER3jtYBCwv`, `READY`,
`target:null`, commit `3eca1e1f6767d8fb4d0ca8403951ee36aafc7eb6`.
Leituras HTTP autenticadas retornaram **200** para a interface,
o módulo atualizado e o leitor original `simulador/v3/import.js`.
Link temporário de testes disponibilizado por mecanismo de compartilhamento
da Vercel; o acesso externo independente e a navegação completa não foram
homologados. Nenhuma publicação em produção ou merge na `main`.

**Bloqueios:** ainda não existe transferência de rubricas detalhadas
por exercício nem conciliação completa de BP, DRE, balancete, DFC e
projeção original do economista. A materialidade das exceções não é
quantificada. Matriz legal setorial, elegibilidade de créditos IBS/CBS,
transição 2027 a 2033, tratamento de compra/revenda de frota e
FCADS/ICSD contratual exigem validação. Não utilizar documentos reais
no preview nem emitir parecer de crédito.

**Próxima ação:** ampliar a ponte com rubricas contábeis revisadas,
competência e referências documentais não identificáveis, mantendo
os bloqueios de conciliação antes de recalcular cenários reais.


## Competência parcial de juros e margem operacional (02/11/2026)

**Entrega limitada:** a triagem de candidatos explicitamente aceitos no importador v3.2 passou a alertar quando despesas financeiras ou margem EBITDA se referem a período conhecido inferior a 12 meses. Antes, apenas a ausência da competência produzia alerta para esses dois campos. A ferramenta informa a duração parcial sem anualizar juros, converter despesa financeira em serviço da dívida ou comparar margem parcial diretamente com margem anual. Os saldos patrimoniais permanecem posições, sem anualização. Não há novos campos ou etapas na interface principal, que mantém exatamente três etapas e botão fixo de relatório. O leitor `simulador/v3/import.js` não foi alterado.

**Commits exclusivos da branch:** implementação `614a97482676b5fa0a0348d021e4dad046c64421`; testes `75d588c88a67e660dd59f4d3e56b9049b379b2c3`. **Testes executados:** Node.js v22.16.0, `npm test` em diretório isolado para `mvp-triagem-excecoes.test.mjs`, **11 aprovados, 0 falhas**. Incluídos casos de juros de 9 meses, margem de 3 meses, ambos anuais, manutenção de alertas anteriores e vedação de dados documentais. A suíte integral do repositório e testes interativos em navegador não foram executados.

**Preview Vercel:** `dpl_8su2hB541rPRBtggDeFKxVhxKrYz`, `READY`, `target:null`, commit `75d588c88a67e660dd59f4d3e56b9049b379b2c3`. Verificação autenticada retornou HTTP 200 para `index.html`, `mvp-triagem-excecoes.js` e `simulador/v3/import.js`; o link temporário de compartilhamento da interface também retornou HTTP 200. Navegação interativa externa e QA móvel ainda não homologados. Sem merge na `main`, deploy de produção, gastos ou dados pessoais.

**Bloqueios:** a ponte ainda transporta indicadores agregados, sem rubricas por exercício e evidência contábil suficiente para medir materialidade ou reconciliar BP/DRE/balancete/FCADS. Matriz setorial, elegibilidade IBS/CBS, transição 2027 a 2033, tratamento de frota e ICSD contratual seguem sem validação. Não usar documentos reais no preview nem emitir parecer.

**Próxima ação:** transferir rubricas contábeis revisadas com competência e trilha não identificável para conciliação por exercício, sem duplicar o importador nem alterar a projeção original do economista antes da conferência.


## NCG do exemplo vinculada às rubricas contábeis (02/11/2026)

**Entrega única desta execução:** corrigida a origem da NCG atual no exemplo
fictício. Antes, a fórmula usava números literais independentes das contas
do balancete, permitindo divergência silenciosa após alterações nas rubricas.
Agora os saldos de Clientes, Estoques e Fornecedores operacionais são lidos
diretamente da mesma lista de contas que alimenta BP e balancete, exigindo
uma ocorrência única, finita e não negativa por rubrica. A memória
`memoriaNCG` expõe os três componentes e a fórmula, sem mudar o contrato
anterior de `ncg`. Os resultados do exemplo original permanecem 220,
230 e variação 10. Não há novas etapas, campos, parser ou projeções reais.

**Commits na branch exclusiva:** implementação
`802df02428ee64bd7c42020861a0f6b542ecce08`; testes
`5f88b8fd724042b78a9374be6aa2bccb0daf9ccd`.
**Testes nativos executados:** Node.js v22.16.0, `npm test` em diretório
isolado com os dois módulos e seus testes: **8 aprovados, 0 falhas**.
Incluem regressão que modifica Clientes e Caixa mantendo o BP equilibrado:
a NCG passa a 240 e a variação a 20; e bloqueio por rubrica ausente.
Blobs de implementação e testes conferidos contra arquivos locais
executados: `73b6dde8d3e7f9a007f965a8946972bd996f5623` e
`81a5c1d94e72028efe64b144014c14a4091fe2cb`.
O módulo e os testes de memória contábil, sem alterações, também foram
incluídos no teste de integração isolado. Não foi executada a suíte
integral do repositório nem teste interativo móvel.

**Preview verificado:** deployment automático
`dpl_3i1LXV9bcJDRpxERshrpA254YK3W`, estado `READY`,
`target:null`, commit `5f88b8fd724042b78a9374be6aa2bccb0daf9ccd`.
Leitura autenticada da Vercel retornou HTTP 200 para a interface,
o módulo alterado e o leitor existente `simulador/v3/import.js`.
O acesso externo independente e a navegação interativa não foram
homologados. Nenhum merge na `main` nem publicação em produção.

**Bloqueios:** a conciliação ainda é apenas aritmética e sintética. O
importador transfere indicadores agregados, não rubricas detalhadas por
exercício. NCG real, DFC, FCADS/ICSD contratual, matriz legal IBS/CBS,
transição 2027 a 2033, elegibilidade de créditos e compra/revenda de frota
não foram conciliados ou homologados. Não utilizar dados reais no preview
nem emitir parecer de crédito. **Próxima ação:** integrar rubricas
contábeis explicitamente revisadas, com competência e trilha documental
não identificável, à conciliação por exercício antes de aplicar qualquer
ajuste à projeção original do economista.


## Contrato interno de rubricas revisadas por exercício (02/11/2026)

**Entrega pequena desta execução:** criado o módulo isolado
`mvp-conciliacao-rubricas.js`, que recebe apenas rubricas explicitamente
classificadas e revisadas por exercício e demonstração (BP, DRE ou balancete).
Não duplica o leitor `simulador/v3/import.js`, não acessa arquivos,
não transfere identificação da empresa e não altera a interface de três etapas.
Exige exercício, grupo conhecido, valor finito, confirmação de revisão e
referência opaca de documento/linha. Rejeita referências duplicadas no mesmo
exercício e somas fora do limite numérico. Calcula fechamento aritmético do
BP e balancete, identifica grupos ausentes e apresenta resultado ilustrativo
da DRE. A saída não contém as referências documentais de entrada.
A mesma linha de um documento pode ser usada em exercícios distintos.

**Commits exclusivos da branch:** módulo
`c72e381f66a0fb99ef7637e433eee69ca3a4f919`;
testes `a51f8c19665f746687d49568e54810f49e8ff1c9`.
**Testes executados:** Node.js 22.16.0, `npm test` em diretório isolado,
**5 aprovados, 0 falhas**. Os blobs relidos da branch coincidiram com
`git hash-object` dos arquivos executados:
`5c2f407577e8c207a473b63b25b167400a36af73` (módulo) e
`1a45e4648e6c1c5198df7809c7e3db22c749e1da` (testes).
Não foi executada a suíte integral do repositório nem QA interativo móvel.

**Integração e limitações:** o novo módulo ainda não é consumido pela ponte
do importador nem pela interface. O leitor v3.2 continua transferindo apenas
indicadores agregados, insuficientes para reconciliar BP, DRE e balancete
reais. Fechamento aritmético não comprova consistência entre demonstrações,
competência, EBITDA, NCG, DFC, FCADS, serviço da dívida, ICSD ou elegibilidade
de créditos IBS/CBS. `aptoParaParecer` e `aplicadoProjecao` permanecem
sempre falsos. Valores e documentos reais não devem ser usados no preview.
Não há homologação setorial, tributária ou de crédito.

**Preview:** Vercel acionada automaticamente pela branch; confirmar estado
READY e acessibilidade da versão final antes de divulgar qualquer link.
Não houve merge na `main`, alteração intencional de produção ou gasto.

**Próxima ação:** integrar rubricas revisadas com trilha de origem opaca à
ponte do importador, preservando a aceitação explícita e os bloqueios de
conciliação antes de aplicar qualquer ajuste à projeção do economista.

**Verificação posterior de preview:** deployment
`dpl_2cEMmcvFt3nspkiN1z5VriMBXpYv`, commit
`13839832cf97a32019338c04394581d1915200bd`,
estado `READY`, `target:null` (preview, não produção).
Leitura autorizada pela Vercel retornou HTTP 200 para a interface,
o módulo novo e `simulador/v3/import.js`. O acesso público externo
independente não foi confirmado; não divulgar link sem verificação
de compartilhamento. Nenhum teste de navegação interativa foi executado.


## Quantificação descritiva de divergências contábeis (02/11/2026)

**Entrega única desta execução:** o contrato isolado `mvp-conciliacao-rubricas.js`
agora informa, por exercício, valor absoluto, base de comparação e percentual
da divergência no BP e no balancete. No BP, a base é o maior valor entre ativo
e passivo mais patrimônio; no balancete, o maior entre débitos e créditos.
Se uma rubrica obrigatória faltar, os três indicadores ficam indisponíveis,
sem substituição silenciosa por zero. Uma base igual a zero não produz
percentual. O status de materialidade permanece explicitamente
`sem_limite_de_materialidade_validado`: **não foi criado limiar arbitrário**
nem dispensada revisão de qualquer divergência. O fechamento aritmético,
os bloqueios, a proibição de parecer e o contrato anterior foram preservados.
Não há novos campos na interface de três etapas e o importador v3.2
permanece intacto.

**Commits exclusivos da branch:** implementação
`b79e10a8f6af1f1b665293ab48182cb6ccf70536`; regressão
`a6c2a577e14dbc09ac4bdee816387c94f9034f71`.
**Testes nativos:** `npm test` em Node.js, diretório isolado contendo
o módulo e seus testes, **9 aprovados, 0 falhas**. Quatro novos casos
verificam divergência percentual, ausência de grupo, denominador do
balancete e base nula. Não foi executada a suíte completa do repositório
nem QA interativo da interface.

**Bloqueios:** a ponte do importador ainda não transporta rubricas
revisadas com origem e competência por exercício. Os percentuais são
medidas descritivas, **não decisões de materialidade**. Continuam sem
conciliação completa a DFC, FCADS contratual, ICSD, regras legais setoriais,
créditos IBS/CBS, transição 2027 a 2033 e compra/revenda de frota.
Não utilizar dados reais no preview nem emitir parecer de crédito.

**Próxima ação:** conectar, sem expor dados pessoais, as rubricas
explicitamente revisadas do leitor v3.2 ao contrato de conciliação
por exercício, preservando a projeção original do economista até
aprovação das exceções. Sem merge na `main`, alteração deliberada
de produção ou gastos. Preview Vercel validado quanto ao estado READY, sem verificação de acesso externo.

**Verificação posterior de preview:** deployment automático
`dpl_7267pBGgWcJKnfQsbbK4P6x6VyiA`, associado ao commit de testes
`a6c2a577e14dbc09ac4bdee816387c94f9034f71`, confirmado
`READY` e `target:null` (preview, não produção) pela Vercel.
O acesso externo à página de preview não pôde ser verificado e a leitura
do arquivo implantado via API retornou 404; por isso não foi divulgado
link de testes nem alegada homologação de navegação ou mobile.

## Ausência documental não é saldo zero (02/11/2026)

**Entrega única:** corrigido o contrato isolado `mvp-conciliacao-rubricas.js` para
não calcular resultado ilustrativo da DRE nem diferenças de BP e balancete
quando faltar uma rubrica obrigatória. Nesses casos, os indicadores são
`null`, os grupos faltantes permanecem em `ausentes` e o exercício segue
`pendente_revisao`. Saldo zero explicitamente informado e revisado continua
sendo aceito como zero. Isso evita gerar lucro ou fechamento presumidos
a partir de dados incompletos, sem inventar materialidade.

**Commits exclusivos da branch:** implementação
`6c8b7ba1f00a30e9f04000f86415b44b18aa49e5`; regressão
`62acc19ef8a4107fe8efabf9212df2e6cecaa4f0`.
**Testes:** Node.js, `npm test` em diretório isolado com cópia do módulo e
teste de regressão, **12 aprovados e 0 falhas**. Três casos novos cobrem
DRE incompleta, BP/balancete incompletos e saldo zero confirmado.
Não foi executada a suíte integral do repositório nem QA móvel interativo.

**Escopo e bloqueios:** módulo ainda não conectado ao importador v3.2;
este transporta somente indicadores agregados, sem rubricas detalhadas e
origem por exercício. A interface mantém três etapas e botão fixo de
relatório, sem modificações nesta entrega. Nenhum ajuste é aplicado à
projeção original do economista. Persistem ausência de conciliação real
BP/DRE/balancete/DFC, FCADS/ICSD contratual, matriz setorial validada,
elegibilidade IBS/CBS, transição 2027 a 2033 e tratamento completo de
compra e revenda de frota. Materialidade não foi definida; sem homologação
tributária ou de crédito. Não utilizar dados reais no preview.

**Preview:** deployment automático do commit de testes
`dpl_sPzgVUkhE82aFeECGU9b1SzrPqUF` observado inicialmente
`BUILDING`, `target:null`. A confirmação de READY e a verificação
de acesso devem ser feitas separadamente antes de divulgar endereço.
Sem merge na `main`, alteração intencional da produção, gastos ou dados
pessoais.

**Próxima ação:** definir o contrato mínimo para transportar do leitor
v3.2 as rubricas efetivamente revisadas com exercício, competência e
origem opaca, sem enviar documentos, e só então conectar a conciliação
à etapa 2, mantendo a revisão de exceções e bloqueios.

## Bloqueio de mistura de competências na conciliação anual (02/11/2026)

**Entrega única:** criado o adaptador isolado `mvp-competencia-rubricas.js`, que valida a competência de rubricas explicitamente revisadas antes de chamar `conciliarRubricasRevisadas`. Para o caminho **exclusivamente anual**, exige BP e balancete em 31/12 do exercício e DRE abrangendo 01/01 a 31/12 do mesmo exercício. Rejeita data impossível, competência ausente, DRE parcial e balancete intermediário, sem anualizar ou inferir valores. Os balancetes recentes exigirão caminho próprio e conciliação com a projeção original do economista. O adaptador utiliza lista positiva de campos, não transmite CNPJ, nomes de arquivos ou texto original, e mantém `aptoParaParecer=false` e `aplicadoProjecao=false`. Nenhuma alteração foi feita à interface principal de três etapas, ao importador `simulador/v3/import.js`, às regras tributárias ou às projeções.

**Commits exclusivos da branch:** implementação `f94bcf3086117a35b1c9940f8431a2be51ffe333`; regressão `5bb9be75a28e24ed595ded0365c38372d9a0d88d`. **Teste nativo Node 22.16.0:** `npm test` em diretório isolado com o módulo novo, o módulo existente de conciliação e o teste novo: **7 aprovados, 0 falhas**. O blob da dependência local corresponde ao blob existente na branch (`cdbd11f884392deab254320fb70c37ccfb0e5892`); os dois blobs novos foram relidos da branch e coincidem com os arquivos testados (`03ec4597cf025faad887d92962d28652d20497b2` e `f5577f02bf58cfcc17f0699b0d97b47dbd0f9aac`). Não foi executada a suíte integral nem QA móvel interativo.

**Bloqueios:** este adaptador ainda não está conectado à ponte do leitor v3.2, que fornece somente indicadores agregados, não rubricas detalhadas com exercício, competência e origem. O caminho anual não processa balancete intermediário e não comprova materialidade, classificação contábil completa, NCG real, DFC, FCADS/ICSD contratual, créditos IBS/CBS, transição legal 2027 a 2033 ou compra/revenda de frota. Sem validação setorial, tributária ou de crédito. Não utilizar documentos reais no preview.

**Próxima ação:** estabelecer no leitor v3.2 um contrato de saída explícito e opt-in para rubricas detalhadas revisadas, com competência e referência opaca, e construir separadamente a conciliação de balancetes intermediários, sem modificar automaticamente a projeção do economista. Confirmar preview Vercel antes de divulgar link. Sem merge na `main`, alteração deliberada de produção, gastos ou dados pessoais.

**Verificação do preview desta entrega:** deployment automático `dpl_6g7hBXFc9YJd3Bj83MnxDpNHkMUZ`, commit de documentação `e864e1de253f5e994f01f92db9ae34dd3c9cda19`, confirmado `READY` e `target:null` pela Vercel. A leitura de arquivos do deployment pela API retornou `404 file not found`, a listagem de arquivos retornou `404 file tree not found` e o acesso externo independente à página não foi confirmado. **Não divulgar endereço de preview como verificado**; não houve QA de navegação ou dispositivo móvel. Nenhuma publicação manual em produção foi realizada.


## Balancete intermediário com competência própria (02/11/2026)

**Entrega única:** criado o contrato isolado `mvp-balancete-intermediario.js`, que
aceita exclusivamente rubricas de um balancete intermediário com mesma data-base,
exercício compatível, classificação e revisão explícitas. Reutiliza a validação
contábil de `mvp-conciliacao-rubricas.js`, mas devolve apenas a diferença entre
débitos e créditos, sua quantificação descritiva e as rubricas ausentes.
Não presume que a data-base parcial represente o encerramento anual, não
anualiza saldos, não deriva DRE/BP e não altera EBITDA, NCG, caixa, serviço
da dívida, ICSD ou a projeção do economista. A saída omite CNPJ, nomes de
arquivos e referências documentais. O fechamento aritmético parcial é
explicitamente distinto de uma conciliação anual ou auditoria.

**Commits exclusivos da branch:** implementação
`d94fa87cd0e8ade9416a56a4348df03de71324e5`;
testes `629329af3cb0c1b5c9a6e822cceb60abd6ad846b`.
**Testes nativos:** `npm test`, Node 22.16.0, diretório isolado,
**7 aprovados, 0 falhas**. O teste utilizou o blob exato da dependência preexistente
(`cdbd11f884392deab254320fb70c37ccfb0e5892`), conferido por
`git hash-object`; não foi executada a suíte integral do repositório.
Os dois arquivos novos foram relidos da branch e seus blobs coincidiram
com os arquivos locais executados (`397f6ba44d85875cc09d033749ddf1c8e817acd7`
e `a852aad8ce436ab8048b822ad3d12cd1e9c0ec61`).
Não houve QA móvel ou de navegação interativa.

**Bloqueios:** o contrato ainda não está conectado à saída do leitor v3.2,
que atualmente fornece candidatos agregados, não rubricas detalhadas
revisadas com competência e origem. A conciliação parcial não substitui
BP/DRE, DFC, FCADS/ICSD contratual, materialidade validada, classificação
setorial, créditos IBS/CBS ou transição 2027 a 2033. O tratamento completo
de locadoras e compra/revenda de frota continua pendente. A interface
principal de três etapas e o botão fixo de relatório não foram modificados.
Nenhuma alteração foi feita na `main`, na produção ou no importador original.
Não usar documentos empresariais reais no preview nem apresentar o
resultado como homologado.

**Próxima ação:** criar contrato opt-in no leitor v3.2 para transferir
rubricas detalhadas explicitamente revisadas, com exercício, competência,
referência opaca e linha de origem, sem dados pessoais; integrar somente
após conciliação e revisão de exceções. Confirmar o preview na Vercel
antes de divulgar link.

**Preview verificado para o commit de documentação anterior:** deployment
`dpl_G3PgvCooCWvA1Woe71RBkXoxRXLz` associado a
`6005a7c1b12c2b7e436f595e10cb4f6b137ccd59`, estado `READY`,
`target:null`. A leitura autorizada pela Vercel retornou HTTP 200 para
`index.html`, `mvp-balancete-intermediario.js` e `README.md`.
O endereço compartilhável foi disponibilizado pela Vercel, mas não houve
QA interativo ou homologação de dispositivos móveis. A atualização deste
registro gera novo commit e requer verificação própria do novo preview.


## Ponte de revisões contábeis aprovadas para conciliação anual (02/11/2026)

Entrega pequena e isolada: `mvp-adaptador-revisoes.js` recebe lotes previamente aprovados pelo contrato de `ingestao-contabil.js`, exige classificação explícita de cada registro, referência efêmera de documento, linha de origem, competência anual e valores em BRL. Encaminha somente rubricas numéricas revisadas a `conciliarRubricasAnuaisComCompetencia`. Não transmite CNPJ, nome, texto de conta, identificador do documento original ou identidade do analista. Não modifica a interface, a projeção do economista, o importador v3.2 ou indicadores financeiros.

Commits: implementação `71d3bbeb420a2b067dc5a0d14c813544f2734583`; testes `596d8456875331204a93d91b3b38be3f4e4d2485`; documentação neste registro. Teste local nativo Node 22: `npm test` no diretório isolado com o adaptador, seus 7 testes e cópias funcionais dos módulos de competência e conciliação. **7 aprovados, 0 falhas**. Os arquivos foram escritos na branch após os testes. A suíte integral do repositório e testes de navegador não foram executados. Não se deve equiparar este ensaio local à homologação do fluxo de importação.

Bloqueios: `simulador/v3/import.js` ainda fornece candidatos agregados e não um conjunto completo de rubricas revisadas com origem por linha; a nova ponte não está ligada ao fluxo operacional. Os campos de classificação, competência e escala dependem de revisão explícita. Valores negativos não são convertidos automaticamente em contas positivas. Não há materialidade validada, DFC/FCADS contratual, homologação tributária ou parecer de crédito auditado. A saída mantém `aptoParaParecer=false` e `aplicadoProjecao=false`.

Próxima ação: expor, de modo opt-in e sem dados pessoais, rubricas classificadas e revisadas com origem por linha a partir do leitor existente do v3.2; só então conectar a ponte ao fluxo da etapa 2 e testar a conciliação ponta a ponta. Preservar exatamente três etapas na interface. Sem merge na main, mudança intencional de produção ou serviços pagos.


## Transporte preliminar de rubricas numéricas do leitor v3.2 (02/11/2026)

**Entrega única:** o novo módulo `mvp-rascunhos-v3.js` recebe, exclusivamente em memória, `brmiImport.files[].parsed` produzido pelo leitor existente `simulador/v3/import.js`. Extrai candidatos numéricos simples de CSV, XLSX/XLS e linhas de PDF já convertidas em texto pelo leitor, preservando apenas referência efêmera do documento, linha de origem, formato e valor. Linhas comparativas ambíguas são recusadas. Não transfere CNPJ, nomes, texto de contas, nome de arquivo ou documento original. Não supõe escala, competência, classificação, aprovação, materialidade ou integridade documental. Todo rascunho recebido permanece `revisado:false`, `aptoParaConciliacao:false`, `unidade:'nao_confirmada'`, `grupo:null` e `periodo:null`.

**Integração real, ainda limitada:** o botão de transferência já existente na aba do Simulador v3.2 encaminha os rascunhos numéricos junto com os candidatos aceitos pelo canal local `BroadcastChannel`. O receptor valida o pacote por lista positiva e a página principal de três etapas informa a quantidade de linhas recebidas, sem aplicá-las a cálculos. Em caso de volume excessivo, descarta o lote detalhado e mantém o envio dos candidatos agregados aceitos. O módulo não altera `simulador/v3/import.js`, o exemplo fictício, a projeção original do economista nem a produção. O botão fixo de relatório e as três etapas foram preservados.

**Commit de implementação:** `7d0cd5639a6dc3aa73a99113d663ac4a567ea9b1` na branch `feature/motor-rt-credito-360`. **Testes nativos Node 22.16.0:** `npm test` em diretório isolado, 8 aprovados e 0 falhas, abrangendo CSV, Excel, PDF textual, proteção de identidade, múltiplas colunas, sinais, limites, lista positiva e rejeição de falsificação de revisão. O teste inicial revelou uma linha ambígua com código numérico e foi corrigido antes do commit. Não foi executada a suíte integral do repositório nem teste interativo do canal em navegador real. Verificação estática do HTML modificado: exatamente três seções principais e botão fixo presentes.

**Bloqueios concretos:** a origem por linha é efêmera, mas ainda não há confirmação de período, unidade, sinal contábil e grupo pelo analista; rubricas detalhadas não chegam ao adaptador `mvp-adaptador-revisoes.js` nem à conciliação. PDF/OCR pode produzir erros e os limites de 10 arquivos, 2.000 linhas por arquivo e 250 rubricas são limites técnicos de segurança, não critérios de materialidade. A aceitação de candidatos agregados não equivale à aprovação contábil das linhas. Não há validação tributária setorial, DFC, FCADS/ICSD contratual nem tratamento completo de compra e revenda de frota. Nenhum dado real ou pessoal foi usado nos testes; não usar documentos reais no preview.

**Próxima ação:** criar confirmação de competência, escala e classificação das linhas preliminares na etapa 2, priorizando apenas exceções materiais depois de definir e documentar critérios técnicos; então conectar os lotes aprovados ao adaptador de conciliação por exercício. Validar o preview na Vercel e divulgar endereço somente se o acesso for confirmado. Sem merge na `main`, alteração deliberada de produção ou serviços pagos.


## Confirmação explícita de rubricas preliminares do leitor v3.2 (02/11/2026)

**Entrega única e isolada:** criado `mvp-confirmacoes-v3.js`, que recebe os rascunhos
numéricos já saneados por `mvp-rascunhos-v3.js` e decisões explícitas por
referência opaca e linha. Valida exercício, competência de BP/DRE/balancete,
grupo contábil, escala declarada (BRL, milhares ou milhões) e sinal.
Preserva DRE parcial sem anualização e separa linhas sem confirmação,
descartes justificados e valores negativos que exigem tratamento contábil.
Rejeita decisões duplicadas, datas impossíveis, grupos incompatíveis e
conversões fora do limite. A saída utiliza lista positiva de campos e
não transporta CNPJ, nomes, textos de contas ou identidades.

**Segurança e escopo:** a confirmação é declarativa, não autenticada.
Todas as rubricas continuam `revisado:false` e
`aptoParaConciliacao:false`; `aptoParaParecer` e
`aplicadoProjecao` permanecem falsos. Nenhuma decisão é inferida como
imaterial: não há limiar de materialidade tecnicamente validado.
O novo contrato ainda não foi conectado à etapa 2, ao adaptador de
revisões aprovadas ou às projeções do economista. A interface principal
de três etapas, o botão fixo de relatório, o importador v3.2, a main
e a produção não foram modificados.

**Commits na branch exclusiva:** implementação
`9ad2996c4d16eb6cdbe3c518f865cf5f605eb184`; regressão
`1639a887c797f52d646d101401048af5799b58de`.
**Testes Node 22.16.0:** `npm test` em diretório isolado com o módulo
novo, os 9 testes nativos e o validador original `mvp-rascunhos-v3.js`,
cujo blob coincide com a branch (`bb8bd9016fd04a97a1c68de090fb7cb1be8fb48e`):
**9 aprovados, 0 falhas**. Os blobs dos arquivos novos foram relidos
da branch e conferidos com os arquivos testados
(`fbc2fada4f53daab01b2313016dd934e07e5ae2d` e
`19e83a694509fa2dc68ce353579b55d3ebceb0db`).
Não foi executada a suíte integral do repositório nem QA móvel interativo.

**Bloqueios:** falta a revisão autenticada e o critério institucional
de materialidade; a classificação declarada não substitui a
conciliação de BP, DRE e balancete, DFC, FCADS/ICSD contratual,
validação tributária setorial, créditos IBS/CBS, transição 2027 a
2033 ou a segregação da compra e revenda de frota nas locadoras.
Não usar documentos empresariais reais no preview nem emitir parecer.

**Próxima ação:** integrar o contrato à etapa 2 como confirmação local
de exceções, sem criar uma quarta etapa, e conectar ao adaptador
somente após controle verificável de revisão e conciliação. Validar
preview Vercel e divulgar link apenas quando o acesso estiver confirmado.
Sem merge na main, gastos ou dados pessoais.


## Etapa 2: triagem conservadora de rubricas recebidas (02/11/2026)

**Entrega única:** a página principal passou a chamar `resumirPendenciasEtapa2`, que
reutiliza `prepararConfirmacoesRubricasV3` com decisões vazias para validar
o lote de rubricas preliminares do leitor v3.2 e informar apenas o número
de linhas pendentes. Lotes inválidos ou com origem duplicada são recusados
sem apresentar valores. Não há confirmação automática, classificação
presumida, critério arbitrário de materialidade nem transferência de dados
para conciliação, projeções financeiras ou parecer. A mensagem usa
`textContent`, sem expor valores, textos de contas ou identidades.

**Commit de implementação:** `0e9b2e8bc4303600f82d70ca32a685ce75339dfa`.
**Testes nativos Node 22.16.0:** `node --test mvp-etapa2-confirmacoes.test.mjs`
em diretório isolado com cópias exatas dos módulos necessários: **5
aprovados, 0 falhas**. Abrange lote válido, vazio, falsificação de revisão,
duplicidade de origem e não exposição de valores e metadados. Os blobs
novos relidos da branch coincidem com `git hash-object` dos arquivos
testados: `e857903d1e5c8afc48e37e9552ce666cd2df3fbd` e
`99845c7c9200157c842f88c9d61bff53b2c5eaa8`.
Verificação estática do HTML da branch: exatamente três seções
principais, botão fixo de relatório preservado e novo módulo importado.
Não foram executadas a suíte integral do repositório, navegação
interativa real nem testes móveis. O importador `simulador/v3/import.js`
não foi alterado.

**Bloqueios:** o fluxo apenas identifica pendências, sem permitir ainda
confirmar competência, unidade e classificação na interface. Não existe
revisão autenticada nem critério institucional de materialidade.
A ponte de conciliação por exercício não recebe rubricas aprovadas.
DFC, FCADS/ICSD contratual, créditos IBS/CBS, transição tributária
2027 a 2033, tratamento integral de locadoras e validação setorial
permanecem pendentes. O exemplo fictício e a projeção do economista
não foram alterados. Não utilizar dados empresariais reais no preview
nem emitir parecer homologado.

**Próxima ação:** criar revisão local compacta e explícita das exceções
na própria etapa 2, sem quarta etapa nem aprovação automática; somente
encaminhar rubricas após validação institucional de revisão e conciliação.
Verificar o preview Vercel antes de divulgar endereço. Sem merge na
`main`, mudança de produção, gastos ou dados pessoais.

## Guarda de integridade do relatório fictício (02/11/2026, execução seguinte)

**Entrega única:** adicionado `mvp-integridade-relatorio-demo.js` e conectado ao botão já existente da etapa 3. Antes de desenhar a tabela, a guarda exige exatamente três cenários identificados, oito exercícios consecutivos de 2026 a 2033 por cenário (24 linhas), memória contábil sintética de 2026, caixa original e serviço da dívida idênticos entre cenários, ICSD compatível com caixa/serviço, variação de caixa e resumos aritmeticamente conciliados. Uma divergência bloqueia a exibição do relatório, em vez de apresentar tabela parcial ou falsa impressão de validação. Não cria quarta etapa, não altera o importador v3.2, o exemplo original nem a metodologia de projeção do economista.

**Commits:** módulo `517b29e72ad73da5dc8b2bd4cb748a0447326f19`; testes `de430c4f7a97c6086ccdd02af6165ea538a2e60d`; ligação na interface `239c42b2db775bc780cb882652c143e4827a65b7`. Testes locais com Node 22.16.0: `node --test mvp-integridade-relatorio-demo.test.mjs`, **9 aprovados, 0 falhas** após corrigir um cenário do próprio teste que não produzia insuficiência. Os hashes Git dos dois arquivos testados foram conferidos com os blobs efetivamente publicados na branch: `f805e5c05f05aae80e8698518993dc7bddfab1d7` e `bf3dbf1bd8a60a1b020a12662a062a19194134b5`. Inspeção estática da página confirmou exatamente três seções e o botão fixo de relatório.

**Bloqueios:** os testes são unitários e não substituem execução integrada em navegador, testes móveis ou a suíte completa do repositório. O relatório continua exclusivamente fictício, sem comprovação documental, revisão autenticada, FCADS contratual, créditos IBS/CBS homologados ou parecer validado. A guarda valida coerência de apresentação, não o mérito da reforma tributária. A conciliação das rubricas reais recebidas do leitor v3.2 continua bloqueada até classificação, competência, escala, critérios de materialidade e revisão aprovados.

**Próxima ação:** executar teste integrado do exemplo fictício e do canal do leitor em navegador real; avançar na revisão compacta das exceções da etapa 2 sem liberar dados não conciliados para projeções. Manter todas as alterações na branch `feature/motor-rt-credito-360`, sem merge na main, gastos ou uso de dados pessoais.


## 2026-11-02 | Retorno do importador ao Motor
- Correção na branch de desenvolvimento: botão `Voltar ao Motor RT Crédito 360` na aba do importador v3.2.
- O botão permanece desabilitado até a confirmação de recebimento pelo canal local. Ao clicar, tenta fechar a aba secundária, preservando o Motor original. Se o navegador impedir o fechamento, orienta retornar manualmente à aba anterior.
- Nenhuma transferência automática de arquivos, CNPJ ou dados pessoais foi adicionada. Sem merge na main e sem publicação de produção.
- Testes automatizados de integração e navegação móvel ainda pendentes; não alegar homologação.
- Próxima ação: executar teste ponta a ponta em navegador com dois separadores e confirmar o comportamento de fechamento em Android e desktop.


## 2026-11-02 | Saída do importador sem dados elegíveis
Entrega pequena: o botão de retorno da aba auxiliar agora permanece disponível mesmo quando nenhum valor foi aceito, ou quando a transferência não foi confirmada. O rótulo distingue `Voltar ao Motor sem importar` de `Voltar ao Motor RT Crédito 360` após confirmação. A aba do Motor permanece aberta, sem reenvio de documentos ou recarregamento. Commit: `d3dc12e6b7793844a3e7ab7e4fe31963f2995b4c`.

Verificação: 5 asserções estáticas de regressão passaram sobre o arquivo lido novamente da branch (rótulos, estado de confirmação, fechamento e protocolo). **Teste Node e teste de navegador não executados nesta entrega**: o ambiente local não conseguiu resolver o host do GitHub para obter a cópia do repositório. Não há validação de preview Vercel desta alteração, portanto nenhum novo link é divulgado. Bloqueios: validar Node, fechamento da aba em navegadores móveis e o percurso completo de importação. Próxima ação: executar testes Node e E2E do fluxo com e sem valores aceitos em preview isolado.


## 2026-11-02 | Ajuste pontual de texto do retorno
- Entrega: eliminada atribuição duplicada de `textContent` no botão de retorno do importador v3.2. O rótulo inicial fica explicitamente `Voltar ao Motor sem importar`.
- Commit: `396102384a6bf8ea5afbbaec4f38d9910b109b53`.
- Verificação: conferência estática do trecho antes da gravação. Execução Node e testes de navegação NÃO concluídos: ambiente local sem resolução DNS para obter a versão da branch. Não declarar teste aprovado.
- Bloqueio: preview Vercel não validado nesta execução. Nenhum link divulgado. Sem merge, produção ou dados pessoais.
- Próxima ação: testar o protocolo de confirmação e retorno em navegador real, inclusive envio pendente e ausência de valores elegíveis, e executar suíte Node.


## 2026-11-03 | Abertura defensiva do importador
Entrega única: `abertura-importador.js` trata exceções de `window.open` sem perder o estado do Motor; a ponte exibe orientação quando a abertura falha. O retorno `null` de `window.open` com `noopener` não é interpretado incorretamente como bloqueio. Mantidos os três passos e o isolamento do importador v3.2.

Commits: módulo `a74530d5`, teste `e174a75b`, integração `98762f83`. Testes Node: `node --experimental-default-type=module --test abertura-importador.test.mjs`, 3 testes aprovados no ambiente local sobre os arquivos preparados para commit. Limitação: suíte completa do repositório e navegação E2E não executadas porque a rede local não resolve github.com. Preview Vercel do commit de integração localizado inicialmente em INITIALIZING; aguardar READY e verificar conteúdo antes de divulgar link. Próxima ação: validar fluxo completo de abertura, importação, confirmação e retorno em navegador móvel e desktop.


## 2026-11-03 | Confirmação explícita do retorno
- Entrega pequena: `criarEmissorConfirmado` passa a emitir callback `aoConfirmar` apenas quando o ACK do Motor corresponde ao envio pendente. A aba do Simulador não interpreta mais texto de status para decidir se recebeu confirmação.
- Testes: quatro cenários Node em cópia local do protocolo passaram; quatro testes de regressão adicionados ao repositório em `mvp-confirmacao-transferencia.test.js` (execução no checkout do repositório ainda pendente).
- Bloqueios: teste real entre abas, comportamento móvel e preview Vercel ainda precisam de confirmação independente. Sem mudança em produção, main ou dados pessoais.
- Próxima ação: validar a navegação ponta a ponta e executar a suíte diretamente sobre o checkout da branch.


## 03/11/2026: filtro de mensagens da ponte entre abas

Entrega isolada: o receptor do Motor ignora mensagens que não tenham o tipo explícito `rt360-candidatos-revisados-v1`, antes de verificar o identificador. Isso evita tratar confirmações ou mensagens de outro tipo como documentos inválidos e sobrescrever o aviso de importação. Não altera os três passos, fórmulas, produção ou tratamento de dados.

Commit de código: `a461f1a886aaf4dd6c14bb7fb046f458cb323ef8`.
Testes: `node --test` em harness local isolado reproduzindo o filtro e a validação de identificador, 4 aprovados, 0 falhas. **Não** foi executada a suíte Node diretamente sobre o módulo do repositório nem teste ponta a ponta em navegador. Bloqueios: QA real da transferência e retorno em abas, integração da conciliação documental e auditoria fiscal. Próxima ação: adicionar regressão integrada ao repositório e validar fluxo de importação em navegador desktop e móvel. Sem merge na main e sem alteração intencional de produção.


## 03/11/2026: regressão de falha e reenvio na ponte de importação

Entrega pequena: `mvp-confirmacao-timeout.test.js` acrescenta dois testes Node para (1) expiração sem confirmação, descarte de ACK tardio e reenvio com novo identificador; (2) falha no `postMessage`, ausência de confirmação falsa e recuperação na tentativa seguinte. Não altera a interface principal nem a lógica tributária. Commit do teste: `6e1170fda1bf0bad820d49a12108b620b1da3799`.

Verificação: `node --test timeout.test.js` em cópia local fiel do módulo `mvp-confirmacao-transferencia.js` lido da branch, 2 testes aprovados e 0 falhas. A cópia local não substitui a execução da suíte integral no checkout Git, indisponível neste ambiente por falha de DNS ao acessar GitHub. Teste em navegador e em dispositivos móveis ainda pendente. Nenhum documento real, dado pessoal, merge ou alteração de produção.

Bloqueios: não há teste ponta a ponta validado da transferência e retorno, nem conciliação documental completa. Próxima ação: executar os testes Node diretamente no checkout da branch e validar a troca entre abas, inclusive falha, timeout e reenvio, antes de conectar dados ao cálculo de crédito. Não considerar o Motor homologado.


## 03/11/2026 | Divergências documentais na importação

Entrega pequena: a ponte do Simulador v3.2 para o Motor deixa de tolerar silenciosamente diferenças numéricas de até R$ 0,01 entre duas rubricas aceitas do mesmo campo e período. Agora valores diferentes, inclusive subcentavo, não são consolidados automaticamente. A decisão não fixa limiar de materialidade: exige conciliação antes de aplicar qualquer ajuste. Duplicatas exatamente iguais permanecem aceitas. Não altera as três etapas nem os cálculos de IBS/CBS, NCG e ICSD.

Commits: código `2533772622b4685b3313c0ecbc7caf03ddf46dd5`; regressão `797623d105518f16aaa6c93fdcd026e8245e48b0`. Verificação: quatro testes nativos `node --test` aprovados em reprodução isolada da regra, incluindo duplicata, diferença de centavo, subcentavo e períodos distintos. A execução do arquivo de regressão diretamente sobre os módulos da branch e a suíte completa continuam pendentes. Preview Vercel não validado nesta entrega, portanto não divulgar URL como verificada.

Bloqueios: a revisão de exceções materiais ainda não está integrada ao fluxo completo de BP/DRE/balancete; falta teste ponta a ponta do retorno entre abas, conciliação de DFC e FCADS e auditoria tributária. Próxima ação: executar o teste nativo diretamente na branch e validar a importação completa no navegador, inclusive no celular. Nenhum merge na main nem alteração deliberada de produção, gastos ou uso de dados pessoais.


## 03/11/2026: envio de rubricas sem valores aceitos

Entrega: a ponte do Simulador v3.2 agora permite enviar rubricas preliminares mesmo quando nenhum valor numérico foi explicitamente aceito. Pacotes totalmente vazios continuam recusados. As rubricas permanecem preliminares, sem classificação ou conciliação automática, e não devem alimentar projeções antes de validação.

Teste Node: quatro casos aprovados em cópia local do protocolo (somente rubricas, pacote vazio, confirmação e regressão de valores aceitos). Arquivo de regressão `test-rascunhos-sem-candidatos.mjs` incluído na branch. Execução diretamente sobre o checkout do repositório e teste ponta a ponta no navegador pendentes.

Bloqueios: validar o formato real das rubricas geradas pelo leitor PDF/XLSX/CSV e a reconciliação contábil antes de utilizá-las em cálculos; validar preview da Vercel. Próxima ação: testar o fluxo completo entre abas com documentos sintéticos e conferir se rubricas sem valores aceitos chegam à revisão de exceções materiais. Sem merge na main, sem publicação em produção.


## Regressão do protocolo de rubricas sem candidatos (03/11/2026)

Entrega única e restrita a `mvp-confirmacao-transferencia.test.mjs`: a expectativa de erro do teste antigo foi alinhada à mensagem atual `Não há valores ou rubricas para transferir`, e foi acrescentado teste para envio e confirmação de rubricas preliminares quando não há candidatos numéricos. Nenhuma regra tributária, fórmula, interface, permissão ou dado pessoal foi modificado.

Commit do teste: `0fe80cbb85e87d1ddd70439d916897e83cb7a119`.
Verificação: `node --test` executado em reprodução local isolada do protocolo com dois casos equivalentes, **2 aprovados, 0 falhas**. A cópia foi transcrita para o teste isolado, não obtida diretamente do checkout; portanto **não comprova** execução do arquivo completo da branch nem da suíte integral. O teste acrescentado foi registrado no GitHub, mas sua execução nativa na branch ainda precisa ser comprovada.

Bloqueios: sem acesso de rede ao checkout GitHub neste ambiente; consulta do preview Vercel não retornou confirmação verificável. Não há URL de preview homologada. Persistem integração documental, conciliação contábil, revisão de exceções materiais e QA móvel.

Próxima ação: executar `node --test motor-rt-credito-360/mvp-confirmacao-transferencia.test.mjs` em checkout íntegro, corrigir eventuais falhas e validar fluxo de duas abas com dados sintéticos. Nenhum merge na `main` nem alteração de produção.


## 03/11/2026: confirmação informa valores e rubricas separadamente

Entrega pequena: mensagem de confirmação do importador agora discrimina quantidade de valores aceitos e quantidade de rubricas preliminares recebidas, evitando mensagem enganosa de `0 valor(es) recebido(s)` em transferências compostas somente de rubricas. A confirmação segue correlacionada ao envio e não representa classificação, conciliação ou aplicação de rubricas. Testes do protocolo atualizados para a nova mensagem e incluído caso misto (um valor e duas rubricas).

Commits: código `625d6077df91a0b560c03315e4da02ce0d8c5f47`; testes `49224bbb2c0ee82fee1f4937089817418a7feb57`.

Testes: `node --test /tmp/rt360-confirmacao-check.mjs` em reprodução local mínima da formatação e correlação, 3 aprovados, 0 falhas. Não foi possível executar o arquivo original da branch: `git ls-remote` falhou por DNS (`Could not resolve host: github.com`). Portanto não declarar suíte nativa aprovada. Preview Vercel não validado: a ação `open_deployments` retornou `Tool open_deployments not found`; não divulgar URL como verificada.

Bloqueios: testes Node diretamente na branch, teste ponta a ponta de importação entre abas e conciliação das rubricas ainda pendentes. Próxima ação: executar o teste original no checkout íntegro, validar confirmação de pacote com apenas rubricas no navegador e conferir comportamento móvel. Sem merge na main, publicação intencional em produção, gastos ou dados pessoais.
