import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readArchiveDirectory} from '../src/data/historical-projection-importer.js';
import {validatePregameCaptureInputs} from '../src/data/pregame-capture-validation.js';
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
 const spec=JSON.parse(fs.readFileSync(specFile,'utf8'));
 const expected=validatePregameCaptureInputs(spec,snapshot);
 const referencePath=process.env.YAHOO_REFERENCE??'fixtures/yahoo-reference-2026-week3.json';
 if(!fs.existsSync(referencePath))throw new Error('Yahoo audit reference is missing: '+referencePath);
 const yahooAuth=await resolveYahooAccessToken();
 if(!yahooAuth.accessToken)throw new Error('Live Yahoo authentication is required for capture');
 const live=await runYahooLeagueAudit(createYahooClient({accessToken:yahooAuth.accessToken}),{leagueKey:expected.leagueKey,season:expected.season,week:expected.week,reference:JSON.parse(fs.readFileSync(referencePath,'utf8'))});
 if(!live.report.passed)throw new Error('Fresh live Yahoo reconciliation failed');
 const saved=JSON.parse(fs.readFileSync(snapshot,'utf8'));
 const liveIds=(live.league.teams??[]).map(t=>String(t.id)).sort();
 const savedIds=(saved.teams??[]).map(t=>String(t.id)).sort();
 if(JSON.stringify(liveIds)!==JSON.stringify(savedIds))throw new Error('Snapshot team IDs differ from fresh Yahoo audit');
 console.error('PREGAME CAPTURE: fresh live Yahoo audit passed; '+live.report.checks.length+' checks.');
 if(spec.projectionFixturePath)throw new Error('Fixture projections are not eligible for archival capture');
 if(!process.env.FANTASYPROS_API_KEY&&!process.env.JERRYGM_API_KEY)throw new Error('A live FantasyPros or JerryGM API key is required; cache alone is insufficient');
 const dir='data/private/projection-archives';
 const before=new Set(readArchiveDirectory(dir).map(a=>path.basename(a.path)));
 const run=spawnSync(process.execPath,['scripts/run-weekly-intelligence.mjs',snapshot,specFile],{encoding:'utf8',timeout:240000,env:{...process.env,PROJECTION_REFRESH:'true',PROJECTION_ARCHIVE:'true'}});
 if(run.stdout)process.stdout.write(run.stdout.slice(-12000));
 if(run.stderr)process.stderr.write(run.stderr.slice(-12000));
 if(run.status!==0)throw new Error('Weekly intelligence failed (exit '+String(run.status??'unknown')+')');
 const fresh=readArchiveDirectory(dir).filter(a=>!before.has(path.basename(a.path)));
 if(fresh.length!==1)throw new Error('Expected exactly one new immutable archive; found '+fresh.length);
 const rows=fresh[0].data.rows??[];
 const verified=rows.filter(r=>r.forecastProvenance?.kind==='fresh-provider-response').length;
 const kickoffVerified=rows.filter(r=>r.forecastProvenance?.kind==='fresh-provider-response'&&Number.isFinite(Date.parse(r.kickoffAt??''))&&Date.parse(r.projectedAt)<Date.parse(r.kickoffAt)&&Date.parse(fresh[0].capturedAt)<Date.parse(r.kickoffAt)).length;
 const summary={capturedAt:fresh[0].capturedAt,archive:path.basename(fresh[0].path),rows:rows.length,freshProviderRows:verified,pregameKickoffVerifiedRows:kickoffVerified,unverifiedRows:rows.length-verified,season:Number(spec.season),weeks:spec.weeks??[spec.week]};
 fs.writeFileSync('data/private/last-pregame-capture.json',JSON.stringify(summary,null,2)+'\n');
 console.log('PREGAME CAPTURE: '+verified+'/'+rows.length+' fresh-provider rows; private archive '+summary.archive);
 if(!verified){console.error('PREGAME CAPTURE: no live-provider forecasts; not calibration eligible');process.exitCode=2;}
 else if(!kickoffVerified){console.error('PREGAME CAPTURE: no kickoff-verified pregame forecasts yet; run kickoff enrichment before calibration');process.exitCode=2;}
}catch(error){console.error('PREGAME CAPTURE: FAIL; '+error.message);process.exitCode=1;}
