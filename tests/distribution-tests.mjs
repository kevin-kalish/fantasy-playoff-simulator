import assert from 'node:assert/strict';
import {simulateHistoricalDistribution,evaluateDistributionRow,runDistributionBacktest} from '../src/model/distribution-backtest.js';
const row={season:2025,week:1,playerId:'p1',position:'WR',projection:15,actual:14,status:'ACTIVE',cv:.35};
const a=simulateHistoricalDistribution(row,{variant:'volatility',draws:100,seed:12}),b=simulateHistoricalDistribution(row,{variant:'volatility',draws:100,seed:12});assert.deepEqual(a,b);assert.equal(a.length,100);assert.ok(a[0]<=a[99]);
const e=evaluateDistributionRow(row,{variant:'volatility',draws:200,seed:3});assert.ok(e.p10<=e.p25&&e.p25<=e.p50&&e.p50<=e.p75&&e.p75<=e.p90);
const outRow={...row,status:'OUT'};const out=simulateHistoricalDistribution(outRow,{variant:'availability',draws:20,seed:1});assert.ok(out.every(x=>x===0));
const report=runDistributionBacktest([row,{...row,playerId:'p2',position:'RB',projection:12,actual:10}],{variants:['volatility','availability'],draws:100,seed:5});assert.equal(report.length,2);assert.ok(report.every(x=>Number.isFinite(x.calibrationPenalty)));
console.log('distribution-tests: all checks passed');
