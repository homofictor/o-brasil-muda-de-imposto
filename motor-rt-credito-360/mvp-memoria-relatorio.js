import {conciliarExemploContabil} from './mvp-exemplo-contabil.js';

/** Memória estritamente fictícia e independente da projeção do economista. */
export function gerarMemoriaContabilSintetica() {
  const c = conciliarExemploContabil();
  if (c.status !== 'conciliacao_aritmetica_sintetica' ||
      ![c.balancete.debitos, c.balancete.creditos, c.bp.ativo, c.bp.passivo,
        c.bp.patrimonio, c.ncg.anterior, c.ncg.atual, c.ncg.variacao].every(Number.isFinite) ||
      Math.abs(c.balancete.diferenca) > 0.01 || Math.abs(c.bp.diferenca) > 0.01 ||
      Math.abs(c.ncg.atual - c.ncg.anterior - c.ncg.variacao) > 0.01)
    throw new Error('Memória contábil fictícia não conciliada');
  return {
    status: 'memoria_contabil_sintetica',
    periodo: c.periodo,
    indicadores: [
      {rotulo: 'Balancete, débitos', valor: c.balancete.debitos, nota: 'Créditos: ' + c.balancete.creditos + '; diferença: ' + c.balancete.diferenca},
      {rotulo: 'BP, ativo total', valor: c.bp.ativo, nota: 'Passivo: ' + c.bp.passivo + '; patrimônio líquido: ' + c.bp.patrimonio},
      {rotulo: 'DRE, receita líquida', valor: c.dre.receitaLiquida, nota: 'Custos: ' + c.dre.custos + '; despesas: ' + c.dre.despesas},
      {rotulo: 'EBITDA ilustrativo', valor: c.dre.ebitdaIlustrativo, nota: 'Sem depreciação e tributos na DRE fictícia'},
      {rotulo: 'Variação da NCG', valor: c.ncg.variacao, nota: 'Saldo anterior: ' + c.ncg.anterior + '; atual: ' + c.ncg.atual}
    ],
    ressalva: 'Conciliação exclusivamente aritmética e fictícia. A NCG e a DRE deste quadro não alimentam os três cenários da projeção do economista. Não há DFC, FCADS contratual, conciliação entre bases ou homologação tributária.'
  };
}
