import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {diagnoseCaptureSources} from '../src/data/capture-source-diagnostics.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'capture-diagnostic-'));
try{
 const schedulePath=path.join(dir,'kickoffs.csv');
 const future=new Date(Date.now()+86400000).toISOString();
 fs.writeFileSync(schedulePath,'season,week,home_team,away_team,kickoffAt\n2026,6,NE,NYJ,'+future+'\n');
 const options={schedulePath,quotaPath:path.join(dir,'missing.json'),season:2026,week:6};
 const none=diagnoseCaptureSources({...options,env:{}});
 assert.equal(none.networkRequests,0);
 assert.equal(none.readyForLiveAttempt,false);
 assert.equal(none.schedule.weekGames,1);
 const configured=diagnoseCaptureSources({...options,env:{FANTASYPROS_API_KEY:'test'}});
 assert.equal(configured.readyForLiveAttempt,true);
 assert.equal(configured.providers.fantasypros.availability,'unverified');
 fs.appendFileSync(schedulePath,'2026,6,NE,BUF,'+future+'\n');
 const conflict=diagnoseCaptureSources({...options,env:{FANTASYPROS_API_KEY:'test'}});
 assert.equal(conflict.schedule.conflicts,1);
 assert.equal(conflict.readyForLiveAttempt,false);
 console.log('capture-source-diagnostics-tests: all checks passed');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
