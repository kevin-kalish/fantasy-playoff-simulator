import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {writeKickoffVerificationEvidence,inspectKickoffVerificationEvidence} from '../src/data/kickoff-verification-evidence.js';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kickoff-evidence-'));
try{
 const file=path.join(dir,'schedule.csv'),evidencePath=path.join(dir,'evidence.json'),now=Date.now();
 fs.writeFileSync(file,'season,week,kickoffAt,home_team,away_team\n2026,7,2026-10-22T20:00:00Z,NE,NYJ');
 const args={file,season:2026,week:7,now,evidencePath};
 assert.equal(inspectKickoffVerificationEvidence(args).ready,false);
 assert.throws(()=>writeKickoffVerificationEvidence({file,season:2026,week:7,comparison:{match:false},output:evidencePath}));
 writeKickoffVerificationEvidence({file,season:2026,week:7,comparison:{match:true,localGames:1,referenceGames:1},referenceSource:'independent-test',verifiedAt:new Date(now).toISOString(),output:evidencePath});
 assert.equal(inspectKickoffVerificationEvidence(args).ready,true);
 assert.equal(inspectKickoffVerificationEvidence({...args,week:8}).ready,false);
 assert.equal(inspectKickoffVerificationEvidence({...args,now:now+49*3600000}).reason,'verification-expired');
 fs.appendFileSync(file,'\n');
 assert.equal(inspectKickoffVerificationEvidence(args).reason,'schedule-changed-since-verification');
 console.log('kickoff-verification-evidence-tests: all checks passed');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
