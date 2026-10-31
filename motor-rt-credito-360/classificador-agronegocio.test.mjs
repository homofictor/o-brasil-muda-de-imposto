import test from "node:test";
import assert from "node:assert/strict";
import {classificarEmpresa} from "./classificador-cnae.js";

for (const [atividade, cnae] of [
  ["produção agropecuária", "0111301"],
  ["produção florestal", "0210101"],
  ["pesca e aquicultura", "0311601"]
]) {
  test(`triagem agronegócio: ${atividade} exige premissas, sem inferir tributos`, () => {
    const resultado = classificarEmpresa({cnaePrincipal: cnae});
    assert.ok(resultado.setores.includes("agronegocio"));
    assert.ok(resultado.perguntas.includes("sazonalidadeCaixa"));
    assert.ok(resultado.riscos.includes("sazonalidade_capital_giro"));
    assert.equal(resultado.parametrosTributarios.aliquotas, null);
    assert.equal(resultado.parametrosTributarios.regrasCredito, null);
    assert.equal(resultado.aptoParaCalculoTributarioAutomatico, false);
  });
}

test("empresa agroindustrial mantém separação por CNAE e exige alocação", () => {
  const resultado = classificarEmpresa({
    cnaePrincipal: "0111301", cnaesSecundarios: ["1011201"]
  });
  assert.deepEqual(resultado.setores, ["agronegocio", "industria"]);
  assert.ok(resultado.pendencias.includes("alocar_receitas_e_custos_por_atividade"));
  assert.equal(resultado.parametrosTributarios.fonteLegal, null);
});
