import fs from 'node:fs';
import {createYahooClient,discoverYahooNflLeagues} from '../src/data/yahoo-client.js';
import {runYahooLeagueAudit,formatYahooAuditReport} from '../src/data/yahoo-live-audit.js';

const token=process.env.YAHOO_ACCESS_TOKEN;
if(!token){console.error('YAHOO_ACCESS_TOKEN is required.');process.exit(1)}
const season=Number(process.env.SEASON||new Date().getFullYear());
const week=Number(process.env.WEEK||1);
const referencePath=process.env.YAHOO_REFERENCE||'fixtures/yahoo-reference-2026-week3.json';
if(!fs.existsSync(referencePath)){console.error(`Yahoo reference not found: ${referencePath}`);process.exit(1)}
const reference=JSON.parse(fs.readFileSync(referencePath,'utf8'));
const get=createYahooClient({accessToken:token});
let leagueKey=process.env.YAHOO_LEAGUE_KEY;
if(!leagueKey){const leagues=await discoverYahooNflLeagues(get,{season});if(leagues.length!==1){console.error(JSON.stringify({message:'Set YAHOO_LEAGUE_KEY to one of these leagues.',leagues},null,2));process.exit(leagues.length?2:1)}leagueKey=leagues[0].leagueKey;}
const reportPath=process.env.AUDIT_OUT||`data/private/yahoo-audit-${leagueKey.replace(/[^a-z0-9._-]/gi,'_')}-week-${week}.json`;
try{
 const {report}=await runYahooLeagueAudit(get,{leagueKey,season,week,reference,reportPath});
 console.log(formatYahooAuditReport(report));console.log(`Report: ${reportPath}`);
 if(!report.passed)process.exitCode=3;
}catch(error){console.error(`YAHOO AUDIT ERROR: ${error.message}`);process.exitCode=1}
