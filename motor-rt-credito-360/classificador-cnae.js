/**
 * Triagem CNAE para o Motor RT Crédito 360.
 * O CNAE orienta perguntas e riscos, mas NÃO determina sozinho o tratamento legal.
 * Nenhuma alíquota, crédito ou benefício fiscal é presumido.
 */
const perfis = [
 {prefixos:["7711"],setor:"locacao_veiculos",perguntas:["percentualReceitaLocacao","percentualReceitaVendaUsados","frotaCapexAnual","cicloRenovacaoFrota","creditosAquisicaoVeiculos"],riscos:["segregar_locacao_e_alienacao","creditos_recorrentes_capex","cronograma_ressarcimento"]},
 {prefixos:["41","42","43"],setor:"construcao_civil",perguntas:["tiposContratos","receitasPorEmpreendimento","materiaisESubcontratacoes","regimeOperacoesImobiliarias"],riscos:["regimes_especificos_por_operacao","contratos_longo_prazo"]},
 {prefixos:["86"],setor:"saude",perguntas:["naturezaServicos","composicaoReceitas","operacoesElegiveisTratamentoEspecifico"],riscos:["classificacao_servicos","tratamento_legal_condicionado"]},
 {prefixos:["49","50","51","52"],setor:"transporte_logistica",perguntas:["modalidadesTransporte","combustiveis","frotaCapexAnual","perfilClientes"],riscos:["creditos_insumos","renovacao_frota"]},
 {prefixos:["10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33"],setor:"industria",perguntas:["insumosCreditaveis","exportacoes","capexAnual","estoques","perfilClientes"],riscos:["cadeia_creditos","exportacoes","estoques"]},
 {prefixos:["45","46","47"],setor:"comercio",perguntas:["mixProdutos","perfilClientes","estoques","fornecedores","vendasInterestaduais"],riscos:["classificacao_produtos","estoques","repasse_precos"]}
];
const padrao={setor:"geral",perguntas:["segmentosReceita","perfilClientes","insumosCreditaveis","capexAnual"],riscos:["validar_tratamento_por_operacao"]};
export function classificarEmpresa({cnaePrincipal,cnaesSecundarios=[],regimeTributario=null,segmentosReceita=[]}){
 const normalizar = (c) => {
   const s=String(c??"").replace(/\D/g,"");
   if(s.length!==7) throw new Error("CNAE deve conter 7 dígitos");
   return s;
 };
 const principal=normalizar(cnaePrincipal);
 if(!Array.isArray(cnaesSecundarios)||!Array.isArray(segmentosReceita))throw new Error("Listas inválidas");
 const secundarios=[...new Set(cnaesSecundarios.map(normalizar))].filter(c=>c!==principal);
 const obter = c => perfis.find(p=>p.prefixos.some(prefix=>c.startsWith(prefix)))??padrao;
 const atividades=[principal,...secundarios].map((cnae,i)=>({cnae,principal:i===0,setor:obter(cnae).setor}));
 const setores=[...new Set(atividades.map(a=>a.setor))];
 const perguntas=[...new Set(atividades.flatMap(a=>obter(a.cnae).perguntas))];
 const riscos=[...new Set(atividades.flatMap(a=>obter(a.cnae).riscos))];
 const pendencias=["validar_CNAE_em_cadastro_oficial","validar_regime_tributario","validar_operacoes_e_documentos_fiscais","validar_legislacao_vigente_e_ano","informar_aliquotas_e_creditos_por_operacao"];
 if(atividades.length>1)pendencias.push("alocar_receitas_e_custos_por_atividade");
 if(segmentosReceita.length===0)pendencias.push("informar_composicao_receitas");
 return {versao:"triagem-cnae-0.1",cnaePrincipal:principal,cnaesSecundarios:secundarios,
  regimeTributario,atividades,setores,perguntas,riscos,pendencias,
  parametrosTributarios:{aliquotas:null,regrasCredito:null,fonteLegal:null,status:"pendente_validacao"},
  aptoParaCalculoTributarioAutomatico:false};
}
