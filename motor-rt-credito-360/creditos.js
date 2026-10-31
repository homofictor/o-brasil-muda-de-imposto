/**
 * Conta-corrente anual de créditos de IBS/CBS.
 * Modelo financeiro simplificado, NÃO é apuração fiscal homologada.
 * Ressarcimentos são informados como valores efetivamente recebidos.
 * Créditos expirados/estornados são ajustes informados e documentados.
 */
export function apurarCreditosAnuais({anoInicial, anos=5, saldoInicial=0, gerados={}, debitos={}, ressarcidos={}, ajustesNegativos={}}) {
  if (!Number.isInteger(anoInicial) || !Number.isInteger(anos) || anos<1 || anos>20)
    throw new Error("Período inválido");
  const valido = (v, nome) => {
    if (!Number.isFinite(v) || v<0) throw new Error("Valor inválido: "+nome);
    return v;
  };
  let saldo = valido(saldoInicial,"saldoInicial");
  const resultado=[];
  for(let i=0;i<anos;i++){
    const ano=anoInicial+i;
    const n=(obj,nome)=>valido(obj[ano]??0,nome+" "+ano);
    const gerado=n(gerados,"gerados");
    const debito=n(debitos,"debitos");
    const solicitado=n(ressarcidos,"ressarcidos");
    const ajuste=n(ajustesNegativos,"ajustesNegativos");
    const disponivel=saldo+gerado;
    const utilizado=Math.min(disponivel,debito);
    const remanescente=disponivel-utilizado;
    if(solicitado+ajuste>remanescente+1e-8)
      throw new Error("Ressarcimento e ajustes excedem créditos disponíveis em "+ano);
    const final=Math.max(0,remanescente-solicitado-ajuste);
    const tributoPagar=debito-utilizado;
    const conciliacao=saldo+gerado-utilizado-solicitado-ajuste-final;
    if(Math.abs(conciliacao)>1e-7) throw new Error("Falha de conciliação "+ano);
    resultado.push({ano,saldoInicial:saldo,gerado,debito,utilizado,tributoPagar,
      ressarcido:solicitado,ajusteNegativo:ajuste,saldoFinal:final,conciliacao});
    saldo=final;
  }
  return resultado;
}
