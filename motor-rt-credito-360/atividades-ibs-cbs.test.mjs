import test from "node:test";
import assert from "node:assert/strict";
import {projetarAtividadesIBSCBS} from "./atividades-ibs-cbs.js";
const entrada={anoBase:2026,anos:2,atividades:[
 {id:"locacao",receitaBase:800,crescimento:0,aliquotasValidadas:{ibs:{2027:.1,2028:.1},cbs:{2027:.05,2028:.05}}},
 {id:"usados",receitaBase:200,crescimento:0,aliquotasValidadas:{ibs:{2027:.2,2028:.2},cbs:{2027:.1,2028:.1}}}
],eventosCredito:[
 {id:"frota-ibs-2027",atividadeId:"locacao",tributo:"ibs",ano:2027,valor:150,fundamento:"Premissa ilustrativa",validadoPorAnalista:true},
 {id:"frota-cbs-2028",atividadeId:"locacao",tributo:"cbs",ano:2028,valor:30,fundamento:"Premissa ilustrativa",validadoPorAnalista:true}
]};
test("mantém saldos segregados por tributo e ano",()=>{
 const r=projetarAtividadesIBSCBS(entrada);
 assert.equal(r.projecoes[0].receitaTotal,1000);
 assert.equal(r.projecoes[0].ibs.debito,120);
 assert.equal(r.projecoes[0].saldoCreditoIBS,30);
 assert.equal(r.projecoes[0].cbs.tributoPagar,60);
 assert.equal(r.projecoes[1].ibs.tributoPagar,90);
 assert.equal(r.projecoes[1].cbs.tributoPagar,30);
});
test("bloqueia crédito sem aprovação",()=>{
 assert.throws(()=>projetarAtividadesIBSCBS({...entrada,eventosCredito:[
 {...entrada.eventosCredito[0],validadoPorAnalista:false}]}));
});
test("exige alíquotas separadas",()=>{
 assert.throws(()=>projetarAtividadesIBSCBS({...entrada,atividades:[
 {...entrada.atividades[0],aliquotasValidadas:{ibs:{2027:.1,2028:.1}}},
 entrada.atividades[1]]}));
});
