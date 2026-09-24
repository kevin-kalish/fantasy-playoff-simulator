import fs from 'node:fs';
import path from 'node:path';
import {createYahooClient,discoverYahooNflLeagues} from '../src/data/yahoo-client.js';
import {loadYahooLeagueSnapshot} from '../src/data/yahoo-league.js';
import {enrichLeagueSnapshotProjections} from '../src/data/projection-enrichment.js';

const token=process.env.YAHOO_ACCESS_TOKEN;
if(!token){console.error('YAHOO_ACCESS_TOKEN is required.');process.exit(1)}
const season=Number(process.env.SEASON||new Date().getFullYear());
const week=Number(process.env.WEEK||1);
const get=createYahooClient({accessToken:token});
let leagueKey=process.env.YAHOO_LEAGUE_KEY;
if(!leagueKey){
 const leagues=await discoverYahooNflLeagues(get,{season});
 if(leagues.length!==1){console.error(JSON.stringify({message:'Set YAHOO_LEAGUE_KEY to one of these leagues.',leagues},null,2));process.exit(leagues.length?2:1)}
 leagueKey=leagues[0].leagueKey;
}
let league=await loadYahooLeagueSnapshot(get,{leagueKey,season,week});
let projectionStats=null;
const projectionsPath=process.env.PROJECTIONS_JSON;
if(projectionsPath){
 const source=JSON.parse(fs.readFileSync(projectionsPath,'utf8'));
 const rows=Array.isArray(source)?source:source.rows||source.projections||[];
 const enriched=enrichLeagueSnapshotProjections(league,rows,{strict:process.env.STRICT_PROJECTIONS==='1'});
 league=enriched.league;projectionStats={matched:enriched.matched,total:enriched.total,matchRate:enriched.matchRate};
}
const out=process.env.OUT||`data/private/yahoo-${leagueKey.replace(/[^a-z0-9._-]/gi,'_')}-week-${week}.json`;
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(league,null,2));
console.log(JSON.stringify({out,leagueKey,season,week,teams:league.teams.length,scheduleWeeks:league.schedule.length,projectionStats},null,2));
