import assert from 'node:assert/strict';
import {evaluateProjectionAccuracy} from '../src/model/projection-accuracy-calibration.js';
const row=(overrides={})=>({season:2025,week:4,playerId:'a',source:'archived-provider',position:'RB',scoring:'HALF',projection:12,actual:9,projectedAt:'2025-09-25T12:00:00Z',kickoffAt:'2025-09-28T17:00:00Z',actualRecordedAt:'2025-09-29T17:00:00Z',...overrides});
const r=evaluateProjectionAccuracy([row(),row({playerId:'b',position:'WR',projection:8,actual:10}),row({playerId:'c',projectedAt:'2025-09-29T18:00:00Z'}),row({playerId:'d',actualRecordedAt:'2025-09-27T00:00:00Z'}),row()]);
assert.equal(r.overall.n,2);assert.equal(r.overall.mae,2.5);assert.equal(r.overall.bias,.5);assert.equal(r.quality.rejected,3);assert.equal(r.byPosition.RB.n,1);assert.equal(r.byPosition.WR.n,1);assert.equal(r.publicationEligible,false);
assert.equal(evaluateProjectionAccuracy([row()],{asOf:'2025-09-28T20:00:00Z'}).overall.n,0);
assert.equal(evaluateProjectionAccuracy([]).quality.confidence,'INSUFFICIENT_SAMPLE');
console.log('projection-accuracy-calibration-tests: all checks passed');
