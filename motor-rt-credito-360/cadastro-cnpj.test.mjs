import test from "node:test";
import assert from "node:assert/strict";
import {validarCNPJ,consultarCNPJ,consultarDescricaoCNAE,prepararPerfilEmpresa} from "./cadastro-cnpj.js";
test("valida CNPJ e rejeita dígitos inválidos",()=>{
 assert.equal(validarCNPJ("11.222.333/0001-81"),true);
 assert.equal(validarCNPJ("11.222.333/0001-82"),false);
});
test("busca CNPJ, normaliza atividades e exige confirmação",async()=>{
 const cadastro=await consultarCNPJ("11.222.333/0001-81",{fetcher:async()=>({ok:true,json:async()=>({
 cnpj:"11222333000181",razao_social:"EMPRESA EXEMPLO",cnae_fiscal:7711000,
 cnaes_secundarios:[{codigo:4511102,descricao:"Comércio de veículos"}]})})});
 const perfil=prepararPerfilEmpresa(cadastro);
 assert.equal(perfil.classificacao.setores.includes("locacao_veiculos"),true);
 assert.equal(perfil.autorizadoParaProjecao,false);
 assert.equal(perfil.cadastro.cnaesSecundarios[0],"4511102");
});
test("consulta CNAE oficial via adaptador",async()=>{
 const r=await consultarDescricaoCNAE("7711-0/00",{fetcher:async()=>({ok:true,json:async()=>({id:"7711000",descricao:"Locação de automóveis sem condutor"})})});
 assert.equal(r.confirmado,true);
});
