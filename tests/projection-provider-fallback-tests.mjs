import assert from 'node:assert/strict';
import {createProjectionProvider,loadProjectionRows,projectionProviderTrust} from '../src/data/projection-provider.js';
const fantasypros=createProjectionProvider({name:'fantasypros',priority:100,load:async()=>{throw new Error('403 Forbidden')}});
const fixture=createProjectionProvider({name:'fixture',priority:10,load:async()=>[{season:2026,week:4,playerId:'p1',projection:10}]});
const result=await loadProjectionRows([fixture,fantasypros],{season:2026,week:4});
assert.equal(result.provider,'fixture');assert.equal(result.degraded,true);assert.equal(result.rows.length,1);assert.equal(result.attempts[0].provider,'fantasypros');assert.equal(result.attempts[0].ok,false);
const trust=projectionProviderTrust(result);assert.equal(trust.ready,true);assert.equal(trust.degraded,true);assert.equal(trust.fallbacksUsed,1);
await assert.rejects(()=>loadProjectionRows([fantasypros],{},{}),e=>e.attempts?.[0]?.error==='403 Forbidden');
console.log('projection-provider-fallback-tests: all checks passed');
