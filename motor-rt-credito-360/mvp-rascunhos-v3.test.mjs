import test from 'node:test';
import assert from 'node:assert/strict';
import {extrairRascunhosRubricasV3, validarRascunhosRubricasV3} from './mvp-rascunhos-v3.js';

const csv = linhas => [{name:'dados-com-identidade.csv',parsed:{type:'CSV',rows:linhas,text:'CNPJ 00.000.000/0001-00'}}];

test('extrai rubricas de CSV sem texto, nome de arquivo ou identidade', () => {
 const rubricas=extrairRascunhosRubricasV3(csv([['Clientes','1.250,50'],['Fornecedores','(400,25)']]));
 assert.equal(rubricas.length,2);
 assert.equal(rubricas[0].valor,1250.5);
 assert.equal(rubricas[1].valor,-400.25);
 assert.equal(rubricas[0].linhaOrigem,1);
 assert.equal(rubricas[0].revisado,false);
 assert.equal(rubricas[0].aptoParaConciliacao,false);
 assert.equal(rubricas[0].unidade,'nao_confirmada');
 assert.equal(JSON.stringify(rubricas).includes('CNPJ'),false);
 assert.equal(JSON.stringify(rubricas).includes('dados-com-identidade'),false);
});

test('aceita linha numérica de Excel sem inferir unidade, período ou classificação', () => {
 const r=extrairRascunhosRubricasV3([{parsed:{type:'Excel',rows:[['Ativo circulante',1000],['Patrimônio líquido','0']]}}]);
 assert.deepEqual(r.map(x=>x.valor),[1000,0]);
 assert.deepEqual(r.map(x=>x.grupo),[null,null]);
 assert.deepEqual(r.map(x=>x.periodo),[null,null]);
});

test('não escolhe coluna arbitrária em comparativos nem aceita separador decimal ambíguo', () => {
 const r=extrairRascunhosRubricasV3(csv([
  ['Receita líquida','1.000,00','900,00'],['Caixa','1.200.50'],
  ['Passivo','1000','900'],['Clientes','1.000,00'],['Código 123','999,99','']
 ]));
 assert.deepEqual(r.map(x=>x.valor),[1000]);
});

test('PDF usa texto do leitor existente, ignora cabeçalho e não transforma OCR em revisão', () => {
 const r=extrairRascunhosRubricasV3([{parsed:{type:'PDF',text:'PÁGINA 1\nCNPJ 12.345.678/0001-90\nAtivo circulante 1.234,56\nReceita 2025\nPassivo 500,00',extraction:'text+ocr'}}]);
 assert.deepEqual(r.map(x=>x.valor),[1234.56,500]);
 assert.deepEqual(r.map(x=>x.linhaOrigem),[3,5]);
 assert.ok(r.every(x=>x.revisado===false));
});

test('rejeita valores não finitos, excessivos e números de documentos pessoais', () => {
 const r=extrairRascunhosRubricasV3(csv([
  ['CPF','12345678901'],['CNPJ','12.345.678/0001-90'],['Caixa',Infinity],
  ['Saldo',1e16],['Caixa','-250,00']
 ]));
 assert.deepEqual(r.map(x=>x.valor),[-250]);
});

test('rejeita lotes excessivos sem enviar subconjunto silencioso', () => {
 assert.throws(()=>extrairRascunhosRubricasV3(Array.from({length:11},()=>({parsed:{type:'CSV',rows:[]}}))));
 assert.throws(()=>extrairRascunhosRubricasV3(csv(Array.from({length:251},()=>['Caixa','1,00']))));
 assert.throws(()=>extrairRascunhosRubricasV3(csv(Array.from({length:2001},()=>['Caixa','1,00']))));
});

test('validação de recebimento aplica lista positiva e remove metadados indevidos', () => {
 const origem=extrairRascunhosRubricasV3(csv([['Caixa','12,00']]))[0];
 const validados=validarRascunhosRubricasV3([{...origem,nome:'Pessoa X',cnpj:'00000000000000'}]);
 assert.equal(validados.length,1);
 assert.equal('nome' in validados[0],false);
 assert.equal('cnpj' in validados[0],false);
});

test('validação rejeita falsificação de revisão, duplicações, escala e infinitos', () => {
 const origem=extrairRascunhosRubricasV3(csv([['Caixa','12,00']]))[0];
 for (const alteracao of [{revisado:true},{aptoParaConciliacao:true},{unidade:'BRL'},
   {grupo:'ativo'},{periodo:{inicio:'2025-01-01'}},{valor:Infinity},{linhaOrigem:0}]) {
  assert.throws(()=>validarRascunhosRubricasV3([{...origem,...alteracao}]));
 }
 assert.throws(()=>validarRascunhosRubricasV3([origem,origem]));
});
