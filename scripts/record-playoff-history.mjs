// Record an explicitly labeled end-of-week playoff forecast locally.
// No provider calls; private snapshots are never published.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {weeklyReportToDashboardV1} from '../src/ui/live-dashboard-export.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const privateRoot=path.join(root,'data/private');
const withinPrivate=p=>p.startsWith(privateRoot+path.sep);
const input=path.resolve(process.argv[2]??'');
const week=Number(process.argv[3]);
const result=process.argv[4]?.toUpperCase()??null;
if(!process.argv[2]||!withinPrivate(input)||!Number.isInteger(week)||week<0|| (result!=null&&!['W','L','T'].includes(result)))throw new Error('Usage: node scripts/record-playoff-history.mjs data/private/<weekly-report.json> <completed-week-number> [W|L|T]');
const document=JSON.parse(fs.readFileSync(input,'utf8'));
if(document.readiness?.ready!==true)throw new Error('History capture requires readiness.ready=true');
const payload=weeklyReportToDashboardV1(document.report??document);
const teamId=payload.league.userTeamId;
const probability=payload.teams.find(t=>t.id===teamId).playoffProbability;
const output=path.join(privateRoot,'playoff-probability-history.json');
const previous=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')):{teamId,history:[]};
if(previous.teamId!==teamId)throw new Error('History belongs to another team; do not mix league histories');
if(previous.history.some(p=>p.week===week))throw new Error('Week already recorded; history is immutable to avoid silent backfills');
const history=[...previous.history,{week,playoffProbability:probability,result,generatedAt:payload.generatedAt}].sort((a,b)=>a.week-b.week);
fs.mkdirSync(privateRoot,{recursive:true});
fs.writeFileSync(output,JSON.stringify({teamId,history},null,2)+'\n',{mode:0o600});
console.log('Recorded private playoff probability after week '+week+': '+(probability*100).toFixed(1)+'%');
