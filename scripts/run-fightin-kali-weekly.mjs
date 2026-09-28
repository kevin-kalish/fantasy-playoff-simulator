import fs from 'node:fs';
import {buildWeeklyRefreshPlan} from '../src/model/weekly-refresh-plan.js';

const snapshotPath=process.argv[2]??'data/private/fightin-kali-current.json';
const weekArg=process.argv[3]?Number(process.argv[3]):undefined;
const configPath='config/fightin-kali-2026.json';
const fail=m=>{console.error(`WEEKLY REFRESH: FAIL; ${m}`);process.exit(2)};
if(!fs.existsSync(snapshotPath)) fail(`snapshot not found: ${snapshotPath}`);
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),config=read(configPath);
let plan; try{plan=buildWeeklyRefreshPlan(snapshot,config,{week:weekArg});}catch(e){fail(e.message)}
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
