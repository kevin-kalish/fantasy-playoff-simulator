import assert from 'node:assert/strict';
import {calibrationRefreshPlan} from '../src/data/calibration-refresh.js';
assert.deepEqual(calibrationRefreshPlan({season:2026,archives:0}).map(s=>s.name),['actuals']);
assert.deepEqual(calibrationRefreshPlan({season:2026,archives:1,refreshSchedule:true}).map(s=>s.name),['kickoffs','enrich','actuals','import']);
assert.equal(calibrationRefreshPlan({season:2026,archives:1}).at(-1).allowNoPairs,true);
assert.throws(()=>calibrationRefreshPlan({season:0}),/Invalid season/);
console.log('calibration-refresh-tests: all checks passed');
