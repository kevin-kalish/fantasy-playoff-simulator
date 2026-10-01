import fs from 'node:fs';
import {buildWeeklyRefreshPlan} from '../src/model/weekly-refresh-plan.js';
import {createYahooClient} from '../src/data/yahoo-client.js';
import {loadYahooWaiverPool,candidateDropPlayerIds} from '../src/data/yahoo-waivers.js';
import {buildWaiverCandidatePool} from '../src/data/waiver-candidate-source.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';

const snapshotPath=process.argv[2]??'data/private/fightin-kali-current.json';
const weekArg=process.argv[3]?Number(process.argv[3]):undefined;
const configPath='config/fightin-kali-2026.json';
const fail=m=>{console.error(`WEEKLY REFRESH: FAIL; ${m}`);process.exit(2)};
if(!fs.existsSync(snapshotPath)) fail(`snapshot not found: ${snapshotPath}`);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),config=read(configPath);
let plan; try{plan=buildWeeklyRefreshPlan(snapshot,config,{week:weekArg});}catch(e){fail(e.message)}
plan.scanAvailability={startSit:{status:'available'},waivers:{status:'unavailable',reason:'Yahoo waiver source not attempted.'},trades:{status:(plan.trades?.length?'available':'not-configured')}};

let yahooAuth;
try{yahooAuth=await resolveYahooAccessToken();}
catch(error){yahooAuth={accessToken:null,source:'unavailable',reason:error.message};}
if(yahooAuth.accessToken){
 try{
  if(yahooAuth.source==='refresh')console.error(`YAHOO AUTH: access token refreshed${yahooAuth.expiresIn?` (expires in ${yahooAuth.expiresIn}s)`:''}.`);
  const leagueKey=process.env.YAHOO_LEAGUE_KEY??snapshot.source?.leagueKey??config.leagueKey;
  if(!leagueKey)throw new Error('Yahoo league key is required.');
  const get=createYahooClient({accessToken:yahooAuth.accessToken});
  const raw=await loadYahooWaiverPool(get,{leagueKey,limit:Number(process.env.WAIVER_CANDIDATE_LIMIT??30)});
  const pool=buildWaiverCandidatePool(raw,{source:'yahoo',limit:Number(process.env.WAIVER_CANDIDATE_LIMIT??30)});
  const team=snapshot.teams.find(t=>String(t.id)===String(plan.teamId));
  if(!team)throw new Error(`Configured team not found for waiver scan: ${plan.teamId}`);
  const dropPlayerIds=candidateDropPlayerIds(team,{limit:Number(process.env.WAIVER_DROP_LIMIT??8)});
  const d=pool.diagnostics;
  const sourceSummary=`${d.inputCount} input -> ${d.candidateCount} normalized; ${d.invalidCount} invalid, ${d.duplicateCount} duplicate, ${d.truncatedCount} beyond limit ${d.limit}`;
  plan.scanAvailability.waivers={status:'available',source:pool.source,candidateCount:pool.candidates.length,dropCandidateCount:dropPlayerIds.length};
  if(pool.candidates.length&&dropPlayerIds.length){
   // Keep the full Yahoo candidate set here.  Projection-aware screening happens later,
   // after the weekly projection provider has loaded, so Yahoo players are not ranked on
   // missing/zero projections before the model has usable information.
   plan.waivers={source:pool.source,candidates:pool.candidates,dropPlayerIds,weeks:plan.weeks};
   console.error(`WAIVERS: ${pool.source} pool; ${sourceSummary}; ${pool.candidates.length} candidates / ${dropPlayerIds.length} possible drops; projection screening deferred.`);
  }else console.error(`WAIVERS: no scenarios; ${sourceSummary}; ${pool.candidates.length} candidates, ${dropPlayerIds.length} possible drops.`);
 }catch(error){plan.scanAvailability.waivers={status:'unavailable',reason:error.message};console.error(`WAIVERS: unavailable; ${error.message}; continuing without waiver recommendations.`);}
}else{
 plan.scanAvailability.waivers={status:'unavailable',reason:yahooAuth.reason};
 console.error(`WAIVERS: ${yahooAuth.reason} Waiver scan skipped.`);
}

fs.mkdirSync('data/private',{recursive:true});
const specPath=`data/private/fightin-kali-week-${plan.week}-spec.json`;
fs.writeFileSync(specPath,JSON.stringify(plan,null,2)+'\n');
console.error(`WEEKLY REFRESH: season ${plan.season} week ${plan.week}; team ${plan.teamId}; modeled weeks ${plan.weeks.join(',')}.`);

// Import the weekly command in-process rather than spawning a second Node process.
// This preserves its exit code while avoiding a Windows/libuv shutdown assertion seen
// after expected provider failures (for example, a FantasyPros HTTP 403).
const originalArgv=process.argv;
try{
 process.argv=[process.execPath,'scripts/run-weekly-intelligence.mjs',snapshotPath,specPath];
 await import('./run-weekly-intelligence.mjs');
} catch(error) {
 fail(error?.message??String(error));
} finally {
 process.argv=originalArgv;
}
