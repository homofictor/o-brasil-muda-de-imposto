import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gerarTresCenariosSinteticos} from './mvp-tres-cenarios.js';

test('exemplo completo gera três cenários de 2026 a 2033 sem bloqueio', () => {
  const r = gerarTresCenariosSinteticos();
  assert.equal(r.status, 'exemplo_sintetico_nao_homologado');
  assert.deepEqual(r.cenarios.map(c => c.id), ['favoravel', 'central', 'adverso']);
  for (const c of r.cenarios) {
    assert.deepEqual(c.exercicios.map(e => e.ano), [2026,2027,2028,2029,2030,2031,2032,2033]);
    assert.ok(c.exercicios.every(e => Number.isFinite(e.caixaAjustado) && Number.isFinite(e.icsdAjustado)));
  }
});
test('preserva caixa e serviço da dívida originais em todos os cenários', () => {
  const r = gerarTresCenariosSinteticos();
  for (let i = 0; i < 8; i++) {
    const base = r.cenarios[0].exercicios[i];
    for (const c of r.cenarios) {
      assert.equal(c.exercicios[i].caixaOriginal, base.caixaOriginal);
      assert.equal(c.exercicios[i].servicoDivida, base.servicoDivida);
      assert.equal(c.exercicios[i].icsdOriginal, base.icsdOriginal);
    }
  }
});
test('cenários preservam segregação IBS e CBS e conciliam caixa', () => {
  const r = gerarTresCenariosSinteticos();
  for (const c of r.cenarios) for (const e of c.exercicios) {
    assert.ok(Math.abs((e.caixaAjustado - e.caixaOriginal) - e.deltaCaixa) < 1e-9);
    assert.equal(e.icsdAjustado, e.caixaAjustado / e.servicoDivida);
    assert.equal(typeof e.ibsIncremental, 'number');
    assert.equal(typeof e.cbsIncremental, 'number');
  }
});
test('sensibilidades são hipóteses, não alíquotas legais ou parecer', () => {
  const r = gerarTresCenariosSinteticos();
  assert.ok(r.cenarios[0].resumo.deltaCaixaAcumulado > r.cenarios[1].resumo.deltaCaixaAcumulado);
  assert.ok(r.cenarios[1].resumo.deltaCaixaAcumulado > r.cenarios[2].resumo.deltaCaixaAcumulado);
  assert.match(r.limitacoes.join(' '), /arbitradas|hipotéticos/);
  assert.match(r.limitacoes.join(' '), /não constitui parecer/);
});
test('interface principal mantém somente três etapas e reutiliza importador', () => {
  const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/<section\s+id="etapa\d"/g) ?? []).length, 3);
  assert.ok(!/<section\s+(?!id="etapa[123]")/g.test(html));
  assert.match(html, /iniciarPonteImportacaoMVP/);
  assert.match(html, /iniciarCadastro/);
  assert.match(html, /class="sticky"/);
  assert.match(html, /gerarTresCenariosSinteticos/);
  assert.doesNotMatch(html, /FileReader\s*\(/);
});
