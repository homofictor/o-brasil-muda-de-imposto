import test from "node:test";
import assert from "node:assert/strict";
import {integrarCreditoComNCGAuditada} from "./integracao-ncg-auditada.js";

const origem = (valor, linhaOrigem) => ({valor, linhaOrigem,
  demonstracao: "balanco_patrimonial", documentoId: "balanco-sintetico"});
const auditoria = {
  exercicioBase: 2026, exercicioProjetado: 2027,
  saldosBase: {clientes: origem(120, 1), estoques: origem(90, 2),
    fornecedoresOperacionais: origem(100, 3)},
  saldosProjetados: {clientes: origem(140, 1), estoques: origem(95, 2),
    fornecedoresOperacionais: origem(115, 3)},
  evidenciaRevisao: "Conferência sintética", validadoPorAnalista: true
};
const dadosFinanceiros = {
  anoBase: 2026, anos: 1,
  historico: {exercicio: 2026, receitaLiquida: 100, ebitda: 30,
    revisadoPorAnalista: true},
  atividades: [{id: "comercio", receitaBase: 100, crescimento: 0,
    aliquotasValidadas: {ibs: {2027: 0.05}, cbs: {2027: 0.03}}}],
  aliquotaReferencia: 0.1,
  tratamentoTributario: {referenciaRefletida: false, reformaRefletida: false,
    evidenciaContabil: "DRE sintética pré-tributos", validadoPorAnalista: true},
  variacaoNCG: {2027: 10}, capex: {2027: 2}, juros: {2027: 4},
  amortizacoes: {2027: 6}
};
const executar = (dados = dadosFinanceiros, evidencias = {2027: auditoria}) =>
  integrarCreditoComNCGAuditada({dadosFinanceiros: dados, auditoriasNCG: evidencias});

test("NCG conciliada integra caixa e ICSD, mantendo IBS e CBS separados", () => {
  const r = executar(), p = r.projecoes[0];
  assert.equal(p.auditoriaNCG.status, "conciliado_revisado");
  assert.equal(p.auditoriaNCG.variacaoCalculada, 10);
  assert.equal(p.caixaAntesTributos, 18);
  assert.equal(p.caixaReferencia, 8);
  assert.equal(p.caixaReforma, 10);
  assert.equal(p.icsdReferencia, 0.8);
  assert.equal(p.icsdReforma, 1);
  assert.equal(p.ibs.tributoPagar, 5);
  assert.equal(p.cbs.tributoPagar, 3);
  assert.equal(r.aptoParaParecer, false);
});

test("liberação de NCG documentada aumenta caixa, sem alterar tributos", () => {
  const r = executar({...dadosFinanceiros, variacaoNCG: {2027: -30}},
    {2027: {...auditoria, saldosProjetados: {...auditoria.saldosProjetados,
      clientes: origem(100, 1)}}});
  const p = r.projecoes[0];
  assert.equal(p.auditoriaNCG.variacaoCalculada, -30);
  assert.equal(p.caixaAntesTributos, 58);
  assert.equal(p.caixaReforma, 50);
  assert.equal(p.ibs.tributoPagar, 5);
  assert.equal(p.cbs.tributoPagar, 3);
});

test("sem auditoria ou sem variação explícita bloqueia projeção", () => {
  assert.throws(() => executar(dadosFinanceiros, {}), /auditoria documental ausente/);
  assert.throws(() => executar({...dadosFinanceiros, variacaoNCG: {} }), /variação informada/);
});

test("divergência, revisão ausente ou origem documental inválida bloqueiam", () => {
  assert.throws(() => executar({...dadosFinanceiros, variacaoNCG: {2027: 11}}), /conciliação pendente/);
  assert.throws(() => executar(dadosFinanceiros, {2027: {...auditoria,
    validadoPorAnalista: false}}), /conciliação pendente/);
  assert.throws(() => executar(dadosFinanceiros, {2027: {...auditoria,
    saldosBase: {...auditoria.saldosBase, estoques: {valor: 90}}}}), /conciliação pendente/);
});

test("evidência de outro exercício não autoriza caixa e ICSD", () => {
  assert.throws(() => executar(dadosFinanceiros, {2027: {...auditoria,
    exercicioBase: 2025, exercicioProjetado: 2026}}), /não correspondem/);
});

test("o mesmo bloqueio documental vale para oito atividades distintas", () => {
  const setores = ["comercio", "industria", "servicos", "construcao",
    "saude", "transporte", "agronegocio", "multissetorial"];
  const atividades = setores.map(id => ({id, receitaBase: 12.5, crescimento: 0,
    aliquotasValidadas: {ibs: {2027: 0.05}, cbs: {2027: 0.03}}}));
  const r = executar({...dadosFinanceiros, atividades});
  assert.equal(r.projecoes[0].atividades.length, 8);
  assert.equal(r.projecoes[0].caixaReforma, 10);
  assert.equal(r.projecoes[0].auditoriaNCG.status, "conciliado_revisado");
});

test("não aceita segundo ano sem conciliação documental própria", () => {
  assert.throws(() => executar({...dadosFinanceiros, anos: 2},
    {2027: auditoria}), /NCG 2028/);
});

test("tolerância fornecida na evidência não pode liberar NCG divergente", () => {
  assert.throws(() => executar({...dadosFinanceiros, variacaoNCG: {2027: 50}},
    {2027: {...auditoria, tolerancia: 1000000}}), /conciliação pendente/);
});
