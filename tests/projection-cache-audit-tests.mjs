import assert from 'node:assert/strict';
import {auditProjectionCache,formatProjectionCacheAudit} from '../src/data/projection-cache-audit.js';
const rows=[
 {season:2026,week:3,name:'QB One',position:'QB',projection:20},
 {season:2026,week:3,name:'RB One',position:'RB',projection:14},
 {season:2026,week:4,name:'QB One',position:'QB',projection:21},
 {season:2026,week:4,name:'Broken',position:'WR'},
 {season:2025,week:3,name:'Old QB',position:'QB',projection:18}
];
const audit=auditProjectionCache(rows,{season:2026,weeks:[3,4,5],minimumRows:2});
assert.equal(audit.ready,false);assert.deepEqual(audit.missingWeeks,[4,5]);assert.equal(audit.totalRows,4);assert.equal(audit.usableRows,3);
assert.deepEqual(audit.weekResults.map(x=>[x.week,x.usableRows,x.ready]),[[3,2,true],[4,1,false],[5,0,false]]);
assert.match(formatProjectionCacheAudit(audit),/INCOMPLETE/);assert.match(formatProjectionCacheAudit(audit),/W4:1!/);assert.match(formatProjectionCacheAudit(audit),/W5:0!/);
const ready=auditProjectionCache(rows,{season:2026,weeks:[3,4],minimumRows:1});assert.equal(ready.ready,true);assert.deepEqual(ready.missingWeeks,[]);assert.match(formatProjectionCacheAudit(ready),/READY/);
console.log('projection-cache-audit-tests: all checks passed');
