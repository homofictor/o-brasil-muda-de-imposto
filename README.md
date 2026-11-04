## Motor RT Crédito 360 | execução 2026-11-04 11:56 BRT

Entrega única: integração da ponte temporal documentada ao orquestrador `motor-rt-credito-360/etapa2-conciliacao.cjs`, sem mudanças na interface. Para competências distintas, exige cobertura integral das contas do BP e do balancete e movimentos explícitos em centavos, sem inferência, sem comparação direta entre saldos de datas diferentes. Divergências, movimentos duplicados ou ausentes bloqueiam projeções. Para competências iguais, permanece o fluxo anterior de conciliação e materialidade. Commits: integração `e598781a2c3806185267b81cd74a28ef25e0f378`; testes `b4281de6c5131de7f7cff2ac6c0755afc3e3f9db`. Testes Node: seis casos adicionados, execução não confirmada porque checkout remoto indisponível por DNS (github.com); não alegar aprovação. Preview Vercel: consulta indisponível, URL não validada. Bloqueios: executar suíte no checkout, conectar movimentos efetivamente extraídos do importador PDF/XLSX/CSV, reconciliar DRE, exemplo fictício completo e QA móvel. Próxima ação: executar os testes no checkout da branch e conectar movimentações rastreáveis ao importador existente. Sem merge na main, alteração deliberada de produção, gastos ou dados pessoais. Sem homologação.

## Motor RT Crédito 360 | execução 2026-11-04 10:58 BRT

Entrega única: módulo `motor-rt-credito-360/ponte-temporal.cjs` para conciliar BP anual e balancete intermediário somente quando há saldos de abertura, movimentações documentadas e saldos finais em centavos. Não compara diretamente datas distintas nem infere movimentos. Rejeita datas inválidas, duplicidades, campos ausentes e overflow; informa divergências sem ajustes. Commits: módulo `0a0b98ee4a214b25f7d364b753c806d5dfede108`; teste `fb4112eca92586a8ac3e6836dbfef476d4b5d147`. Testes Node 22: 6/6 aprovados em ambiente local isolado com implementação equivalente; checkout integral ainda não testado. Bloqueios: módulo não conectado ao orquestrador da etapa 2; faltam movimentos contábeis padronizados provenientes do importador, integração PDF/XLSX/CSV, exemplo fictício integral, QA móvel e validação do preview. Próxima ação: integrar ponte temporal à etapa 2 apenas quando movimentos rastreáveis estiverem disponíveis. Sem merge na main, produção, gastos ou dados pessoais; sem homologação.

## Motor RT Crédito 360 | execução 2026-11-04 10:02 BRT

Entrega única: corrigida a expressão regular ISO em `motor-rt-credito-360/competencias.cjs`. O padrão anterior continha barras invertidas duplicadas dentro de literal regex e rejeitava inclusive datas válidas. Adicionado teste de regressão para 2026-06-30. Commits: correção `dc68efd400213d92f4198defe656ac2f8626e025`; teste `6a45e5f10f39c970e7d1b3396ff527e6c87cd422`. Node 22: 5/5 aprovados em reprodução local dos arquivos; execução no checkout integral não confirmada. Bloqueios: conciliação temporal de balancetes intermediários, integração do importador PDF/XLSX/CSV, relatório fictício integral, QA móvel e preview Vercel não verificado. Próxima ação: implementar ponte temporal documentada para BP anual e balancete intermediário, sem comparar saldos de datas distintas diretamente. Sem merge na main, alteração de produção, gastos ou dados pessoais. Sem homologação.

## Motor RT Crédito 360 | execução 2026-11-04 07:56 BRT

Entrega: validador de competências `motor-rt-credito-360/competencias.cjs` e teste `tests/motor-rt-competencias.test.cjs`. Exige datas ISO válidas e coincidentes para comparar saldos, sem presumir comparabilidade. Commits `4b8f238f05e4b38752c8cb800b67e1c08e130545` e `fee130120dd8478c924bd10245dd0fcc9f561d95`. Testes Node: 4/4 aprovados em cópia local; checkout integral não testado. Bloqueios: validador ainda não integrado à etapa 2, metadados de datas não conectados ao importador; PDF/XLSX, DRE, exemplo integral, mobile e preview Vercel pendentes. Próxima ação: integrar validação temporal ao orquestrador antes de projeções, com tratamento de balancetes intermediários. Sem merge, produção, gastos ou dados pessoais.

