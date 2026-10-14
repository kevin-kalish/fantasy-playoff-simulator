import fs from 'node:fs';
import path from 'node:path';
import {captureFreshProjectionArchive} from '../src/data/fresh-projection-capture.js';
import {readArchiveDirectory} from '../src/data/historical-projection-importer.js';
import {executePregameCapture} from '../src/data/pregame-capture-workflow.js';
import {preflightPregameCapture} from '../src/data/pregame-capture-preflight.js';
import {createYahooClient} from '../src/data/yahoo-client.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';
import {runYahooLeagueAudit} from '../src/data/yahoo-live-audit.js';
const [snapshot,specFile]=process.argv.slice(2);
if(!snapshot||!specFile){console.error('Usage: npm run calibration:capture -- <private-snapshot.json> <private-weekly-spec.json>');process.exit(2);}
try{
 const privateRoot=path.resolve('data/private')+path.sep;
 for(const file of [snapshot,specFile]){
  if(!path.resolve(file).startsWith(privateRoot))throw new Error('Snapshot and spec must be under data/private');
  if(!fs.existsSync(file))throw new Error('Missing input: '+file);
 }
 const preflight=preflightPregameCapture({snapshotPath:snapshot,specPath:specFile});
 if(!preflight.ready)throw new Error('Offline preflight blocked live capture: '+preflight.checks.filter(c=>!c.pass).map(c=>c.name+' ('+c.detail+')').join('; '));
 const spec=JSON.parse(fs.readFileSync(specFile,'utf8'));
 const saved=JSON.parse(fs.readFileSync(snapshot,'utf8'));
 const referencePath=process.env.YAHOO_REFERENCE??'fixtures/yahoo-reference-2026-week3.json';
 const dir='data/private/projection-archives';
 const before=new Set(readArchiveDirectory(dir).map(a=>path.basename(a.path)));
 const result=await executePregameCapture({
  spec,snapshot:saved,snapshotPath:snapshot,
  readLiveYahoo:async expected=>{
   if(!fs.existsSync(referencePath))throw new Error('Yahoo audit reference is missing: '+referencePath);
   const yahooAuth=await resolveYahooAccessToken();
   if(!yahooAuth.accessToken)throw new Error('Live Yahoo authentication is required for capture');
   return runYahooLeagueAudit(createYahooClient({accessToken:yahooAuth.accessToken}),{leagueKey:expected.leagueKey,season:expected.season,week:expected.week,reference:JSON.parse(fs.readFileSync(referencePath,'utf8'))});
  },
  runProjectionJob:async()=>{
   if(!process.env.FANTASYPROS_API_KEY&&!process.env.JERRYGM_API_KEY)throw new Error('A live provider API key is required');
   const rosterNames=(saved.teams??[]).flatMap(t=>t.roster??t.lineup??[]).map(p=>String(p?.name??'').trim()).filter(Boolean);
   const result=await captureFreshProjectionArchive({spec,projectionNames:[...new Set(rosterNames)]});
   console.error('PROJECTION CAPTURE: '+result.freshProviderRows+'/'+result.rows+' fresh provider rows; '+result.file);
  },
  readNewArchives:async()=>readArchiveDirectory(dir).filter(a=>!before.has(path.basename(a.path)))
 });
 console.error('PREGAME CAPTURE: fresh live Yahoo audit passed; '+result.liveAuditChecks+' checks.');
 const {freshProviderRows:verified,pregameKickoffVerifiedRows:kickoffVerified}=result.eligibility;
 const summary={capturedAt:result.capturedAt,archive:path.basename(result.archive),...result.eligibility,season:Number(spec.season),weeks:spec.weeks??[spec.week]};
 fs.writeFileSync('data/private/last-pregame-capture.json',JSON.stringify(summary,null,2)+'\n');
 console.log('PREGAME CAPTURE: '+verified+'/'+result.eligibility.rows+' fresh-provider rows; private archive '+summary.archive);
 if(!verified){console.error('PREGAME CAPTURE: no live-provider forecasts; not calibration eligible');process.exitCode=2;}
 else if(!kickoffVerified){console.error('PREGAME CAPTURE: no kickoff-verified pregame forecasts yet; run kickoff enrichment before calibration');process.exitCode=2;}
}catch(error){console.error('PREGAME CAPTURE: FAIL; '+error.message);process.exitCode=1;}
