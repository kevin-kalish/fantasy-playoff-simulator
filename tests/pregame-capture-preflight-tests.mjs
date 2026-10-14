import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {preflightPregameCapture} from '../src/data/pregame-capture-preflight.js';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'capture-preflight-'));
try{
 const dir=path.join(root,'private');fs.mkdirSync(dir);
 const snapshotPath=path.join(dir,'snapshot.json'),specPath=path.join(dir,'spec.json'),referencePath=path.join(root,'reference.json'),kickoffPath=path.join(dir,'kickoffs.csv');
 const now=Date.now(),stamp=new Date(now-30000).toISOString();
 fs.writeFileSync(snapshotPath,'{}');fs.writeFileSync(referencePath,'{}');fs.writeFileSync(kickoffPath,'season,week,kickoffAt,home_team,away_team\n2026,6,'+new Date(now+86400000).toISOString()+',NE,NYJ');
 fs.writeFileSync(specPath,JSON.stringify({season:2026,week:6,yahoo:{leagueKey:'470.l.244897'},sourceAudit:{passed:true,checks:[{pass:true}],generatedAt:stamp,leagueKey:'470.l.244897',week:6}}));
 const options={snapshotPath,specPath,root:dir,referencePath,kickoffPath,now,env:{FANTASYPROS_API_KEY:'fixture-key'}};
 const ok=preflightPregameCapture(options);assert.equal(ok.ready,true);assert.equal(ok.networkRequests,0);
 assert.equal(preflightPregameCapture({...options,env:{}}).ready,false);
 assert.equal(preflightPregameCapture({...options,kickoffPath:path.join(dir,'missing.csv')}).ready,false);
 fs.writeFileSync(kickoffPath,'season,week,kickoffAt,home_team,away_team\n2026,6,'+new Date(now-86400000).toISOString()+',NE,NYJ');
 const past=preflightPregameCapture(options);assert.equal(past.ready,false);assert.equal(past.checks.find(c=>c.name==='kickoff-week-future').pass,false);
 fs.writeFileSync(kickoffPath,'season,week,kickoffAt,home_team,away_team\n2026,7,'+new Date(now+86400000).toISOString()+',NE,NYJ');
 assert.equal(preflightPregameCapture(options).checks.find(c=>c.name==='kickoff-week-covered').pass,false);
 assert.equal(preflightPregameCapture({...options,snapshotPath:path.join(root,'outside.json')}).ready,false);
 console.log('pregame-capture-preflight-tests: all checks passed');
}finally{fs.rmSync(root,{recursive:true,force:true});}
