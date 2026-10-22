import assert from 'node:assert/strict';
import {buildPrivateCalibrationReport} from '../src/model/private-calibration-report.js';
const empty=buildPrivateCalibrationReport([]);
assert.equal(empty.reviewEligible,false);
assert.equal(empty.parameterUpdatesAllowed,false);
assert.equal(empty.chronological.summary.n,0);
const rows=[];
for(const season of [2023,2024,2025,2026])for(let p=0;p<10;p++)for(let week=1;week<=6;week++){
 rows.push({season,week,playerId:'p'+p,position:p%2?'WR':'RB',source:'jerrygm',scoring:'HALF',projection:10+p+week,actual:11+p+week,projectedAt:season+'-09-01T00:00:00Z',kickoffAt:season+'-09-05T00:00:00Z',actualRecordedAt:season+'-09-06T00:00:00Z'});
}
const report=buildPrivateCalibrationReport(rows,{baselineThroughWeek:2,minTestSamples:20});
assert.equal(report.accuracy.quality.accepted,240);
assert.deepEqual(report.chronological.folds.map(f=>f.holdoutSeason),[2025,2026]);
assert.ok(report.chronological.folds.every(f=>f.trainedOnSeasons.every(s=>s<f.holdoutSeason)));
assert.equal(report.parameterUpdatesAllowed,false);
const bad=buildPrivateCalibrationReport([...rows,{...rows[0],playerId:'invalid',projectedAt:'2023-09-06T00:00:00Z'}],{baselineThroughWeek:2,minTestSamples:20});
assert.equal(bad.accuracy.quality.rejected,1);
assert.equal(bad.reviewEligible,false);
assert.ok(bad.warnings.includes('invalid-or-duplicate-pairs-excluded'));
console.log('private-calibration-report-tests: all checks passed');
