const assert=require('node:assert/strict');
const {calculateEconomicImpact}=require('../v3/economic-impact.js');

const noTransfer=calculateEconomicImpact({annualRevenue:1_000_000,currentConsumptionTax:80_000,futureConsumptionTax:130_000,priceTransferRate:0,currentOperatingMargin:.15,financeCost:5_000});
assert.equal(noTransfer.taxDelta,50_000);
assert.equal(noTransfer.unabsorbedDelta,50_000);
assert.equal(noTransfer.projectedOperatingResult,100_000);
assert.equal(noTransfer.resultEffect,-55_000);
assert.equal(noTransfer.requiredPriceRate,.05);

const fullTransfer=calculateEconomicImpact({annualRevenue:1_000_000,currentConsumptionTax:80_000,futureConsumptionTax:130_000,priceTransferRate:1,currentOperatingMargin:.15,financeCost:0});
assert.equal(fullTransfer.priceChange,50_000);
assert.equal(fullTransfer.unabsorbedDelta,0);
assert.equal(fullTransfer.projectedOperatingResult,150_000);
assert.equal(fullTransfer.resultEffect,0);

const savingRetained=calculateEconomicImpact({annualRevenue:1_000_000,currentConsumptionTax:130_000,futureConsumptionTax:90_000,priceTransferRate:0,currentOperatingMargin:.15,financeCost:0});
assert.equal(savingRetained.taxDelta,-40_000);
assert.equal(savingRetained.projectedOperatingResult,190_000);
assert.equal(savingRetained.resultEffect,40_000);

console.log('economic-impact: 3 cenarios validados');
