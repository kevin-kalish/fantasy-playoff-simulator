import assert from 'node:assert/strict';
import {weightedRecentProjection,evaluateLongRangeBlend,selectLongRangeCalibration,evaluateLongRangeWalkForward} from '../src/model/long-range-calibration.js';

const oneSeason=season=>[
 {season,week:1,playerId:'p1',position:'QB',projection:19,actual:20},{season,week:2,playerId:'p1',position:'QB',projection:21,actual:22},{season,week:3,playerId:'p1',position:'QB',projection:23,actual:24},{season,week:4,playerId:'p1',position:'QB',projection:24,actual:25},
 {season,week:1,playerId:'p2',position:'WR',projection:9,actual:10},{season,week:2,playerId:'p2',position:'WR',projection:11,actual:12},{season,week:3,playerId:'p2',position:'WR',projection:13,actual:14},{season,week:4,playerId:'p2',position:'WR',projection:14,actual:15}
];
const rows=oneSeason(2025).slice(0,3).concat(oneSeason(2025).slice(4,7));
const baselines=[{season:2025,playerId:'p1',projection:22},{season:2025,playerId:'p2',projection:12}];
assert.equal(weightedRecentProjection(rows.filter(r=>r.playerId==='p1'),{beforeWeek:2,decay:.8}),19);
// Guard against accidental look-ahead/model drift: calibration history must use
// the archived projection signal, not the realized fantasy points.
const divergent=[{week:1,projection:5,actual:50},{week:2,projection:10,actual:100}];
assert.equal(weightedRecentProjection(divergent,{beforeWeek:3,decay:1}),7.5);
const grid=evaluateLongRangeBlend(rows,{seasonBaselines:baselines,seasonWeights:[0,.65,1],recencyDecays:[.8]});
assert.equal(grid.length,3);assert.ok(grid.every(r=>r.n===4&&Number.isFinite(r.rmse)&&Number.isFinite(r.mae)));assert.ok(grid.every(r=>r.byPosition.QB&&r.byPosition.WR));
const selected=selectLongRangeCalibration(rows,{seasonBaselines:baselines,seasonWeights:[0,.65,1],recencyDecays:[.8]});assert.ok(selected.best);assert.equal(selected.results.length,3);assert.deepEqual(selected.defaults,{seasonWeight:.65,recencyDecay:.8});

const multiSeason=[...oneSeason(2024),...oneSeason(2025),...oneSeason(2026)];
const walk=evaluateLongRangeWalkForward(multiSeason,{baselineThroughWeek:2,seasonWeights:[0,.65,1],recencyDecays:[.8]});
assert.equal(walk.folds.length,3);assert.equal(walk.summary.folds,3);assert.ok(walk.summary.n>0);assert.ok(Number.isFinite(walk.summary.selectedRmse));assert.ok(Number.isFinite(walk.summary.defaultRmse));
assert.deepEqual(walk.folds.map(f=>f.holdoutSeason),[2024,2025,2026]);assert.ok(walk.folds.every(f=>!f.trainedOnSeasons.includes(f.holdoutSeason)));
console.log('long-range-calibration-tests: all checks passed');
