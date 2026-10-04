module.exports = async function handler(req,res){
  const raw=String(req.query?.cnpj||'').replace(/\D/g,'');
  if(raw.length!==14)return res.status(400).json({error:'CNPJ deve ter 14 dígitos.'});

  try{
    const response=await fetch('https://brasilapi.com.br/api/cnpj/v1/'+raw,{
      headers:{Accept:'application/json','User-Agent':'Empresa360-HomoFictor/1.0'}
    });
    const text=await response.text();
    let source={};
    try{source=JSON.parse(text)}catch(_){source={message:text}}
    if(!response.ok)return res.status(response.status).json({error:source.message||'Não foi possível consultar o CNPJ.'});

    const regimes=Array.isArray(source.regime_tributario)?source.regime_tributario:[];
    const latestRegime=regimes
      .filter(x=>x&&x.ano&&x.forma_de_tributacao)
      .sort((a,b)=>Number(b.ano)-Number(a.ano))[0]||null;

    const data={
      cnpj:source.cnpj||raw,
      razao_social:source.razao_social||null,
      nome_fantasia:source.nome_fantasia||null,
      descricao_situacao_cadastral:source.descricao_situacao_cadastral||null,
      data_inicio_atividade:source.data_inicio_atividade||null,
      descricao_identificador_matriz_filial:source.descricao_identificador_matriz_filial||null,
      porte:source.porte||null,
      natureza_juridica:source.natureza_juridica||null,
      cnae_fiscal:source.cnae_fiscal||null,
      cnae_fiscal_descricao:source.cnae_fiscal_descricao||null,
      cnaes_secundarios_count:Array.isArray(source.cnaes_secundarios)?source.cnaes_secundarios.length:null,
      municipio:source.municipio||null,
      uf:source.uf||null,
      opcao_pelo_simples:source.opcao_pelo_simples,
      opcao_pelo_mei:source.opcao_pelo_mei,
      capital_social:source.capital_social??null,
      regime_tributario_recente:latestRegime?{
        ano:Number(latestRegime.ano),
        forma_de_tributacao:latestRegime.forma_de_tributacao
      }:null
    };

    res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json({provider:'BrasilAPI / Minha Receita',data});
  }catch(_){
    return res.status(502).json({error:'Falha temporária ao consultar a base pública.'});
  }
}