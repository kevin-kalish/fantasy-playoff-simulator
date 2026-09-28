import assert from 'node:assert/strict';
import {parseProjectionCsv,normalizeProjectionRows,mergeProjectionCache} from '../src/data/projection-cache.js';
import {auditProjectionCache,formatProjectionCacheAudit} from '../src/data/projection-cache-audit.js';

const csv='player_name,pos,team,fpts\n"Doe, John",RB,NE,12.5\nJane Smith,WR,BUF,9.25\n';
const parsed=parseProjectionCsv(csv);
assert.equal(parsed.length,2);assert.equal(parsed[0].player_name,'Doe, John');
const rows=normalizeProjectionRows(parsed,{season:2026,week:4,source:'test'});
assert.equal(rows.length,2);assert.equal(rows[0].season,2026);assert.equal(rows[0].week,4);assert.equal(rows[0].projection,12.5);assert.equal(rows[0].source,'test');
const replacement={...rows[0],projection:15};
const merged=mergeProjectionCache(rows,[replacement,{season:2026,week:5,name:'Week Five',position:'TE',projection:7}]);
assert.equal(merged.length,3);assert.equal(merged.find(row=>row.name==='Doe, John').projection,15);
const invalid=normalizeProjectionRows([{player_name:'No Projection',pos:'RB'}],{season:2026,week:4});assert.equal(invalid.length,0);
const audit=auditProjectionCache(merged,{season:2026,weeks:[4,5,6],minimumRows:1});
assert.equal(audit.ready,false);assert.deepEqual(audit.missingWeeks,[6]);assert.equal(audit.weekResults[0].usableRows,2);assert.match(formatProjectionCacheAudit(audit),/W6:0!/);
const ready=auditProjectionCache(merged,{season:2026,weeks:[4,5],minimumRows:1});assert.equal(ready.ready,true);assert.match(formatProjectionCacheAudit(ready),/READY/);
console.log('projection-cache-tests: all checks passed');