## Motor RT Crédito 360 | execução 2026-11-04 06:59 BRT

Entrega única: criado `motor-rt-credito-360/etapa2-conciliacao.cjs`, orquestrador interno que chama `conciliarSaldos` e, quando há política documentada, `classificarExcecoes`. Não modifica a interface, os dados de entrada ou os cálculos tributários. Divergências sem política bloqueiam projeção; contas ausentes e duplicadas não são automaticamente ajustadas. Se não houver divergências, a ausência de política não impede o prosseguimento. O campo `homologado` permanece falso.

Commits: módulo `96f682f19341b8372d6102031dc53c52d2dfa0de`; testes `12f0f9c976b241e7ec7f38ba88718bb61747e741`. Testes Node 22: 5/5 aprovados em diretório isolado, usando cópias fiéis dos dois módulos existentes. Execução no checkout integral ainda não confirmada.

Bloqueios: orquestrador ainda não ligado ao importador nem à interface da etapa 2; faltam mapeamento de rubricas, conciliação temporal BP/balancete, PDF/XLSX/CSV integrados, DRE, exemplo fictício completo, QA móvel e preview Vercel. A política institucional de materialidade não foi fornecida; o limite do teste é apenas dado sintético, não parâmetro do Motor.

Próxima ação: executar `node --test tests/motor-rt-etapa2-conciliacao.test.cjs` no checkout da branch e ligar a normalização do importador existente ao orquestrador, respeitando a comparabilidade das datas. Sem merge na main, produção, gastos ou dados pessoais.

## Motor RT Crédito 360 | execução 2026-11-04 06:02 BRT

Entrega única: módulo isolado `motor-rt-credito-360/excecoes-materiais.cjs` classifica divergências previamente detectadas pelo núcleo de conciliação. Exige política de materialidade explícita, em centavos, com fonte documentada; não cria percentual padrão. Conta ausente exige revisão mesmo com saldo zero. Divergências acima do limite exigem revisão; valores abaixo do limite continuam registrados, sem correção automática. O resultado informa `homologado: false`. Código `bc9468c7c38b8f100cf87f4b8146dea157b45538`, regressão `83b6d603bcce738e138292f2a913809715f76a58`.

Testes: cinco casos aprovados com `node --test` em diretório local isolado, com cópia fiel dos módulos, antes dos commits. O teste foi gravado em `tests/motor-rt-excecoes-materiais.test.cjs`; execução diretamente no checkout da branch não comprovada. Bloqueios: política de materialidade institucional não definida, módulo ainda não ligado à etapa 2, PDF/XLSX/CSV e relatório fictício integral não validados, QA móvel e preview Vercel não verificados. Não houve merge nem alteração deliberada de produção; sem dados pessoais ou gastos.

Próxima ação: executar `node --test tests/motor-rt-excecoes-materiais.test.cjs` diretamente no checkout e integrar a classificação de exceções ao fluxo interno da etapa 2, após normalização e conciliação de contas, sem criar quarta etapa.

## Motor RT Crédito 360 | execução 2026-11-04 05:02 BRT

Entrega única: criado o núcleo reutilizável `motor-rt-credito-360/reconciliacao.cjs` para comparar saldos já normalizados em centavos, sem arredondamentos ou ajustes automáticos, com sinalização de contas ausentes e duplicadas. Teste em `tests/motor-rt-conciliacao-nucleo.test.cjs`. Commits: código `ebce45df0abd4bf3210cc924b264513a67a52bdb`, testes `7937f754ca13c2eec7a9ae01f05e5d7906a38b75`.

Testes Node 22: quatro casos aprovados em execução local de código equivalente, antes do envio ao repositório. Execução diretamente no checkout GitHub ainda não confirmada. O núcleo NÃO está conectado ao fluxo da etapa 2, não define materialidade e exige mapeamento contábil consistente entre períodos antes de comparar. Bloqueios: integração com o importador PDF/XLSX/CSV, conciliação DRE e BP completa, exemplo fictício integral, mobile e validação funcional do preview.

Próxima ação: executar `node --test tests/motor-rt-conciliacao-nucleo.test.cjs` diretamente na branch e conectar a normalização de rubricas e centavos à etapa 2, mantendo revisão apenas de exceções materiais. Sem merge na main, alteração deliberada de produção, gastos ou dados pessoais.

