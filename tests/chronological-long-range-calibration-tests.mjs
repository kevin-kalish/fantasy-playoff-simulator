import assert from 'node:assert/strict';
import {evaluateChronologicalLongRangeWalkForward} from '../src/model/long-range-calibration.js';
const rows=[];
for(const season of [2023,2024,2025,2026]){
 for(let p=0;p<10;p++){
  for(let week=1;week<=6;week++)rows.push({season,week,playerId:'p'+p,position:p%2?'WR':'RB',projection:10+week+p,actual:12+week+p});
 }
}
const options={baselineThroughWeek:2,seasonWeights:[0,.65,1],recencyDecays:[.8],minTestSamples:20};
const result=evaluateChronologicalLongRangeWalkForward(rows,options);
assert.deepEqual(result.folds.map(f=>f.holdoutSeason),[2025,2026]);
assert.deepEqual(result.folds[0].trainedOnSeasons,[2023,2024]);
assert.deepEqual(result.folds[1].trainedOnSeasons,[2023,2024,2025]);
assert.ok(result.folds.every(f=>f.trainedOnSeasons.every(s=>s<f.holdoutSeason)));
assert.equal(result.summary.n,80);
assert.ok(Number.isFinite(result.summary.candidateRmse));
assert.ok(Number.isFinite(result.summary.defaultRmse));
assert.equal(result.summary.parameterUpdatesAllowed,false);
assert.equal(evaluateChronologicalLongRangeWalkForward(rows.slice(0,60),options).summary.reviewEligible,false);
assert.equal(evaluateChronologicalLongRangeWalkForward(rows,{...options,minTestSamples:1000}).summary.evidenceSufficient,false);
console.log('chronological-long-range-calibration-tests: all checks passed');
