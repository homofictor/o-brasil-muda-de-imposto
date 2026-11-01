import test from "node:test";
import assert from "node:assert/strict";
import {auditarPonteTributaria} from "./auditoria-ponte-tributaria.js";
const base={receitaBase:1000,ebitdaBase:200,tributoReferencia:100,
 tributoReforma:150,evidenciaContabil:"Conciliação DRE validada",
 validadoPorAnalista:true};
test("não deduz tributos novamente quando EBITDA já os reflete",()=>{
 const r=auditarPonteTributaria({...base,
 impostoReferenciaJaRefletidoNoEbitda:true,
 impostoReformaJaRefletidoNoEbitda:true});
 assert.equal(r.ajusteTributarioCaixa,null);
 assert.equal(r.autorizadoParaProjecao,false);
 assert.match(r.alertas.join(" "),/ajuste de caixa não autorizado/);
});
test("permite diferença de caixa somente em EBITDA pré-tributos documentado",()=>{
 const r=auditarPonteTributaria({...base,
 impostoReferenciaJaRefletidoNoEbitda:false,
 impostoReformaJaRefletidoNoEbitda:false});
 assert.equal(r.ajusteTributarioCaixa,-50);
});
test("bloqueia bases incomparáveis e ausência de revisão",()=>{
 const r=auditarPonteTributaria({...base,validadoPorAnalista:false,
 impostoReferenciaJaRefletidoNoEbitda:true,
 impostoReformaJaRefletidoNoEbitda:false});
 assert.equal(r.autorizadoParaProjecao,false);
 assert.equal(r.ajusteTributarioCaixa,null);
});
test("exige flags explícitas",()=>{
 assert.throws(()=>auditarPonteTributaria(base));
});

test("revisão exige booleano verdadeiro, não valores truthy",()=>{
 for(const valor of ["true",1,{},[],"sim"]){
  const r=auditarPonteTributaria({...base,validadoPorAnalista:valor,
   impostoReferenciaJaRefletidoNoEbitda:false,
   impostoReformaJaRefletidoNoEbitda:false});
  assert.equal(r.autorizadoParaProjecao,false);
  assert.match(r.alertas.join(" "),/Revisão do analista pendente/);
 }
});

test("não disponibiliza ajuste de caixa sem revisão válida ou evidência documental",()=>{
 for(const alteracao of [{validadoPorAnalista:false},{validadoPorAnalista:"true"},
  {evidenciaContabil:"  "},{evidenciaContabil:{}},{evidenciaContabil:null}]){
  const r=auditarPonteTributaria({...base,...alteracao,
   impostoReferenciaJaRefletidoNoEbitda:false,
   impostoReformaJaRefletidoNoEbitda:false});
  assert.equal(r.ajusteTributarioCaixa,null);
  assert.equal(r.autorizadoParaProjecao,false);
  assert.ok(r.alertas.length>0);
 }
});
