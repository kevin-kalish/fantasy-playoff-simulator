import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {loadWeeklyProjections} from '../src/data/weekly-projection-provider.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'targeted-projections-'));
try{
 const cachePath=path.join(dir,'cache.json');
 fs.writeFileSync(cachePath,JSON.stringify([{season:2026,week:5,playerId:'OLD',name:'Stale Player',position:'QB',projection:3}]));
 const requested=[];
 const fetchImpl=async url=>{
  const u=new URL(url);requested.push(u.searchParams.get('names'));
  return {ok:true,text:async()=>JSON.stringify({season:2026,week:5,players:u.searchParams.get('names').split(',').map(name=>({name,position:'RB',projectedPoints:12}))})};
 };
 const names=Array.from({length:27},(_,i)=>'Player '+i);
 const result=await loadWeeklyProjections({season:2026,week:5,projectionNames:names,jerryGMApiKey:'test-only',cachePath,fetchImpl});
 assert.equal(result.provider,'jerrygm','live targeted source must outrank cached top-100 rows');
 assert.equal(result.rows.length,27);
 assert.deepEqual(requested.map(x=>x.split(',').length),[25,2]);
 assert.equal(result.rows[0].name,'Player 0');
 assert.ok(!result.rows.some(x=>x.playerId==='OLD'));
 console.log('yahoo-targeted-projections-tests: all checks passed');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
