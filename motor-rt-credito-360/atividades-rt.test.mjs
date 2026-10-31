import test from "node:test";
import assert from "node:assert/strict";
import {projetarAtividadesRT} from "./atividades-rt.js";
const dados={anoBase:2026,anos:2,atividades:[
 {id:"locacao",descricao:"Locação de veículos",receitaBase:800,crescimento:0,aliquotasValidadas:{2027:.1,2028:.1}},
 {id:"usados",descricao:"Venda de usados",receitaBase:200,crescimento:0,aliquotasValidadas:{2027:.2,2028:.2}}
],eventosCredito:[
 {atividadeId:"locacao",ano:2027,valor:100,fundamento:"Hipótese documental simulada",validadoPorAnalista:true},
 {atividadeId:"locacao",ano:2028,valor:50,fundamento:"Hipótese documental simulada",validadoPorAnalista:true}
]};
test("separa receitas e transporta créditos entre anos",()=>{
 const r=projetarAtividadesRT(dados);
 assert.equal(r.projecoes[0].receitaTotal,1000);
 assert.equal(r.projecoes[0].debito,120);
 assert.equal(r.projecoes[0].tributoPagar,20);
 assert.equal(r.projecoes[1].tributoPagar,70);
 assert.equal(r.projecoes[0].atividades.length,2);
});
test("rejeita créditos não validados",()=>{
 assert.throws(()=>projetarAtividadesRT({...dados,eventosCredito:[
 {...dados.eventosCredito[0],validadoPorAnalista:false}]}));
});
test("rejeita alíquota ausente",()=>{
 assert.throws(()=>projetarAtividadesRT({...dados,atividades:[
 {...dados.atividades[0],aliquotasValidadas:{}},dados.atividades[1]]}));
});
