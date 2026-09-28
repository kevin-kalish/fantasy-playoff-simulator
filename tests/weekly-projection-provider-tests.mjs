import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {loadWeeklyProjections,loadWeeklyProjectionHorizon} from '../src/data/weekly-projection-provider.js';
const file=path.join(os.tmpdir(),`projection-provider-${process.pid}.json`);
fs.writeFileSync(file,JSON.stringify([
 {season:2026,week:4,playerId:'fixture-1',name:'Fixture RB',position:'RB',projection:12},
 {season:2026,week:5,playerId:'fixture-1',name:'Fixture RB',position:'RB',projection:13},
 {season:2026,week:6,playerId:'fixture-1',name:'Fixture RB',position:'RB',projection:14},
 {season:2025,week:4,playerId:'old',name:'Old RB',position:'RB',projection:9}
]));
const fetchImpl=async()=>({ok:false,status:403,text:async()=>'{"message":"Forbidden"}'});
const result=await loadWeeklyProjections({season:2026,week:4,apiKey:'test-key',fixturePath:file,fetchImpl});
assert.equal(result.provider,'fixture');assert.equal(result.rows.length,1);assert.equal(result.rows[0].week,4);assert.equal(result.trust.ready,true);assert.equal(result.trust.degraded,true);assert.equal(result.trust.fallbacksUsed,1);assert.match(result.trust.attempts[0].error,/403/);
const horizon=await loadWeeklyProjectionHorizon({season:2026,weeks:[4,5,6],apiKey:'test-key',fixturePath:file,fetchImpl});
assert.equal(horizon.provider,'fixture');assert.deepEqual(horizon.weeks,[4,5,6]);assert.deepEqual(horizon.rows.map(x=>x.week),[4,5,6]);assert.equal(horizon.rows.length,3);assert.equal(horizon.trust.ready,true);assert.equal(horizon.trust.degraded,true);assert.equal(horizon.trust.fallbacksUsed,3);assert.equal(horizon.trust.weekResults.length,3);assert.equal(horizon.trust.attempts.filter(x=>x.provider==='fantasypros').length,3);
fs.unlinkSync(file);console.log('weekly-projection-provider-tests: all checks passed');
