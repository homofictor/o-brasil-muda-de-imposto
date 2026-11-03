import {classificarEmpresa} from "./classificador-cnae.js";
const digitos = v => String(v??"").replace(/\D/g,"");
export function validarCNPJ(valor) {
 const s=digitos(valor);
 if(s.length!==14 || /^(\d)\1{13}$/.test(s)) return false;
 const dv=(base,pesos)=>{const soma=[...base].reduce((a,c,i)=>a+Number(c)*pesos[i],0);const resto=soma%11;return resto<2?0:11-resto;};
 return dv(s.slice(0,12),[5,4,3,2,9,8,7,6,5,4,3,2])===Number(s[12]) &&
 dv(s.slice(0,13),[6,5,4,3,2,9,8,7,6,5,4,3,2])===Number(s[13]);
}
const codigoCnae = v => {
 const s=digitos(v);
 if(s.length!==7)throw new Error("CNAE inválido na fonte cadastral");
 return s;
};
/** Adaptador para API pública BrasilAPI. Não assume que o regime tributário foi validado. */
export function adaptarBrasilAPI(dados) {
 if(!dados || !validarCNPJ(dados.cnpj))throw new Error("Cadastro retornou CNPJ inválido");
 const principal=codigoCnae(dados.cnae_fiscal);
 const secundarios=(dados.cnaes_secundarios??[]).map(x=>codigoCnae(x.codigo));
 return {cnpj:digitos(dados.cnpj),razaoSocial:dados.razao_social??null,
  nomeFantasia:dados.nome_fantasia??null,situacaoCadastral:dados.descricao_situacao_cadastral??null,
  cnaePrincipal:principal,cnaesSecundarios:[...new Set(secundarios)].filter(x=>x!==principal),
  descricaoPrincipal:dados.cnae_fiscal_descricao??null,
  atividadesSecundarias:(dados.cnaes_secundarios??[]).map(x=>({codigo:codigoCnae(x.codigo),descricao:x.descricao??null})),
  regimeTributario:null,fonte:"BrasilAPI / CNPJ",consultadoEm:null};
}
/** O fetch é injetado para testes. Consultar via backend em produção, com cache e limites. */
export async function consultarCNPJ(cnpj,{fetcher=fetch,timeoutMs=8000}={}) {
 if(!validarCNPJ(cnpj))throw new Error("CNPJ inválido");
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),timeoutMs);
 try {
  const response=await fetcher("https://brasilapi.com.br/api/cnpj/v1/"+digitos(cnpj),{signal:controller.signal});
  if(!response.ok)throw new Error("Consulta CNPJ indisponível (HTTP "+response.status+")");
  const cadastro=adaptarBrasilAPI(await response.json());
  return {...cadastro,consultadoEm:new Date().toISOString()};
 } finally {clearTimeout(timeout);}
}
/** CNAE oficial: IBGE Concla, serviço de classificação CNAE 2.0 subclasses.
 * Endereço da API deve ser configurado e validado no backend antes de uso em produção.
 */
export async function consultarDescricaoCNAE(cnae,{fetcher=fetch,baseURL="https://servicodados.ibge.gov.br/api/v2/cnae/subclasses"}={}) {
 const codigo=codigoCnae(cnae);
 const response=await fetcher(baseURL+"/"+codigo);
 if(!response.ok)throw new Error("Consulta IBGE CNAE indisponível");
 const json=await response.json();
 if(!json || !json.id)throw new Error("Resposta CNAE inválida");
 return {codigo,descricao:json.descricao??null,fonte:"IBGE / CONCLA",confirmado:true};
}
export function prepararPerfilEmpresa(cadastro,{descricaoCNAEOficial=null}={}) {
 const classificacao=classificarEmpresa({cnaePrincipal:cadastro.cnaePrincipal,cnaesSecundarios:cadastro.cnaesSecundarios});
 return {cadastro, classificacao, descricaoCNAEOficial,
  confirmacoes:{cadastro:false,atividades:false,regime:false,premissas:false},
  pendencias:["Confirmar cadastro e atividades","Confirmar regime tributário","Informar receitas por operação","Validar tratamento tributário e premissas"],
  autorizadoParaProjecao:false};
}
