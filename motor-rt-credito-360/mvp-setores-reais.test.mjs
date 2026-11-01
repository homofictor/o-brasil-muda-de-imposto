import test from 'node:test';
import assert from 'node:assert/strict';
import {SETORES_MVP, premissasSinteticasMVP, prepararEntradaMVP} from './mvp-cenario.js';

const revisao = {dre: true, ponte: true, ncg: true};

test('empresa multissetorial é composição de atividades, não atividade fictícia', () => {
  const ids = SETORES_MVP.map(([id]) => id);
  assert.equal(ids.length, 8);
  assert.ok(ids.includes('locacao'));
  assert.ok(!ids.includes('multissetorial'));
  const p = premissasSinteticasMVP();
  const entrada = prepararEntradaMVP(p, revisao).dadosFinanceiros;
  assert.equal(entrada.historico.receitaLiquida, 800);
  assert.equal(entrada.atividades.length, 8);
  assert.equal(entrada.atividades.filter(a => a.id === 'locacao').length, 1);
  assert.equal(entrada.eventosCredito.length, 0);
});

test('receitas e alíquotas de empresa com duas atividades não se confundem', () => {
  const p = premissasSinteticasMVP();
  p.atividades = p.atividades.filter(a => ['comercio', 'industria'].includes(a.id));
  p.atividades[0].receitaBase = 120;
  p.atividades[1].receitaBase = 280;
  p.atividades[0].ibsPercentual = 4;
  p.atividades[1].ibsPercentual = 6;
  p.atividades[0].cbsPercentual = 2;
  p.atividades[1].cbsPercentual = 3;
  const d = prepararEntradaMVP(p, revisao).dadosFinanceiros;
  assert.equal(d.historico.receitaLiquida, 400);
  assert.deepEqual(d.atividades.map(a => a.aliquotasValidadas.ibs[2027]), [0.04, 0.06]);
  assert.deepEqual(d.atividades.map(a => a.aliquotasValidadas.cbs[2027]), [0.02, 0.03]);
  assert.equal(d.variacaoNCG[2027], 10);
});

test('rejeita categoria multissetorial como se fosse atividade tributável', () => {
  const p = premissasSinteticasMVP();
  p.atividades = [{id:'multissetorial', descricao:'Empresa multissetorial', receitaBase:100, ibsPercentual:5, cbsPercentual:3}];
  assert.throws(() => prepararEntradaMVP(p, revisao), /Atividade inválida/);
});
