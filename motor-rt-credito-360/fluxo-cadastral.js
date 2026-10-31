import {consultarCNPJ,consultarDescricaoCNAE,prepararPerfilEmpresa} from "./cadastro-cnpj.js";
import {diagnosticarEnquadramento} from "./diagnostico-enquadramento.js";

/** Fluxo de cadastro, revisão e liberação. Sem persistência de CNPJ no cliente. */
export async function iniciarCadastro(cnpj,{fetcher=fetch}={}) {
 const cadastro=await consultarCNPJ(cnpj,{fetcher});
 let cnaeOficial=null,alertas=[];
 try {
  cnaeOficial=await consultarDescricaoCNAE(cadastro.cnaePrincipal,{fetcher});
 } catch(e) {
  alertas.push("CNAE não conferido no IBGE; revisão manual obrigatória");
 }
 return {...prepararPerfilEmpresa(cadastro,{descricaoCNAEOficial:cnaeOficial}),alertas};
}
/** Somente libera a análise quando todas as confirmações e validações existem. */
export function confirmarPerfil(perfil,{confirmacoes,regimeTributario,segmentosReceita}={}) {
 if(!perfil?.cadastro?.cnaePrincipal)throw new Error("Cadastro não carregado");
 const flags={cadastro:false,atividades:false,regime:false,premissas:false,...confirmacoes};
 const diagnostico=diagnosticarEnquadramento({
  cnaePrincipal:perfil.cadastro.cnaePrincipal,
  cnaesSecundarios:perfil.cadastro.cnaesSecundarios,
  regimeTributario,segmentosReceita
 });
 const falhas=[...diagnostico.falhas];
 for(const campo of ["cadastro","atividades","regime","premissas"])
  if(flags[campo]!==true)falhas.push("Confirmação pendente: "+campo);
 if(!perfil.descricaoCNAEOficial?.confirmado)
  falhas.push("Descrição CNAE oficial não conferida");
 return {...perfil,confirmacoes:flags,regimeTributario,segmentosReceita,
  diagnostico,pendencias:falhas,autorizadoParaProjecao:falhas.length===0,
  status:falhas.length?"revisao_pendente":"pronto_para_projecao_preliminar"};
}
