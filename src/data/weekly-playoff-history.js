// Private post-week snapshots, captured only from a trusted audited live Yahoo run.
// Forecast week N reflects completed games through N-1. No network requests.
import fs from 'node:fs';
import path from 'node:path';
import {weeklyReportToDashboardV1} from '../ui/live-dashboard-export.js';

export function captureCompletedWeekProbability({document,currentWeek,season,leagueKey,archivePath='data/private/playoff-probability-history.json',now=new Date()}){
 if(!Number.isInteger(currentWeek)||currentWeek<2||currentWeek>18)return {status:'skipped',reason:'No completed regular-season week to capture'};
 if(document?.readiness?.ready!==true)return {status:'skipped',reason:'Simulation readiness did not pass'};
 const report=document.report;
 if(!report?.trust?.trusted)return {status:'skipped',reason:'Untrusted weekly report'};
 if(!leagueKey||!Number.isInteger(Number(season)))return {status:'skipped',reason:'Missing live league identity'};
 const payload=weeklyReportToDashboardV1(report);
 const teamId=String(payload.league.userTeamId);
 const focus=payload.teams.find(t=>String(t.id)===teamId);
 if(!focus||typeof focus.playoffProbability!=='number'||!Number.isFinite(focus.playoffProbability))return {status:'skipped',reason:'No valid focus-team probability'};
 const generatedAt=Date.parse(payload.generatedAt);
 if(!Number.isFinite(generatedAt)||generatedAt>now.getTime()+300000||now.getTime()-generatedAt>10*24*60*60*1000)return {status:'skipped',reason:'Invalid report timestamp'};
 const week=currentWeek-1;
 const prior=fs.existsSync(archivePath)?JSON.parse(fs.readFileSync(archivePath,'utf8')):null;
 // Legacy archives lack season/league identifiers. Never silently mix them.
 if(prior&&(String(prior.teamId)!==teamId||Number(prior.season)!==Number(season)||String(prior.leagueKey)!==String(leagueKey)))return {status:'skipped',reason:'Existing history archive has different or unverified league/season identity'};
 const history=prior?.history??[];
 if(!Array.isArray(history))return {status:'skipped',reason:'Malformed history archive'};
 if(history.some(p=>p.week===week))return {status:'unchanged',week,reason:'Week already recorded; immutable'};
 if(history.some(p=>p.week>week))return {status:'skipped',reason:'Refusing out-of-order historical backfill'};
 const next={season:Number(season),leagueKey:String(leagueKey),teamId,history:[...history,{week,playoffProbability:focus.playoffProbability,result:null,generatedAt:payload.generatedAt}]};
 fs.mkdirSync(path.dirname(archivePath),{recursive:true});
 const temporary=archivePath+'.tmp-'+process.pid;
 try{fs.writeFileSync(temporary,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});fs.renameSync(temporary,archivePath);}finally{if(fs.existsSync(temporary))fs.rmSync(temporary,{force:true});}
 return {status:'recorded',week,probability:focus.playoffProbability};
}
