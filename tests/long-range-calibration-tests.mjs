import assert from 'node:assert/strict';
import {weightedRecentProjection,evaluateLongRangeBlend,selectLongRangeCalibration} from '../src/model/long-range-calibration.js';

const rows=[
 {season:2025,week:1,playerId:'p1',position:'QB',projection:19,actual:20},{season:2025,week:2,playerId:'p1',position:'QB',projection:21,actual:22},{season:2025,week:3,playerId:'p1',position:'QB',projection:23,actual:24},
 {season:2025,week:1,playerId:'p2',position:'WR',projection:9,actual:10},{season:2025,week:2,playerId:'p2',position:'WR',projection:11,actual:12},{season:2025,week:3,playerId:'p2',position:'WR',projection:13,actual:14}
];
const baselines=[{season:2025,playerId:'p1',projection:22},{season:2025,playerId:'p2',projection:12}];
assert.equal(weightedRecentProjection(rows.filter(r=>r.playerId==='p1'),{beforeWeek:2,decay:.8}),19);
// Guard against accidental look-ahead/model drift: calibration history must use
// the archived projection signal, not the realized fantasy points.
const divergent=[{week:1,projection:5,actual:50},{week:2,projection:10,actual:100}];
assert.equal(weightedRecentProjection(divergent,{beforeWeek:3,decay:1}),7.5);
const grid=evaluateLongRangeBlend(rows,{seasonBaselines:baselines,seasonWeights:[0,.65,1],recencyDecays:[.8]});
assert.equal(grid.length,3);assert.ok(grid.every(r=>r.n===4&&Number.isFinite(r.rmse)&&Number.isFinite(r.mae)));assert.ok(grid.every(r=>r.byPosition.QB&&r.byPosition.WR));
const selected=selectLongRangeCalibration(rows,{seasonBaselines:baselines,seasonWeights:[0,.65,1],recencyDecays:[.8]});assert.ok(selected.best);assert.equal(selected.results.length,3);assert.deepEqual(selected.defaults,{seasonWeight:.65,recencyDecay:.8});
console.log('long-range-calibration-tests: all checks passed');
