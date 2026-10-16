import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validatePregameCaptureInputs} from '../src/data/pregame-capture-validation.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pregame-gate-'));
try{
 const snapshot=path.join(dir,'snapshot.json');fs.writeFileSync(snapshot,'{}');
 const now=Date.now();
 const base={season:2026,week:6,yahoo:{leagueKey:'470.l.244897'},sourceAudit:{passed:true,leagueKey:'470.l.244897',week:6,generatedAt:new Date(now-30000).toISOString(),checks:[{pass:true}]}};
 assert.equal(validatePregameCaptureInputs(base,snapshot,{now}).week,6);
 const fail=(spec,pattern)=>assert.throws(()=>validatePregameCaptureInputs(spec,snapshot,{now}),pattern);
 fail({...base,sourceAudit:{...base.sourceAudit,generatedAt:new Date(now-3600000).toISOString()}},/stale/);
 fail({...base,sourceAudit:{...base.sourceAudit,checks:[{pass:false}]}},/complete passed/);
 fail({...base,sourceAudit:{...base.sourceAudit,leagueKey:'other'}},/league mismatch/);
 fail({...base,sourceAudit:{...base.sourceAudit,week:7}},/week mismatch/);
 fail({...base,sourceAudit:{...base.sourceAudit,generatedAt:new Date(now+120000).toISOString()}},/stale/);
 const old=new Date(now-120000);fs.utimesSync(snapshot,old,old);
 fail(base,/predates/);
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log('pregame-capture-validation-tests: all checks passed');
