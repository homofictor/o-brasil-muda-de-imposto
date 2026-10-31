/**
 * Conciliação contábil por mapeamento explícito e rastreável.
 * Não classifica contas automaticamente por semelhança de nomes.
 * Valores devem estar na mesma unidade e período, aprovados pelo analista.
 */
const CONTAS=new Set(["ativo_total","passivo_exigivel","patrimonio_liquido","receita_liquida",
 "custos","despesas_operacionais","depreciacao_amortizacao","resultado_operacional",
 "lucro_liquido","caixa_operacional","capex","variacao_capital_giro"]);
export function mapearContas(registros,mapeamento){
 if(!Array.isArray(registros)||!Array.isArray(mapeamento))throw new Error("Entrada inválida");
 const erros=[],usadas=new Set(),normalizadas=[];
 for(const [i,m] of mapeamento.entries()){
  if(!CONTAS.has(m.contaPadrao)){erros.push("Mapeamento "+(i+1)+": conta padrão inválida");continue;}
  if(!Number.isInteger(m.indiceOrigem)||m.indiceOrigem<0||m.indiceOrigem>=registros.length){
   erros.push("Mapeamento "+(i+1)+": índice de origem inválido");continue;
  }
  if(usadas.has(m.indiceOrigem)){erros.push("Linha de origem mapeada mais de uma vez");continue;}
  usadas.add(m.indiceOrigem);
  const r=registros[m.indiceOrigem];
  if(!Number.isFinite(r.valor)||!Number.isFinite(m.fator)||m.fator===0){
   erros.push("Mapeamento "+(i+1)+": valor ou fator inválido");continue;
  }
  normalizadas.push({contaPadrao:m.contaPadrao,valor:r.valor*m.fator,
   exercicio:r.exercicio,demonstracao:r.demonstracao,
   contaOriginal:r.conta,linhaOrigem:r.linhaOrigem,
   justificativa:m.justificativa??null});
 }
 return {normalizadas,erros,naoMapeadas:registros.map((r,i)=>i).filter(i=>!usadas.has(i)),
  status:"pendente_revisao",aptoParaProjecao:false};
}
export function conciliarExercicio(contas,{tolerancia=0.01}={}){
 if(!Array.isArray(contas)||!Number.isFinite(tolerancia)||tolerancia<0)throw new Error("Parâmetros inválidos");
 const anos=[...new Set(contas.map(c=>c.exercicio))];
 if(anos.length!==1)throw new Error("Conciliação exige um único exercício");
 const total=nome=>contas.filter(c=>c.contaPadrao===nome).reduce((s,c)=>s+c.valor,0);
 const presentes=nome=>contas.some(c=>c.contaPadrao===nome);
 const faltantes=["ativo_total","passivo_exigivel","patrimonio_liquido"].filter(x=>!presentes(x));
 const diferenca=faltantes.length?null:total("ativo_total")-total("passivo_exigivel")-total("patrimonio_liquido");
 return {exercicio:anos[0]??null,diferenca,faltantes,
  conciliado:!faltantes.length&&Math.abs(diferenca)<=tolerancia,
  status:"aguardando_revisao",aptoParaProjecao:false};
}
