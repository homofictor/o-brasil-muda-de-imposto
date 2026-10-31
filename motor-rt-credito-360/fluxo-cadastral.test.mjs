import test from "node:test";
import assert from "node:assert/strict";
import {iniciarCadastro,confirmarPerfil} from "./fluxo-cadastral.js";
const fetcher=async url=>({ok:true,json:async()=>url.includes("brasilapi")?
 {cnpj:"11222333000181",razao_social:"LOCADORA TESTE",cnae_fiscal:7711000,cnaes_secundarios:[]}:
 {id:"7711000",descricao:"Locação de automóveis sem condutor"}});
const segmentos=[{id:"a",descricao:"Locação",tipoOperacao:"locacao",participacaoReceita:.8,
 tratamentoValidado:true,fonteLegal:"Documento a conferir",aliquotasPorAno:{2027:.1},creditosPorAno:{2027:0}},
 {id:"b",descricao:"Venda de usados",tipoOperacao:"venda_usados",participacaoReceita:.2,
 tratamentoValidado:true,fonteLegal:"Documento a conferir",aliquotasPorAno:{2027:.1},creditosPorAno:{2027:0}}];
test("cadastro começa bloqueado e libera somente após confirmações",async()=>{
 const perfil=await iniciarCadastro("11.222.333/0001-81",{fetcher});
 assert.equal(perfil.autorizadoParaProjecao,false);
 const semAceite=confirmarPerfil(perfil,{regimeTributario:"lucro_real",segmentosReceita:segmentos});
 assert.equal(semAceite.autorizadoParaProjecao,false);
 const comAceite=confirmarPerfil(perfil,{confirmacoes:{cadastro:true,atividades:true,regime:true,premissas:true},
 regimeTributario:"lucro_real",segmentosReceita:segmentos});
 assert.equal(comAceite.autorizadoParaProjecao,true);
});
test("não libera quando consulta oficial CNAE falha",async()=>{
 const perfil=await iniciarCadastro("11222333000181",{fetcher:async url=>url.includes("brasilapi")?fetcher(url):{ok:false}});
 const r=confirmarPerfil(perfil,{confirmacoes:{cadastro:true,atividades:true,regime:true,premissas:true},
 regimeTributario:"lucro_real",segmentosReceita:segmentos});
 assert.equal(r.autorizadoParaProjecao,false);
});
