import {classificarEmpresa} from "./classificador-cnae.js";
import test from "node:test";
import assert from "node:assert/strict";
test("locadora com atividade secundária identifica dois perfis e solicita segmentação",()=>{
 const x=classificarEmpresa({cnaePrincipal:"7711-0/00",cnaesSecundarios:["4511-1/01"]});
 assert.ok(x.setores.includes("locacao_veiculos"));
 assert.ok(x.setores.includes("comercio"));
 assert.ok(x.perguntas.includes("percentualReceitaVendaUsados"));
 assert.ok(x.pendencias.includes("alocar_receitas_e_custos_por_atividade"));
 assert.equal(x.aptoParaCalculoTributarioAutomatico,false);
});
test("CNAE inválido é recusado",()=>assert.throws(()=>classificarEmpresa({cnaePrincipal:"123"})));
test("CNAE desconhecido mantém análise conservadora",()=>{
 const x=classificarEmpresa({cnaePrincipal:"9900000"});
 assert.deepEqual(x.setores,["geral"]);
 assert.equal(x.parametrosTributarios.aliquotas,null);
});
