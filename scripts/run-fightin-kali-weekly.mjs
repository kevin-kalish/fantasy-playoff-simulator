import fs from 'node:fs';
import {buildWeeklyRefreshPlan} from '../src/model/weekly-refresh-plan.js';
import {createYahooClient} from '../src/data/yahoo-client.js';
import {loadYahooWaiverPool,candidateDropPlayerIds,prescreenWaiverScenarios} from '../src/data/yahoo-waivers.js';

const snapshotPath=process.argv[2]??'data/private/fightin-kali-current.json';
const weekArg=process.argv[3]?Number(process.argv[3]):undefined;
const configPath='config/fightin-kali-2026.json';
const fail=m=>{console.error(`WEEKLY REFRESH: FAIL; ${m}`);process.exit(2)};
if(!fs.existsSync(snapshotPath)) fail(`snapshot not found: ${snapshotPath}`);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),config=read(configPath);
let plan; try{plan=buildWeeklyRefreshPlan(snapshot,config,{week:weekArg});}catch(e){fail(e.message)}

if(process.env.YAHOO_ACCESS_TOKEN){
 try{
  const leagueKey=process.env.YAHOO_LEAGUE_KEY??snapshot.source?.leagueKey??config.leagueKey;
  if(!leagueKey)throw new Error('Yahoo league key is required.');
  const get=createYahooClient({accessToken:process.env.YAHOO_ACCESS_TOKEN});
  const raw=await loadYahooWaiverPool(get,{leagueKey,limit:Number(process.env.WAIVER_CANDIDATE_LIMIT??30)});
  const team=snapshot.teams.find(t=>String(t.id)===String(plan.teamId));
  const screen=prescreenWaiverScenarios(team,raw,{candidateLimit:Number(process.env.WAIVER_SCREEN_LIMIT??12),dropsPerCandidate:Number(process.env.WAIVER_DROPS_PER_CANDIDATE??3)});
  const dropPlayerIds=[...new Set(Object.values(screen.dropMap).flat())];
  if(screen.candidates.length&&dropPlayerIds.length){
   plan.waivers={candidates:screen.candidates,dropPlayerIds,weeks:plan.weeks,prescreen:screen};
   console.error(`WAIVERS: Yahoo pool; ${raw.length} available -> ${screen.candidates.length} screened candidates x ${dropPlayerIds.length} possible drops.`);
  }else console.error(`WAIVERS: no scenarios; ${raw.length} candidates, ${dropPlayerIds.length} possible drops.`);
 }catch(error){console.error(`WAIVERS: unavailable; ${error.message}; continuing without waiver recommendations.`);}
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
