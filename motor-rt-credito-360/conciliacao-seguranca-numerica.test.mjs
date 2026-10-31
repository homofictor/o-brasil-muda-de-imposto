import test from "node:test";
import assert from "node:assert/strict";
import {mapearContas, conciliarExercicio} from "./conciliacao-contabil.js";

const balanco = (ativo, passivo, pl) => [
 {contaPadrao:"ativo_total", valor:ativo, exercicio:2027},
 {contaPadrao:"passivo_exigivel", valor:passivo, exercicio:2027},
 {contaPadrao:"patrimonio_liquido", valor:pl, exercicio:2027}
];

test("tolerância arbitrária não transforma balanço divergente em conciliado", () => {
 assert.throws(() => conciliarExercicio(balanco(101,60,40), {tolerancia:100}), /tolerância|Parâmetros inválidos/i);
 assert.equal(conciliarExercicio(balanco(100,60,40), {tolerancia:0}).conciliado, true);
});

test("mapeamento rejeita produto numérico infinito, preservando erro", () => {
 const r=mapearContas([{valor:1e308, exercicio:2027}],
  [{contaPadrao:"ativo_total", indiceOrigem:0, fator:10}]);
 assert.equal(r.normalizadas.length,0);
 assert.match(r.erros.join(" "), /valor|fator|finito/i);
});

test("conciliação rejeita valores não finitos recebidos diretamente", () => {
 assert.throws(() => conciliarExercicio(balanco(Infinity,60,40)), /finito|inválid/i);
 assert.throws(() => conciliarExercicio(balanco(NaN,60,40)), /finito|inválid/i);
});

test("conciliação rejeita overflow de soma mesmo com linhas finitas", () => {
 const contas=[
  {contaPadrao:"ativo_total",valor:1e308,exercicio:2027},
  {contaPadrao:"ativo_total",valor:1e308,exercicio:2027},
  {contaPadrao:"passivo_exigivel",valor:1e308,exercicio:2027},
  {contaPadrao:"patrimonio_liquido",valor:0,exercicio:2027}
 ];
 assert.throws(() => conciliarExercicio(contas), /finito|inválid/i);
});
