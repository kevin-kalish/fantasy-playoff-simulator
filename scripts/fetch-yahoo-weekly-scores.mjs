import fs from 'node:fs';
import path from 'node:path';
import {createYahooClient} from '../src/data/yahoo-client.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';
import {extractYahooRosterWeeklyScores} from '../src/data/yahoo-weekly-player-scores.js';
const season=Number(process.argv[2]??2026),start=Number(process.argv[3]??1),end=Number(process.argv[4]??5);
const config=JSON.parse(fs.readFileSync('config/fightin-kali-2026.json','utf8'));
const leagueKey=process.env.YAHOO_LEAGUE_KEY??config.leagueKey;
if(!leagueKey)throw new Error('Yahoo league key not configured');
if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end>18||end<start)throw new Error('Invalid completed week range');
const auth=await resolveYahooAccessToken();
if(!auth.accessToken)throw new Error('Yahoo authentication unavailable');
const get=createYahooClient({accessToken:auth.accessToken});
const teams=await get(`league/${leagueKey}/teams`);
function collectKeys(node,found=new Set()){
 if(!node||typeof node!=='object')return found;
 if(Array.isArray(node)){for(const v of node)collectKeys(v,found);return found;}
 if(node.team_key&&String(node.team_key).startsWith(leagueKey+'.t.'))found.add(String(node.team_key));
 for(const v of Object.values(node))collectKeys(v,found);
 return found;
}
const teamKeys=[...collectKeys(teams?.fantasy_content)].sort();
if(!teamKeys.length)throw new Error('No Yahoo fantasy team keys found');
const rows=[],rejected=[],failures=[];
for(let week=start;week<=end;week++){
 for(const teamKey of teamKeys){
  try{
   const response=await get(`team/${teamKey}/roster;week=${week}/players/stats;type=week;week=${week}`);
   const extracted=extractYahooRosterWeeklyScores(response,{season,week,teamKey});
   rows.push(...extracted.rows);rejected.push(...extracted.rejected.map(r=>({...r,week,teamKey})));
  }catch(e){failures.push({week,teamKey,error:e.message.slice(0,300)});}
 }
}
const byId=new Map(),duplicates=[];
for(const r of rows){const k=[r.season,r.week,r.playerId].join('|');if(byId.has(k)){duplicates.push(k);continue;}byId.set(k,r);}
const output='data/private/yahoo-player-actuals.json';
const report={source:'yahoo-weekly-roster-player-points',season,weekRange:[start,end],capturedAt:new Date().toISOString(),teamCount:teamKeys.length,rows:[...byId.values()],rejectedCount:rejected.length,failures,duplicateCount:duplicates.length,notes:'Rostered players only; no nflverse ID equivalence implied. Do not use for calibration until independently reconciled.'};
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(`YAHOO WEEKLY SCORES: ${report.rows.length} unique rows; ${report.rejectedCount} rejected; ${failures.length} request failures; ${duplicates.length} duplicates; ${teamKeys.length} teams.`);
console.log('YAHOO WEEKLY SCORES: private output '+output);
if(!report.rows.length||failures.length)process.exitCode=2;
