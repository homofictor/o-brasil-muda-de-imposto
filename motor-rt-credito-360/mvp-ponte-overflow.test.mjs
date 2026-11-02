import test from 'node:test';
import assert from 'node:assert/strict';
import {compararProjecaoEconomista} from './mvp-ponte-economista.js';
const revisao={projecaoOriginal:true,ponteTributaria:true,semDuplaContagem:true};
const linha=(ano=2026)=>({ano,caixaOriginal:70,servicoDivida:40,icsdConferido:1.75,
  ajusteEBITDA:0,ajusteNCG:0,ajusteCAPEX:0,ajusteIR:0,ajusteIBS:0,ajusteCBS:0,ajusteOutros:0});
test('referência normal mantém caixa e ICSD finitos',()=>{
 const r=compararProjecaoEconomista([linha()],revisao);
 assert.equal(r.projecao[0].icsdReforma,1.75);
 assert.equal(r.deltaCaixaAcumulado,0);
});
test('bloqueia soma IBS e CBS que estoura o delta de caixa',()=>{
 const l=linha();l.ajusteIBS=1e308;l.ajusteCBS=1e308;
 assert.throws(()=>compararProjecaoEconomista([l],revisao),/deltaCaixa não finito/);
});
test('bloqueia caixa ajustado infinito mesmo com delta finito',()=>{
 const l=linha();l.caixaOriginal=1e308;l.servicoDivida=1;l.icsdConferido=1e308;l.ajusteEBITDA=1e308;
 assert.throws(()=>compararProjecaoEconomista([l],revisao),/caixaReforma não finito/);
});
test('bloqueia ICSD infinito por serviço da dívida quase zero',()=>{
 const l=linha();l.caixaOriginal=1e308;l.servicoDivida=1e-308;l.icsdConferido=1;
 assert.throws(()=>compararProjecaoEconomista([l],revisao),/icsdOriginal não finito/);
});
test('bloqueia variação acumulada infinita apesar de exercícios finitos',()=>{
 const a=linha(2026),b=linha(2027);
 for(const l of [a,b]){l.caixaOriginal=0;l.servicoDivida=1;l.icsdConferido=0;l.ajusteEBITDA=1e308;}
 assert.throws(()=>compararProjecaoEconomista([a,b],revisao),/Variação acumulada de caixa não finita/);
});
