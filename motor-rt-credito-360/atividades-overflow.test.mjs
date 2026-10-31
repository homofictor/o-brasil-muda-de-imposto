import test from 'node:test';
import assert from 'node:assert/strict';
import {projetarAtividadesIBSCBS} from './atividades-ibs-cbs.js';

const atividade = (id, receitaBase, crescimento = 0, ibs = 0.01, cbs = 0.01) => ({
  id, receitaBase, crescimento,
  aliquotasValidadas: {ibs: {2027: ibs}, cbs: {2027: cbs}}
});

test('rejeita receita consolidada não finita mesmo com débitos de IBS/CBS finitos', () => {
  assert.throws(() => projetarAtividadesIBSCBS({
    anoBase: 2026, anos: 1,
    atividades: [atividade('comercio', 1e308), atividade('industria', 1e308)]
  }), /Receita ou débito não finito/);
});

test('rejeita projeção não finita causada pelo crescimento de uma atividade', () => {
  assert.throws(() => projetarAtividadesIBSCBS({
    anoBase: 2026, anos: 1,
    atividades: [atividade('servicos', 1e308, 1)]
  }), /Receita ou débito não finito/);
});

test('preserva projeção válida com oito atividades e contas IBS/CBS segregadas', () => {
  const setores = ['comercio','industria','servicos','construcao','saude',
    'transporte','agronegocio','multissetorial'];
  const r = projetarAtividadesIBSCBS({anoBase: 2026, anos: 1,
    atividades: setores.map(id => atividade(id, 100, 0, 0.05, 0.03))});
  const p = r.projecoes[0];
  assert.equal(p.receitaTotal, 800);
  assert.equal(p.ibs.debito, 40);
  assert.equal(p.cbs.debito, 24);
  assert.equal(p.tributoPagarTotal, 64);
  assert.equal(p.ibs.conciliacao, 0);
  assert.equal(p.cbs.conciliacao, 0);
  assert.equal(r.aptoParaParecer, false);
});