## Motor RT Crédito 360 | execução 2026-11-04 04:01 BRT

Entrega única: criado `tests/motor-rt-bp-balancete-divergencias.test.cjs`, que usa a função `csvRows` do importador existente para comparar contas fictícias de BP e balancete em centavos inteiros. Abrange conciliação exata, divergência de R$ 0,01 sem ajuste automático, conta ausente sem presumir saldo zero e rejeição de conta duplicada. Commit do teste: `c10de9a1ac79e8d754ff5c13c789f6643af69b6b`.

Testes Node: quatro casos definidos, mas NÃO executados diretamente no checkout. Tentativa de `git ls-remote` falhou porque o terminal não resolveu github.com. Portanto, nenhum resultado de teste é declarado aprovado. Bloqueios: execução Node no checkout, integração efetiva ao Motor, conciliação material, PDF/XLSX, exemplo fictício completo, testes móveis e preview Vercel não verificado. A nova verificação é somente regressão, não motor de conciliação em produção.

Próxima ação: executar `node --test tests/motor-rt-bp-balancete-divergencias.test.cjs` na branch e integrar a sinalização de divergências ao processamento interno da etapa 2, sem introduzir limiar arbitrário de materialidade. Sem merge na main, sem alteração deliberada de produção ou dados pessoais.

## Motor RT Crédito 360 | execução 2026-11-04 02:56 BRT

Entrega única: teste `tests/motor-rt-conciliacao-csv-sintetica.test.cjs` com BP e DRE fictícios, lendo `csvRows` diretamente do importador compartilhado. Verifica identidade patrimonial, reconciliação do resultado operacional e detecção de divergência patrimonial de R$ 200, sem introduzir tolerância arbitrária. Commit: `5c6afa6ca6da6dbaf78992584b31b032c8460f5d`.

Testes Node: arquivo registrado na branch; execução no checkout não confirmada porque o terminal não resolve github.com (git ls-remote falhou por DNS). Não considerar a validação integrada aprovada. Bloqueios: ainda falta conectar essas verificações ao fluxo real de importação e ao mecanismo de exceções materiais, validar PDF/XLSX, exemplo completo, interface móvel e preview Vercel. Nenhum dado pessoal, alteração de interface, merge ou mudança deliberada de produção.

Próxima ação: executar `node --test tests/motor-rt-conciliacao-csv-sintetica.test.cjs` no checkout e integrar a reconciliação contábil ao processamento real antes de projeções.

## Motor RT Crédito 360 | execução 2026-11-04 02:02 BRT

Entrega única: criado `tests/import-csv-balancete-estrutura.test.cjs`, teste que extrai a função `csvRows` do importador compartilhado `simulador/v3/import.js` e verifica, com balancete inteiramente sintético, quatro colunas preservadas, saldos zero, células vazias, delimitador citado e rejeição de aspas não fechadas. Commit do teste: `5a574908bb2c44e16da324a9c3a8c095a323283b`.

Testes Node 22: 3/3 aprovados em reprodução local com a função copiada do arquivo consultado na branch. Não foi possível executar no checkout completo: falha de DNS de github.com no terminal. Bloqueios: integração PDF/XLSX/CSV com BP/DRE/balancete, conciliação material, exemplo fictício integral, mobile e validação funcional de preview. Nenhuma alteração de interface, premissas ou produção; sem merge na main.

Próxima ação: executar `node --test tests/import-csv-balancete-estrutura.test.cjs` no checkout completo e verificar conciliação de contas antes das projeções.

## Motor RT Crédito 360 | execução 2026-11-04 01:01 BRT

Entrega única: adicionado `tests/import-csv-celulas-vazias.test.cjs`, com três regressões sobre preservação de células vazias, descarte de linhas em branco e manutenção de saldos zero no leitor CSV existente do Simulador RT v3.2. Nenhuma alteração na interface, cálculos ou premissas.

Commit do teste: `8ac82fd`. Testes Node: 3/3 aprovados em reprodução local da função `csvRows` copiada do arquivo consultado na branch; execução no checkout integral não confirmada porque o terminal não resolve github.com por DNS. Bloqueios: testes integrados PDF/XLSX/CSV, conciliação BP/DRE/balancete, exemplo fictício integral, navegação móvel e preview Vercel não verificados. Sem merge, sem produção e sem dados pessoais.

