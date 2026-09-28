import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {loadWeeklyProjections} from '../src/data/weekly-projection-provider.js';
const file=path.join(os.tmpdir(),`projection-provider-${process.pid}.json`);fs.writeFileSync(file,JSON.stringify([{season:2026,week:4,playerId:'fixture-1',name:'Fixture RB',position:'RB',projection:12}]));
const fetchImpl=async()=>({ok:false,status:403,text:async()=>'{"message":"Forbidden"}'});
const result=await loadWeeklyProjections({season:2026,week:4,apiKey:'test-key',fixturePath:file,fetchImpl});
assert.equal(result.provider,'fixture');assert.equal(result.rows.length,1);assert.equal(result.trust.ready,true);assert.equal(result.trust.degraded,true);assert.equal(result.trust.fallbacksUsed,1);assert.match(result.trust.attempts[0].error,/403/);
fs.unlinkSync(file);console.log('weekly-projection-provider-tests: all checks passed');
