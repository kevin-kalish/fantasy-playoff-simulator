import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
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
const run=spawnSync(process.execPath,['scripts/run-weekly-intelligence.mjs',snapshotPath,specPath],{stdio:'inherit',env:process.env});
if(run.error) fail(run.error.message);
process.exit(run.status??1);
