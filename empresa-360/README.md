# Empresa 360 IA

Ambiente de desenvolvimento criado a partir do commit de produção do site O Brasil Muda de Imposto.

## Regra de segurança

O branch `empresa-360-mirror` é separado do `main`. O simulador publicado não deve ser alterado durante esta fase.

O módulo Reforma 360 usa, por enquanto, o simulador existente apenas como referência e espelho dentro da prévia da branch.

## MVP atual

- Tela inicial de CNPJ
- Validação de CNPJ no navegador
- Consulta via `/api/cnpj`
- Identificação cadastral da empresa
- Radar inicial de dimensões
- Link para o espelho do simulador
- Esquema PostgreSQL inicial em `db/001_initial_schema.sql`

## Próximas etapas

1. Perguntas complementares por perfil da empresa
2. Persistência em PostgreSQL
3. Autenticação e isolamento por organização
4. Reforma 360 integrada ao fluxo do Empresa 360
5. Upload de BP e DRE
6. Extração estruturada e conferência dos valores
7. Motor dos dez diagnósticos iniciais
8. Priorização por impacto, confiança e urgência
9. Relatório Empresa 360

## Princípio do motor

Dados -> Normalização -> Indicadores -> Regras -> Diagnósticos -> Priorização -> IA explica

A IA não deve modificar valores calculados pelo motor de regras.