Próxima ação: executar `node --test tests/import-csv-celulas-vazias.test.cjs` diretamente no checkout e integrar o resultado do importador à conciliação contábil antes de qualquer projeção.

## Motor RT Crédito 360 | execução 2026-11-03 23:56 BRT

Entrega única: teste `tests/import-csv-fonte-real.test.cjs` executa `csvRows` diretamente a partir do código-fonte de `simulador/v3/import.js` em contexto isolado Node, evitando duplicar a função dentro do teste. Abrange BOM UTF-8, delimitadores, aspas escapadas, campos multilinha e rejeição de aspas abertas.

Commit do teste: `2a3a8616`. Testes Node: quatro verificações aprovadas localmente com cópia exata da função consultada no repositório; execução do teste no checkout integral ainda não confirmada. Bloqueios: validação ponta a ponta de PDF/XLSX/CSV e conciliação BP/DRE/balancete; exemplo fictício integral e mobile; preview Vercel não verificado. Sem alterações na interface, premissas ou produção.

Próxima ação: executar `node --test tests/import-csv-fonte-real.test.cjs` diretamente na branch e integrar arquivos sintéticos à conciliação antes das projeções.

## Motor RT Crédito 360 | execução 2026-11-03 23:02 BRT

Entrega única: adicionado teste de regressão `tests/import-csv-variantes-delimitador.test.cjs` para CSV separado por vírgulas com descrição entre aspas e CSV com terminador CR isolado. Nenhuma lógica do Motor, interface ou premissa foi modificada.

Commit do teste: `930849ae`. Testes Node: duas verificações da função `csvRows` reproduzida isoladamente aprovadas com Node no ambiente local. Execução do novo arquivo diretamente no checkout integral pendente, pois o GitHub não resolveu via DNS no terminal. Bloqueios: integração PDF/XLSX/CSV e conciliação de BP, DRE e balancete ainda não demonstradas ponta a ponta; preview Vercel não verificado, sem link.

Próxima ação: executar `node tests/import-csv-variantes-delimitador.test.cjs` em checkout integral e avançar para importação e conciliação de demonstrações sintéticas completas.

## Motor RT Crédito 360 | execução 2026-11-03 21:58 BRT

Entrega única: acrescentado teste de regressão do leitor CSV compartilhado para descrições multilinha entre aspas, aspas escapadas, BOM UTF-8, CRLF e rejeição de aspas não fechadas. Nenhuma alteração de lógica, interface, projeções ou produção.

Commit do teste: `c8b492e`. Testes Node: cinco casos aprovados em reprodução local isolada da função `csvRows` com Node 22. O teste foi registrado em `tests/import-csv-multilinha.test.cjs`; a execução no checkout integral do repositório ainda precisa ser confirmada. Bloqueios: importação integrada de PDF/XLSX/CSV, conciliação BP/DRE/balancete, relatório fictício integral e navegação móvel ainda não validados. Preview Vercel requer confirmação funcional antes de divulgar link.

Próxima ação: executar `node tests/import-csv-multilinha.test.cjs` no checkout da branch e testar a passagem de CSV sintético pelo fluxo completo de importação e conciliação.

# o-brasil-muda-de-imposto
Reforma tributária Brasileira 
site oficial do livro O Brasil muda de imposto

## Motor RT Crédito 360 | execução 2026-11-03 20:58 BRT

Entrega única: o leitor CSV compartilhado (`simulador/v3/import.js`) rejeita campos com aspas não fechadas, evitando importação silenciosa de linhas contábeis corrompidas. A interface principal permanece com três etapas; nenhuma premissa financeira foi alterada.

Commits: código `34852f6b`, regressão `c87064c`. Testes: três verificações Node da regra reproduzida aprovadas localmente; teste de regressão adicionado em `tests/import-csv-aspas-incompletas.test.cjs`. Execução da suíte completa diretamente no checkout ainda pendente. Bloqueios: importação integrada de PDF/XLSX/CSV, conciliação BP/DRE/balancete e teste funcional móvel ainda não validados. Preview Vercel não confirmado funcionalmente, sem link divulgado.

Próxima ação: executar `node tests/import-csv-aspas-incompletas.test.cjs` no checkout e testar importação com demonstrações sintéticas completas, conciliando antes das projeções.
