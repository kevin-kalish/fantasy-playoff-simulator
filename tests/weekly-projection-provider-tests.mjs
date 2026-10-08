import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {loadWeeklyProjections,loadWeeklyProjectionHorizon} from '../src/data/weekly-projection-provider.js';
const file=path.join(os.tmpdir(),`projection-provider-${process.pid}.json`);
const cache=path.join(os.tmpdir(),`projection-cache-${process.pid}.json`);
fs.writeFileSync(file,JSON.stringify([
 {season:2026,week:4,playerId:'fixture-1',name:'Fixture RB',position:'RB',projection:12},
 {season:2026,week:5,playerId:'fixture-1',name:'Fixture RB',position:'RB',projection:13},
 {season:2026,week:6,playerId:'fixture-1',name:'Fixture RB',position:'RB',projection:14},
 {season:2025,week:4,playerId:'old',name:'Old RB',position:'RB',projection:9}
]));
fs.writeFileSync(cache,JSON.stringify([
 {season:2026,week:4,playerId:'cache-1',name:'Cached RB',position:'RB',projection:15},
 {season:2026,week:5,playerId:'cache-1',name:'Cached RB',position:'RB',projection:16},
 {season:2026,week:6,playerId:'cache-1',name:'Cached RB',position:'RB',projection:17}
]));
const fetchImpl=async()=>({ok:false,status:403,text:async()=>'{"message":"Forbidden"}'});
// Explicitly disable JerryGM so these fallback tests are independent of the
// developer shell's JERRYGM_API_KEY environment variable.
const result=await loadWeeklyProjections({season:2026,week:4,apiKey:'test-key',jerryGMApiKey:'',fixturePath:file,cachePath:null,fetchImpl});
assert.equal(result.provider,'fixture');assert.equal(result.rows.length,1);assert.equal(result.rows[0].week,4);assert.equal(result.trust.ready,true);assert.equal(result.trust.degraded,true);assert.equal(result.trust.fallbacksUsed,1);assert.match(result.trust.attempts[0].error,/403/);
const horizon=await loadWeeklyProjectionHorizon({season:2026,weeks:[4,5,6],apiKey:'test-key',jerryGMApiKey:'',fixturePath:file,cachePath:null,fetchImpl});
assert.equal(horizon.provider,'fixture');assert.deepEqual(horizon.weeks,[4,5,6]);assert.deepEqual(horizon.rows.map(x=>x.week),[4,5,6]);assert.equal(horizon.rows.length,3);assert.equal(horizon.trust.ready,true);assert.equal(horizon.trust.degraded,true);assert.equal(horizon.trust.fallbacksUsed,3);assert.equal(horizon.trust.weekResults.length,3);assert.equal(horizon.trust.attempts.filter(x=>x.provider==='fantasypros').length,3);
let cacheNetworkCalls=0;const cacheFetch=async()=>{cacheNetworkCalls++;return{ok:false,status:500,text:async()=>''}};const cached=await loadWeeklyProjections({season:2026,week:4,apiKey:'test-key',jerryGMApiKey:'jgm-test',fixturePath:file,cachePath:cache,fetchImpl:cacheFetch,preferCache:true});
assert.equal(cached.provider,'cache');assert.equal(cacheNetworkCalls,0);assert.equal(cached.rows[0].name,'Cached RB');assert.equal(cached.trust.degraded,false);assert.equal(cached.trust.fallbacksUsed,0);
fs.unlinkSync(file);fs.unlinkSync(cache);console.log('weekly-projection-provider-tests: all checks passed');
