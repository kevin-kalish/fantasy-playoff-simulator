import fs from 'node:fs';
import path from 'node:path';
import {createYahooClient,discoverYahooNflLeagues} from '../src/data/yahoo-client.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';

const season=Number(process.env.SEASON||new Date().getFullYear());
const week=Number(process.env.WEEK||1);
const outPath=process.env.YAHOO_DIAGNOSTIC_OUT||`data/private/yahoo-live-shape-week-${week}.json`;
const redactKey=/token|secret|authorization|guid|email|url|logo|password|chat/i;
const scalar=v=>v==null?v:(typeof v==='string'&&v.length>160?`${v.slice(0,157)}...`:v);
function shape(node,depth=0){
 if(depth>18)return '[depth-limit]';
 if(Array.isArray(node))return {type:'array',length:node.length,samples:node.slice(0,4).map(x=>shape(x,depth+1))};
 if(!node||typeof node!=='object')return scalar(node);
 const out={};for(const [k,v] of Object.entries(node)){if(redactKey.test(k)){out[k]='[redacted]';continue}out[k]=shape(v,depth+1)}return out;
}
function findTeamKey(node){if(!node||typeof node!=='object')return'';if(Array.isArray(node)){for(const x of node){const r=findTeamKey(x);if(r)return r}return''}if(node.team_key)return String(node.team_key);for(const x of Object.values(node)){const r=findTeamKey(x);if(r)return r}return''}

let auth;try{auth=await resolveYahooAccessToken()}catch(error){console.error(`YAHOO AUTH ERROR: ${error.message}`);process.exit(1)}
const get=createYahooClient({accessToken:auth.accessToken});
let leagueKey=process.env.YAHOO_LEAGUE_KEY;
if(!leagueKey){const leagues=await discoverYahooNflLeagues(get,{season});const wanted=String(process.env.YAHOO_LEAGUE_ID||'244897');leagueKey=leagues.find(x=>String(x.leagueId)===wanted)?.leagueKey||leagues[0]?.leagueKey}
if(!leagueKey){console.error('YAHOO DIAGNOSTIC: no league found.');process.exit(1)}
const [settings,teams,standings,scoreboard]=await Promise.all([
 get(`league/${leagueKey}/settings`),
 get(`league/${leagueKey}/teams`),
 get(`league/${leagueKey}/standings`),
 get(`league/${leagueKey}/scoreboard;week=${week}`)
]);
const teamKey=findTeamKey(teams);
const roster=teamKey?await get(`team/${teamKey}/roster;week=${week}`):null;
const report={generatedAt:new Date().toISOString(),season,week,leagueKey,teamKey,settings:shape(settings?.fantasy_content),teams:shape(teams?.fantasy_content),standings:shape(standings?.fantasy_content),scoreboard:shape(scoreboard?.fantasy_content),roster:shape(roster?.fantasy_content)};
fs.mkdirSync(path.dirname(outPath),{recursive:true});fs.writeFileSync(outPath,JSON.stringify(report,null,2));
console.log(`YAHOO DIAGNOSTIC: wrote expanded safe structural payload to ${outPath}`);
console.log(`League ${leagueKey} | week ${week} | sample team ${teamKey||'not found'}`);
console.log('This version includes standings and deeper roster/scoreboard structures for parser hardening.');
