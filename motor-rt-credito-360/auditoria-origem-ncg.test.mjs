import test from "node:test";
import assert from "node:assert/strict";
import {auditarOrigemNCG} from "./auditoria-origem-ncg.js";

const origem = (valor, linhaOrigem) => ({
  valor, linhaOrigem, demonstracao: "balanco_patrimonial", documentoId: "balanco-sintetico"
});
const entrada = {
  exercicioBase: 2026, exercicioProjetado: 2027,
  saldosBase: {clientes: origem(120, 1), estoques: origem(90, 2),
    fornecedoresOperacionais: origem(100, 3)},
  saldosProjetados: {clientes: origem(140, 1), estoques: origem(95, 2),
    fornecedoresOperacionais: origem(115, 3)},
  variacaoInformada: 10, validadoPorAnalista: true,
  evidenciaRevisao: "Conferência sintética do analista"
};

test("concilia NCG operacional com dois balanços e origem documental", () => {
  const r = auditarOrigemNCG(entrada);
  assert.equal(r.base.ncg, 110);
  assert.equal(r.projetado.ncg, 120);
  assert.equal(r.variacaoCalculada, 10);
  assert.equal(r.diferenca, 0);
  assert.equal(r.status, "conciliado_revisado");
  assert.equal(r.aptoParaParecer, false);
});

test("reconhece liberação de NCG como variação negativa", () => {
  const r = auditarOrigemNCG({...entrada, saldosProjetados: {
    ...entrada.saldosProjetados, clientes: origem(100, 1)
  }, variacaoInformada: -30});
  assert.equal(r.variacaoCalculada, -30);
  assert.equal(r.conciliado, true);
});

test("divergência entre NCG calculada e informada exige revisão", () => {
  const r = auditarOrigemNCG({...entrada, variacaoInformada: 11});
  assert.equal(r.conciliado, false);
  assert.equal(r.diferenca, -1);
  assert.match(r.pendencias.join(" "), /diverge/);
});

test("ausência de evidência ou de revisão bloqueia conciliação revisada", () => {
  const r = auditarOrigemNCG({...entrada, validadoPorAnalista: false,
    evidenciaRevisao: ""});
  assert.equal(r.conciliado, true);
  assert.equal(r.status, "pendente_revisao");
});

test("saldo sem origem documental não é aceito como NCG conciliada", () => {
  const r = auditarOrigemNCG({...entrada, saldosBase: {
    ...entrada.saldosBase, estoques: {valor: 90}
  }});
  assert.equal(r.base, null);
  assert.equal(r.variacaoCalculada, null);
  assert.equal(r.conciliado, false);
  assert.match(r.pendencias.join(" "), /estoques/);
});

test("não aceita períodos não consecutivos nem entradas não finitas", () => {
  assert.throws(() => auditarOrigemNCG({...entrada, exercicioProjetado: 2028}), /inválidos/);
  assert.throws(() => auditarOrigemNCG({...entrada, variacaoInformada: NaN}), /inválidos/);
});

test("não permite tolerância documental acima de um centavo", () => {
  assert.throws(() => auditarOrigemNCG({...entrada, variacaoInformada: 11,
    tolerancia: 1000000}), /tolerância inválidos/);
  assert.equal(auditarOrigemNCG({...entrada, tolerancia: 0}).status,
    "conciliado_revisado");
  assert.equal(auditarOrigemNCG({...entrada, tolerancia: 0.01}).status,
    "conciliado_revisado");
});
