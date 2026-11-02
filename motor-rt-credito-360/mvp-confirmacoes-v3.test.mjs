import test from 'node:test';
import assert from 'node:assert/strict';
import {prepararConfirmacoesRubricasV3} from './mvp-confirmacoes-v3.js';

const base = () => [
 {documentoRef:'doc_1',linhaOrigem:1,formato:'CSV',valor:125.5,unidade:'nao_confirmada',grupo:null,periodo:null,revisado:false,aptoParaConciliacao:false},
 {documentoRef:'doc_1',linhaOrigem:2,formato:'CSV',valor:-40,unidade:'nao_confirmada',grupo:null,periodo:null,revisado:false,aptoParaConciliacao:false}
];
const confirmar = (extra={}) => ({documentoRef:'doc_1',linhaOrigem:1,acao:'confirmar',
 exercicio:2025,demonstracao:'BP',grupo:'ativo',escala:'MIL_BRL',sinal:'conforme_documento',
 periodo:{dataBase:'2025-12-31'},...extra});

test('confirma escala e competência sem liberar revisão, conciliação ou projeção',()=>{
 const r=prepararConfirmacoesRubricasV3(base(),[confirmar()]);
 assert.equal(r.confirmadas[0].valorBRL,125500);
 assert.equal(r.confirmadas[0].revisado,false);
 assert.equal(r.confirmadas[0].aptoParaConciliacao,false);
 assert.equal(r.aptoParaParecer,false);
 assert.equal(r.aplicadoProjecao,false);
 assert.equal(r.pendencias[0].motivo,'sem_confirmacao');
});
test('DRE parcial tem competência explícita sem anualização presumida',()=>{
 const r=prepararConfirmacoesRubricasV3(base(),[confirmar({demonstracao:'DRE',grupo:'custos',
   escala:'BRL',periodo:{inicio:'2025-01-01',fim:'2025-09-30'}})]);
 assert.equal(r.confirmadas[0].valorBRL,125.5);
 assert.equal(r.confirmadas[0].periodo.fim,'2025-09-30');
});
test('rejeita datas inválidas, grupos incompatíveis e ano divergente',()=>{
 for(const extra of [{periodo:{dataBase:'2025-02-30'}},{periodo:{dataBase:'2024-12-31'}},
   {grupo:'receita_liquida'},{escala:'escala_desconhecida'},{sinal:'automatico'}])
   assert.throws(()=>prepararConfirmacoesRubricasV3(base(),[confirmar(extra)]));
});
test('rejeita decisões duplicadas e referências inexistentes',()=>{
 const c=confirmar();
 assert.throws(()=>prepararConfirmacoesRubricasV3(base(),[c,c]));
 assert.throws(()=>prepararConfirmacoesRubricasV3(base(),[confirmar({linhaOrigem:99})]));
});
test('não aceita revisão falsificada no rascunho',()=>{
 const a=base();a[0].revisado=true;
 assert.throws(()=>prepararConfirmacoesRubricasV3(a,[confirmar()]));
});
test('não vaza metadados pessoais nem texto extra',()=>{
 const a=base();a[0].cnpj='dados_reais_nao';
 const r=prepararConfirmacoesRubricasV3(a,[confirmar({nome:'identidade_nao',periodo:{dataBase:'2025-12-31',cpf:'segredo'}})]);
 assert.equal(JSON.stringify(r).includes('dados_reais_nao'),false);
 assert.equal(JSON.stringify(r).includes('identidade_nao'),false);
 assert.equal(JSON.stringify(r).includes('segredo'),false);
});
test('descarte exige motivo explícito e não equivale a materialidade',()=>{
 const c={documentoRef:'doc_1',linhaOrigem:1,acao:'descartar',motivo:'extracao_incorreta'};
 const r=prepararConfirmacoesRubricasV3(base(),[c]);
 assert.equal(r.descartadas,1);
 assert.equal(r.confirmadas.length,0);
 assert.equal(r.pendencias.length,1);
 assert.throws(()=>prepararConfirmacoesRubricasV3(base(),[{...c,motivo:'imaterial'}]));
});
test('sinal negativo preservado e explicitamente pendente de tratamento contábil',()=>{
 const r=prepararConfirmacoesRubricasV3(base(),[confirmar({linhaOrigem:2,escala:'BRL'})]);
 assert.equal(r.confirmadas[0].valorBRL,-40);
 assert.ok(r.pendencias.some(p=>p.motivo==='sinal_negativo_exige_tratamento_contabil'));
});
test('conversão fora do limite é recusada',()=>{
 const a=base();a[0].valor=1e15;
 assert.throws(()=>prepararConfirmacoesRubricasV3(a,[confirmar({escala:'MILHOES_BRL'})]));
});
