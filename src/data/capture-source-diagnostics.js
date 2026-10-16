import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseKickoffScheduleCSV} from './projection-kickoff-enrichment.js';
const key=value=>createHash('sha256').update('https://api.jerrygm.com/api/ext/v1:'+value).digest('hex');
export function diagnoseCaptureSources({env=process.env,now=Date.now(),quotaPath='data/private/jerrygm-quota-state.json',schedulePath='data/private/nfl-kickoffs.csv',season=2026,week=6}={}){
 const providers={fantasypros:{configured:Boolean(env.FANTASYPROS_API_KEY),availability:'unverified'},jerrygm:{configured:Boolean(env.JERRYGM_API_KEY),availability:'unverified',blockedUntil:null}};
 if(providers.jerrygm.configured&&fs.existsSync(quotaPath)){
  try{const state=JSON.parse(fs.readFileSync(quotaPath,'utf8'));const until=Number(state[key(env.JERRYGM_API_KEY)]);if(Number.isFinite(until)&&until>now){providers.jerrygm.blockedUntil=new Date(until).toISOString();providers.jerrygm.availability='locally-blocked';}}
  catch{providers.jerrygm.availability='quota-state-unreadable';}
 }
 const schedule={exists:fs.existsSync(schedulePath),weekGames:0,uniqueTeams:0,invalidKickoffs:0,conflicts:0,allFuture:false,sourceVerified:false};
 if(schedule.exists){
  try{
   const rows=parseKickoffScheduleCSV(fs.readFileSync(schedulePath,'utf8')).filter(x=>Number(x.season)===Number(season)&&Number(x.week)===Number(week));
   schedule.weekGames=rows.length;
   const teams=new Map();
   for(const row of rows){
    const kickoff=Date.parse(row.kickoffAt??row.gameday_utc??row.kickoff_utc??'');
    if(!Number.isFinite(kickoff))schedule.invalidKickoffs++;
    for(const t of [row.home_team??row.homeTeam,row.away_team??row.awayTeam]){
     const name=String(t??'').trim().toUpperCase();
     if(!name)continue;
     if(teams.has(name))schedule.conflicts++;
     teams.set(name,kickoff);
    }
   }
   schedule.uniqueTeams=teams.size;
   schedule.allFuture=rows.length>0&&schedule.invalidKickoffs===0&&[...teams.values()].every(t=>t>now);
  }catch{schedule.invalidKickoffs++;}
 }
 const providerCandidate=providers.fantasypros.configured||providers.jerrygm.configured&&providers.jerrygm.availability==='unverified';
 return {mode:'offline',networkRequests:0,season:Number(season),week:Number(week),providers,schedule,readyForLiveAttempt:providerCandidate&&schedule.weekGames>0&&schedule.invalidKickoffs===0&&schedule.conflicts===0&&schedule.allFuture,notes:['Configured credentials do not establish a working provider or remaining quota.','Local kickoff CSV has not been independently authenticated.','A fresh Yahoo audit is separately required immediately before capture.']};
}
