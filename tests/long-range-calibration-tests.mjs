import assert from 'node:assert/strict';
import {weightedRecentProjection,evaluateLongRangeBlend,selectLongRangeCalibration} from '../src/model/long-range-calibration.js';

const rows=[
 {season:2025,week:1,playerId:'p1',position:'QB',actual:20},{season:2025,week:2,playerId:'p1',position:'QB',actual:22},{season:2025,week:3,playerId:'p1',position:'QB',actual:24},
 {season:2025,week:1,playerId:'p2',position:'WR',actual:10},{season:2025,week:2,playerId:'p2',position:'WR',actual:12},{season:2025,week:3,playerId:'p2',position:'WR',actual:14}
];
const baselines=[{season:2025,playerId:'p1',projection:22},{season:2025,playerId:'p2',projection:12}];
assert.equal(weightedRecentProjection(rows.filter(r=>r.playerId==='p1'),{beforeWeek:2,decay:.8}),20);
const grid=evaluateLongRangeBlend(rows,{seasonBaselines:baselines,seasonWeights:[0,.65,1],recencyDecays:[.8]});
assert.equal(grid.length,3);assert.ok(grid.every(r=>r.n===4&&Number.isFinite(r.rmse)&&Number.isFinite(r.mae)));assert.ok(grid.every(r=>r.byPosition.QB&&r.byPosition.WR));
const selected=selectLongRangeCalibration(rows,{seasonBaselines:baselines,seasonWeights:[0,.65,1],recencyDecays:[.8]});assert.ok(selected.best);assert.equal(selected.results.length,3);assert.deepEqual(selected.defaults,{seasonWeight:.65,recencyDecay:.8});
console.log('long-range-calibration-tests: all checks passed');
