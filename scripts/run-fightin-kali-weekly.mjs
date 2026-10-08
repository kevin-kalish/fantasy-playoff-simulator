import fs from 'node:fs';
import {buildWeeklyRefreshPlan} from '../src/model/weekly-refresh-plan.js';
import {createYahooClient,discoverYahooNflLeagues} from '../src/data/yahoo-client.js';
import {loadYahooLeagueSnapshot} from '../src/data/yahoo-league.js';
import {fetchYahooCurrentWeek} from '../src/data/yahoo-current-week.js';
import {runYahooLeagueAudit} from '../src/data/yahoo-live-audit.js';
import {loadYahooWaiverPool,prescreenWaiverScenarios} from '../src/data/yahoo-waivers.js';
import {buildWaiverCandidatePool} from '../src/data/waiver-candidate-source.js';
import {resolveYahooAccessToken} from '../src/data/yahoo-auth-session.js';
import {applyFightinKaliConfig} from '../src/data/fightin-kali-snapshot.js';

const snapshotPath=process.argv[2]??'data/private/fightin-kali-current.json';
const weekArg=process.argv[3]?Number(process.argv[3]):undefined;
const focusTeamArg=process.argv[4]??process.env.FOCUS_TEAM_NAME;
const configPath='config/fightin-kali-2026.json';
const fail=m=>{console.error(`WEEKLY REFRESH: FAIL; ${m}`);process.exit(2)};
// A live API refresh can bootstrap the private snapshot; a stale file is not a prerequisite.
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
let snapshot=fs.existsSync(snapshotPath)?read(snapshotPath):null;const config=read(configPath);const runConfig=focusTeamArg?{...config,teamName:focusTeamArg,teamAliases:[focusTeamArg]}:config;
const slug=s=>String(s??'team').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
let yahooAuth;
try{yahooAuth=await resolveYahooAccessToken();}catch(error){yahooAuth={accessToken:null,source:'unavailable',reason:error.message};}
let get=null,leagueKey=null,sourceAudit=null;
if(yahooAuth.accessToken){
 try{
  get=createYahooClient({accessToken:yahooAuth.accessToken});
  leagueKey=process.env.YAHOO_LEAGUE_KEY??snapshot?.source?.leagueKey??config.leagueKey;
  if(!leagueKey){
   const leagues=await discoverYahooNflLeagues(get,{season:config.season});
   const configuredLeagueId=String(process.env.YAHOO_LEAGUE_ID??config.leagueId??'');
   const matching=leagues.filter(x=>String(x.leagueId??x.leagueKey?.split('.').at(-1))===configuredLeagueId);
   if(matching.length===1)leagueKey=matching[0].leagueKey;else if(leagues.length===1)leagueKey=leagues[0].leagueKey;else throw new Error(`Could not uniquely discover Yahoo league ${configuredLeagueId}.`);
  }
  const liveWeek=weekArg??(process.env.WEEK?Number(process.env.WEEK):await fetchYahooCurrentWeek(get,leagueKey));
  if(!Number.isInteger(liveWeek)||liveWeek<1||liveWeek>18)throw new Error('Invalid requested Yahoo fantasy week.');
  const referencePath=process.env.YAHOO_REFERENCE??'fixtures/yahoo-reference-2026-week3.json';
  if(fs.existsSync(referencePath)){
   const reference=read(referencePath);
   const auditPath=`data/private/yahoo-audit-${leagueKey.replace(/[^a-z0-9._-]/gi,'_')}-week-${liveWeek}.json`;
   const audited=await runYahooLeagueAudit(get,{leagueKey,season:config.season,week:liveWeek,reference,reportPath:auditPath});
   sourceAudit={passed:audited.report.passed,failures:audited.report.failures,checks:audited.report.checks,generatedAt:audited.report.generatedAt,leagueKey,week:liveWeek};
   if(!sourceAudit.passed)throw new Error(`Yahoo source audit failed (${sourceAudit.failures.length} reconciliation checks).`);
   snapshot=applyFightinKaliConfig(audited.league,config);
   console.error(`YAHOO AUDIT: PASS; ${sourceAudit.checks.length} source reconciliation checks.`);
  }else{
   snapshot=applyFightinKaliConfig(await loadYahooLeagueSnapshot(get,{leagueKey,season:config.season,week:liveWeek}),config);
   console.error(`YAHOO AUDIT: unavailable; reference not found: ${referencePath}. Simulation trust gate will block Yahoo results.`);
  }
  snapshot.source={...snapshot.source,leagueKey,currentWeek:liveWeek};snapshot.currentWeek=liveWeek;
  // Persist only after the live reconciliation gate passes.
  if(!sourceAudit?.passed)throw new Error('Yahoo reference audit is unavailable or did not pass.');
  fs.mkdirSync('data/private',{recursive:true});fs.writeFileSync(snapshotPath,JSON.stringify(snapshot,null,2)+'\n');
  console.error(`YAHOO STATE: refreshed ${snapshot.teams.length} teams and ${snapshot.schedule.length} remaining schedule weeks for week ${liveWeek}.`);
 }catch(error){fail(`Yahoo API refresh or reconciliation failed: ${error.message}. Refusing to simulate stale league data.`);}
}
if(!yahooAuth.accessToken)fail(`Yahoo authentication unavailable: ${yahooAuth.reason??'no access token'}. Refusing to simulate stale league data.`);
if(!sourceAudit?.passed)fail('Live Yahoo reconciliation is required before simulation; configure YAHOO_REFERENCE and rerun.');
if(!snapshot)fail('Yahoo API did not produce a league snapshot.');
let plan;try{const outputPath=focusTeamArg?`data/private/${slug(focusTeamArg)}-week-${weekArg??Number(process.env.WEEK??snapshot.currentWeek??snapshot.source?.currentWeek??1)}-report.json`:undefined;plan=buildWeeklyRefreshPlan(snapshot,runConfig,{week:weekArg,outputPath});}catch(e){fail(e.message)}
if(sourceAudit)plan.sourceAudit=sourceAudit;
plan.tradeDiscovery={enabled:true,maxPartners:Number(process.env.TRADE_MAX_PARTNERS??9),maxPlayersPerTeam:Number(process.env.TRADE_MAX_PLAYERS_PER_TEAM??7),maxScenarios:Number(process.env.TRADE_MAX_SCENARIOS??24),valueTolerance:Number(process.env.TRADE_VALUE_TOLERANCE??.35),includePackages:process.env.TRADE_INCLUDE_PACKAGES!=='false'};
plan.scanAvailability={startSit:{status:'available'},waivers:{status:'unavailable',reason:'Yahoo waiver source not attempted.'},trades:{status:'not-configured',reason:'Trade discovery runs after projections are loaded.'}};
if(leagueKey)plan.yahoo={leagueKey,leagueKeySource:'live-state'};
if(get&&leagueKey){
 try{
  const raw=await loadYahooWaiverPool(get,{leagueKey,limit:Number(process.env.WAIVER_CANDIDATE_LIMIT??30)});
  const pool=buildWaiverCandidatePool(raw,{source:'yahoo',limit:Number(process.env.WAIVER_CANDIDATE_LIMIT??30)});
  const team=snapshot.teams.find(t=>String(t.id)===String(plan.teamId));
  const screen=prescreenWaiverScenarios(team,pool.candidates,{candidateLimit:Number(process.env.WAIVER_SCREEN_LIMIT??12),dropsPerCandidate:Number(process.env.WAIVER_DROPS_PER_CANDIDATE??3)});
  const dropPlayerIds=[...new Set(Object.values(screen.dropMap).flat())],scenarioCount=Object.values(screen.dropMap).reduce((n,ids)=>n+ids.length,0);
  plan.scanAvailability.waivers={status:'available',source:pool.source,candidateCount:pool.candidates.length,screenedCandidateCount:screen.candidates.length,scenarioCount};
  if(screen.candidates.length&&dropPlayerIds.length)plan.waivers={source:pool.source,candidates:screen.candidates,replacementCandidates:pool.candidates,dropPlayerIds,dropMap:screen.dropMap,weeks:plan.weeks,prescreen:{...screen,sourceDiagnostics:pool.diagnostics}};
 }catch(error){plan.scanAvailability.waivers={status:'unavailable',reason:error.message};console.error(`WAIVERS: unavailable; ${error.message}`);}
}else plan.scanAvailability.waivers={status:'unavailable',reason:yahooAuth.reason??'Yahoo live state unavailable.'};
fs.mkdirSync('data/private',{recursive:true});const specPath=focusTeamArg?`data/private/${slug(focusTeamArg)}-week-${plan.week}-spec.json`:`data/private/fightin-kali-week-${plan.week}-spec.json`;fs.writeFileSync(specPath,JSON.stringify(plan,null,2)+'\n');
console.error(`WEEKLY REFRESH: season ${plan.season} week ${plan.week}; team ${plan.teamId}; modeled weeks ${plan.weeks.join(',')}.`);
const originalArgv=process.argv;try{process.argv=[process.execPath,'scripts/run-weekly-intelligence.mjs',snapshotPath,specPath];await import('./run-weekly-intelligence.mjs');}catch(error){fail(error?.message??String(error))}finally{process.argv=originalArgv}
