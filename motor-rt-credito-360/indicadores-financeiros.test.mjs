import test from "node:test";
import assert from "node:assert/strict";
import {calcularIndicadoresFinanceiros,calcularSerieFinanceira} from "./indicadores-financeiros.js";
test("calcula indicadores sem inventar campos",()=>{
 const r=calcularIndicadoresFinanceiros({exercicio:2025,ativoCirculante:300,passivoCirculante:100,
 ativoTotal:500,patrimonioLiquido:200,receitaLiquida:1000,lucroLiquido:100,
 ebitda:200,dividaBruta:150,caixaEquivalentes:50,despesasFinanceiras:40,
 caixaOperacional:160,capex:80,fluxoCaixaDisponivelServicoDivida:120,servicoDivida:60});
 assert.equal(r.liquidezCorrente,3);
 assert.equal(r.margemEbitda,.2);
 assert.equal(r.icsd,2);
 assert.equal(r.dividaLiquidaEbitda,.5);
});
test("não calcula EBITDA nem ICSD sem dados",()=>{
 const r=calcularIndicadoresFinanceiros({exercicio:2025,receitaLiquida:100});
 assert.equal(r.margemEbitda,null);
 assert.equal(r.icsd,null);
});
test("sinaliza lacunas históricas",()=>{
 const r=calcularSerieFinanceira([{exercicio:2023},{exercicio:2025}]);
 assert.equal(r.alertas.length,2);
});

test("não propaga overflow de divisão ao ICSD e margem EBITDA",()=>{
 const r=calcularIndicadoresFinanceiros({exercicio:2026,
  receitaLiquida:1e-308,ebitda:1e308,
  fluxoCaixaDisponivelServicoDivida:1e308,servicoDivida:1e-308});
 assert.equal(r.margemEbitda,null);
 assert.equal(r.icsd,null);
 assert.ok(r.avisos.some(x=>x.includes("não finito")));
});
test("não propaga overflow de subtração em dívida líquida e fluxo de caixa livre",()=>{
 const r=calcularIndicadoresFinanceiros({exercicio:2026,
  dividaBruta:1e308,caixaEquivalentes:-1e308,
  caixaOperacional:1e308,capex:-1e308,
  ativoTotal:1e308,patrimonioLiquido:-1e308});
 assert.equal(r.dividaLiquida,null);
 assert.equal(r.fluxoCaixaLivre,null);
 assert.equal(r.endividamentoGeral,null);
 assert.ok(r.avisos.filter(x=>x.includes("não finito")).length>=3);
});
