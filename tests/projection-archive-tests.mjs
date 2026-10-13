import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildProjectionArchive,saveProjectionArchive} from '../src/data/projection-archive.js';
const archive=buildProjectionArchive([{season:2026,week:6,playerId:'p1',name:'Player',position:'RB',projection:13.5,source:'jerrygm'}],{capturedAt:'2026-10-13T17:00:00Z',scoring:'HALF',provider:'jerrygm'});
assert.equal(archive.rows.length,1);
assert.equal(archive.schemaVersion,2);
assert.equal(archive.rows[0].forecastProvenance.kind,'unverified-cache-or-fallback');
const fresh=buildProjectionArchive([{season:2026,week:7,playerId:'p1',name:'Player',position:'RB',projection:13.5}],{capturedAt:'2026-10-13T17:00:00Z',provider:'jerrygm',providerByWeek:{7:'jerrygm'},refreshRequested:true});
assert.equal(fresh.rows[0].forecastProvenance.kind,'fresh-provider-response');
const cache=buildProjectionArchive([{season:2026,week:7,playerId:'p1',name:'Player',position:'RB',projection:13.5}],{capturedAt:'2026-10-13T17:00:00Z',provider:'cache',providerByWeek:{7:'cache'},refreshRequested:true});
assert.equal(cache.rows[0].forecastProvenance.kind,'unverified-cache-or-fallback');
assert.equal(archive.rows[0].projectedAt,archive.capturedAt);
assert.equal(archive.rows[0].kickoffAt,undefined);
assert.equal(archive.immutableArchive,true);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'projection-archive-'));
try{
 const file=saveProjectionArchive(dir,archive);
 assert.ok(fs.existsSync(file));
 assert.throws(()=>saveProjectionArchive(dir,archive),/EEXIST/);
 assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).rows[0].projection,13.5);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('projection-archive-tests: all checks passed');
