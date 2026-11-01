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
