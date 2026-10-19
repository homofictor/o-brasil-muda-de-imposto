/* Simples Decisão 360 | DAS 2027-2028
 * Resolução CGSN 140/2018, Anexos I-V, redação dada pela Resolução 190/2026.
 * Modelo do caso padrão, sem receitas segregadas, substituição tributária,
 * exportações, monofasia, retenções, atividades mistas ou sublimites.
 * Casos excepcionais devem usar valores conferidos do PGDAS-D.
 */
(function(root, factory){
  const api=factory();
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  if(root)root.SimplesDAS2027=api;
})(typeof window!=='undefined'?window:undefined,function(){
  'use strict';
  const LIMITES=[180000,360000,720000,1800000,3600000,4800000];
  const columns={
    I:['IRPJ','CSLL','CBS','CPP','ICMS','IBS'],
    II:['IRPJ','CSLL','CBS','CPP','IPI','ICMS','IBS'],
    III:['IRPJ','CSLL','CBS','CPP','ISS','IBS'],
    IV:['IRPJ','CSLL','CBS','ISS','IBS'],
    V:['IRPJ','CSLL','CBS','CPP','ISS','IBS']
  };
  const tabelas={
    I:{
      rates:[4,7.3,9.5,10.7,14.3,18.9],
      discounts:[0,5940,13860,22500,87300,378000],
      shares:[
        [5.5,3.5,15.33,41.5,34,.17],
        [5.5,3.5,15.33,41.5,34,.17],
        [5.5,3.5,15.33,42,33.5,.17],
        [5.5,3.5,15.33,42,33.5,.17],
        [5.5,3.5,15.33,42,33.5,.17]
      ]
    },
    II:{
      rates:[4.5,7.8,10,11.2,14.7,29.9],
      discounts:[0,5940,13860,22500,85500,720000],
      shares:Array.from({length:5},()=>[5.5,3.5,13.85,37.5,7.5,32,.15])
    },
    III:{
      rates:[6,11.2,13.5,16,21,32.9],
      discounts:[0,9360,17640,35640,125640,648000],
      shares:[
        [4,3.5,15.43,43.4,33.5,.17],
        [4,3.5,16.91,43.4,32,.19],
        [4,3.5,16.41,43.4,32.5,.19],
        [4,3.5,16.41,43.4,32.5,.19],
        [4,3.5,15.43,43.4,33.5,.17]
      ],
      issCapShares:{IRPJ:6.02,CSLL:5.26,CBS:23.20,CPP:65.26,IBS:.26}
    },
    IV:{
      rates:[4.5,9,10.2,14,22,32.9],
      discounts:[0,8100,12420,39780,183780,828000],
      shares:[
        [18.8,15.2,21.26,44.5,.24],
        [19.8,15.2,24.73,40,.27],
        [20.8,15.2,23.74,40,.26],
        [17.8,19.2,22.75,40,.25],
        [18.8,19.2,21.76,40,.24]
      ],
      issCapShares:{IRPJ:31.33,CSLL:32,CBS:36.27,IBS:.40}
    },
    V:{
      rates:[15.5,18,19.5,20.5,23,30.4],
      discounts:[0,4500,9900,17100,62100,540000],
      shares:[
        [25,15,16.96,28.85,14,.19],
        [23,15,16.96,27.85,17,.19],
        [24,15,17.95,23.85,19,.20],
        [21,15,18.94,23.85,21,.21],
        [23,12.5,16.96,23.85,23.5,.19]
      ]
    }
  };
  const cents=n=>Math.round((n+Number.EPSILON)*100)/100;
  function calcDAS(input){
    const d=input||{};
    const rbt=Number(d.rbt12), receita=Number(d.receita);
    if(!Number.isFinite(rbt)||rbt<=0||!Number.isFinite(receita)||receita<0)
      throw new Error('Informe RBT12 positiva e receita tributável mensal válida.');
    if(rbt>4800000)throw new Error('RBT12 acima de R$ 4,8 milhões: reveja a elegibilidade ao Simples.');
    if(rbt>3600000)throw new Error('Na 6ª faixa e/ou acima do sublimite, o DAS e a parcela de IBS/CBS exigem conciliação no PGDAS-D. Utilize o modo manual validado.');
    let anexo=String(d.anexo||'').toUpperCase();
    let fatorR=null;
    if(d.sujeitaFatorR===true){
      const folha=Number(d.folha12);
      if(!Number.isFinite(folha)||folha<0)throw new Error('Informe folha dos 12 meses para atividade sujeita ao Fator R.');
      fatorR=folha/rbt;
      anexo=fatorR>=0.28?'III':'V';
    }
    if(!Object.prototype.hasOwnProperty.call(tabelas,anexo))
      throw new Error('Selecione um anexo I, II, III, IV ou V. Para atividade mista, use dados conferidos no PGDAS-D.');
    const idx=LIMITES.findIndex(v=>rbt<=v);
    const spec=tabelas[anexo];
    const aliquotaEfetiva=(rbt*spec.rates[idx]/100-spec.discounts[idx])/rbt;
    const das=cents(receita*aliquotaEfetiva);
    const reparticao={};
    let issLimitado=false;
    if(idx===4 && spec.issCapShares && aliquotaEfetiva*spec.shares[idx][columns[anexo].indexOf('ISS')]/100>0.05){
      issLimitado=true;
      reparticao.ISS=cents(receita*.05);
      const restante=aliquotaEfetiva-.05;
      for(const [tributo,pct] of Object.entries(spec.issCapShares))
        reparticao[tributo]=cents(receita*restante*pct/100);
    } else {
      for(let i=0;i<columns[anexo].length;i++)
        reparticao[columns[anexo][i]]=cents(das*spec.shares[idx][i]/100);
    }
    const soma=Object.values(reparticao).reduce((a,b)=>a+b,0);
    reparticao.IRPJ=cents(reparticao.IRPJ+cents(das-soma)); // arredondamento residual
    const cbs=reparticao.CBS||0,ibs=reparticao.IBS||0;
    return {
      ano:'2027-2028',anexo,faixa:idx+1,rbt12:rbt,receita,aliquotaEfetiva:aliquotaEfetiva*100,
      dasTotal:das,partilha:reparticao,cbs,ibs,ibsCbs:cents(cbs+ibs),
      dasResidual:cents(das-cbs-ibs),creditRate:receita>0?(cbs+ibs)/receita*100:0,
      fatorR,issLimitado,cppForaDoDas:anexo==='IV',
      observacoes:[
        'Cálculo para receita homogênea, sem tributação segregada ou regimes especiais.',
        ...(anexo==='IV'?['A CPP patronal do Anexo IV é recolhida fora do DAS e NÃO foi calculada.']:[]),
        ...(issLimitado?['Limite de ISS de 5% aplicado com repartição federal da 5ª faixa.']:[])
      ]
    };
  }
  // LC 214/2025: créditos de CBS não compensam IBS, e vice-versa.
  function apurarRegular(raw){
    const d=raw||{};
    const names=['receita','taxaCbs','taxaIbs','creditoCbs','creditoIbs'];
    if(names.some(k=>!Number.isFinite(Number(d[k]))||Number(d[k])<0))
      throw new Error('Débitos e créditos devem ser valores numéricos não negativos.');
    const debitoCbs=cents(d.receita*d.taxaCbs/100);
    const debitoIbs=cents(d.receita*d.taxaIbs/100);
    const cbsPagar=cents(Math.max(0,debitoCbs-d.creditoCbs));
    const ibsPagar=cents(Math.max(0,debitoIbs-d.creditoIbs));
    const saldoCbs=cents(Math.max(0,d.creditoCbs-debitoCbs));
    const saldoIbs=cents(Math.max(0,d.creditoIbs-debitoIbs));
    return {debitoCbs,debitoIbs,cbsPagar,ibsPagar,
      recolhimentoRegular:cents(cbsPagar+ibsPagar),saldoCbs,saldoIbs,
      saldoCredor:cents(saldoCbs+saldoIbs)};
  }
  return Object.freeze({calcular:calcDAS,apurarRegular,versao:'2026-10-19-res190',limites:LIMITES});
});