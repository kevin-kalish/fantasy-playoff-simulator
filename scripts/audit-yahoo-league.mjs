import fs from 'node:fs';
import {createYahooClient,discoverYahooNflLeagues} from '../src/data/yahoo-client.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';
import {runYahooLeagueAudit,formatYahooAuditReport} from '../src/data/yahoo-live-audit.js';

let yahooAuth;
try{yahooAuth=await resolveYahooAccessToken();}
catch(error){console.error(`YAHOO AUTH ERROR: ${error.message}`);process.exit(1)}
if(!yahooAuth.accessToken){console.error(yahooAuth.reason??'Yahoo access token is unavailable.');process.exit(1)}
if(yahooAuth.source==='refresh')console.error(`YAHOO AUTH: access token refreshed${yahooAuth.expiresIn?` (expires in ${yahooAuth.expiresIn}s)`:''}.`);
const season=Number(process.env.SEASON||new Date().getFullYear());
const week=Number(process.env.WEEK||1);
const referencePath=process.env.YAHOO_REFERENCE||'fixtures/yahoo-reference-2026-week3.json';
if(!fs.existsSync(referencePath)){console.error(`Yahoo reference not found: ${referencePath}`);process.exit(1)}
const reference=JSON.parse(fs.readFileSync(referencePath,'utf8'));
const get=createYahooClient({accessToken:yahooAuth.accessToken});
let leagueKey=process.env.YAHOO_LEAGUE_KEY;
if(!leagueKey){
 try{
  const leagues=await discoverYahooNflLeagues(get,{season});
  const configuredLeagueId=String(process.env.YAHOO_LEAGUE_ID??reference?.league?.leagueId??reference?.leagueId??'244897');
  const matching=leagues.filter(league=>String(league.leagueId??league.league_id??league.leagueKey?.split('.').at(-1))===configuredLeagueId);
  if(matching.length===1){
   leagueKey=matching[0].leagueKey;
   console.error(`YAHOO LEAGUE: discovered ${leagueKey} for league ID ${configuredLeagueId}.`);
  }else if(leagues.length===1){
   leagueKey=leagues[0].leagueKey;
   console.error(`YAHOO LEAGUE: discovered ${leagueKey}.`);
  }else{
   console.error(JSON.stringify({message:'Set YAHOO_LEAGUE_KEY to one of these leagues.',configuredLeagueId,leagues},null,2));
   process.exitCode=leagues.length?2:1;
  }
 }catch(error){
  console.error(`YAHOO LEAGUE DISCOVERY ERROR: ${error.message}`);
  console.error('If OAuth refresh succeeded but Yahoo returned HTTP 403, the app is authenticated but Fantasy Sports API entitlement is not active yet.');
  process.exitCode=1;
 }
}
if(leagueKey){
 if(process.env.YAHOO_DEBUG_ROSTER==='1'){
  try{
   const teamsJson=await get(`league/${leagueKey}/teams`);
   const text=JSON.stringify(teamsJson);
   const ownedMatch=text.match(/"team_key":"([^"]+)"[^]*?"is_owned_by_current_login":1/);
   const teamKey=ownedMatch?.[1]||`${leagueKey}.t.1`;
   const rosterJson=await get(`team/${teamKey}/roster;week=${week}`);
   const summarize=(node,depth=0)=>{
    if(depth>7)return '[max-depth]';
    if(Array.isArray(node))return {type:'array',length:node.length,items:node.slice(0,2).map(x=>summarize(x,depth+1))};
    if(node&&typeof node==='object'){
     const out={};
     for(const [k,v] of Object.entries(node))out[k]=summarize(v,depth+1);
     return out;
    }
    return node;
   };
   console.error(`YAHOO ROSTER DEBUG: ${teamKey} week ${week}`);
   console.error(JSON.stringify(summarize(rosterJson),null,2));
  }catch(error){console.error(`YAHOO ROSTER DEBUG ERROR: ${error.message}`)}
 }
 const reportPath=process.env.AUDIT_OUT||`data/private/yahoo-audit-${leagueKey.replace(/[^a-z0-9._-]/gi,'_')}-week-${week}.json`;
 try{
  const {report}=await runYahooLeagueAudit(get,{leagueKey,season,week,reference,reportPath});
  console.log(formatYahooAuditReport(report));console.log(`Report: ${reportPath}`);
  if(!report.passed)process.exitCode=3;
 }catch(error){console.error(`YAHOO AUDIT ERROR: ${error.message}`);process.exitCode=1}
}
