import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {assessSimulationReadiness} from '../src/model/simulation-readiness.js';
import {buildLeagueIntelligenceReport} from '../src/model/league-intelligence-report.js';
import {formatWeeklyIntelligence} from '../src/model/weekly-intelligence-format.js';
import {simulationFingerprint} from '../src/model/simulation-fingerprint.js';
import {discoverTradeCandidates} from '../src/model/trade-candidate-source.js';
import {loadWeeklyProjectionHorizon} from '../src/data/weekly-projection-provider.js';
import {JerryGMClient,normalizeJerryGMSeasonProjections} from '../src/data/jerrygm.js';

const [snapshotPath,specPath]=process.argv.slice(2);
if(!snapshotPath||!specPath){console.error('Usage: npm run intelligence:weekly -- <league-snapshot.json> <weekly-spec.json>');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),spec=read(specPath);
const season=Number(spec.season??snapshot.source?.season),week=Number(spec.week);
if(!season||!week||!spec.teamId){console.error('weekly-spec.json requires teamId and week; season must be supplied or present in snapshot.source.season.');process.exit(2)}
const weeks=spec.weeks?.length?spec.weeks:[week];
const rosterNames=(snapshot.teams??[]).flatMap(team=>team.roster??team.lineup??[]).map(player=>String(player?.name??'').trim()).filter(Boolean);
const waiverNames=(spec.waivers?.candidates??[]).map(player=>String(player?.name??'').trim()).filter(Boolean);
const projectionNames=[...new Set([...rosterNames,...waiverNames])],projectionCachePath=process.env.PROJECTION_CACHE_PATH??'data/private/projection-cache.json',seasonCachePath=process.env.JERRYGM_SEASON_CACHE_PATH??`data/private/jerrygm-season-${season}.json`,forceProjectionRefresh=process.env.PROJECTION_REFRESH==='true';
let loaded;
try{loaded=await loadWeeklyProjectionHorizon({season,weeks,scoring:spec.scoring??'HALF',minimumRows:Number(spec.minimumProjectionRows??1),projectionNames,fixturePath:spec.projectionFixturePath??process.env.PROJECTION_FIXTURE_PATH??null});}
catch(error){console.error(`PROJECTIONS: FAIL; ${error.message}`);process.exit(2)}
let seasonProjectionRows=[];
if(process.env.JERRYGM_API_KEY&&spec.useJerryGMSeasonBaseline!==false){
 try{
  let payload,seasonSource='jerrygm';if(!forceProjectionRefresh&&fs.existsSync(seasonCachePath)){payload=JSON.parse(fs.readFileSync(seasonCachePath,'utf8'));seasonSource='cache';}else{payload=await new JerryGMClient({apiKey:process.env.JERRYGM_API_KEY}).seasonProjections({season,scoring:spec.scoring??'HALF'});fs.mkdirSync('data/private',{recursive:true});fs.writeFileSync(seasonCachePath,JSON.stringify(payload,null,2)+'\n');}
  seasonProjectionRows=normalizeJerryGMSeasonProjections(payload,{season});
  console.error(`SEASON BASELINE: ${seasonSource}; ${seasonProjectionRows.length} projections.`);
 }catch(error){console.error(`SEASON BASELINE: unavailable; ${error.message}; continuing with horizon-only long-range model.`);}
}
const calibrationPath=spec.calibrationPath??'data/private/ffpros-research-calibration.json';
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?read(calibrationPath):null;
const minimumProjectionMatchRate=Number(spec.minimumProjectionMatchRate??process.env.MIN_PROJECTION_MATCH_RATE??.9);
const simulations=Number(spec.simulations??process.env.SIMULATIONS??50000);
const scenarioSimulations=Number(spec.scenarioSimulations??process.env.SCENARIO_SIMULATIONS??250);
const confirmationSimulations=Number(spec.confirmationSimulations??process.env.CONFIRMATION_SIMULATIONS??20000);
const longRangeSeasonWeight=Number(spec.longRangeSeasonWeight??process.env.LONG_RANGE_SEASON_WEIGHT??.65);
const prepared=prepareLeagueSimulation(snapshot,loaded.rows,{calibrationReport,simulations,seed:Number(spec.seed??process.env.SEED??20260923),modelVariant:spec.modelVariant??process.env.MODEL_VARIANT??'correlated',minimumProjectionMatchRate,weeks,season,seasonProjectionRows,longRangeSeasonWeight});
prepared.input.metadata={...prepared.input.metadata,projectionProvider:loaded.trust};
const fingerprint=simulationFingerprint(prepared.input);
prepared.input.metadata.simulationFingerprint=fingerprint;
const readiness=assessSimulationReadiness(prepared,{minimumProjectionMatchRate});
console.error(`PROJECTIONS: ${loaded.provider}; ${loaded.rows.length} rows across weeks ${loaded.weeks.join(',')}; ${loaded.trust.degraded?'DEGRADED/FALLBACK':'PRIMARY'}.`);console.error(`PROJECTION SOURCE: ${loaded.provider}; ${loaded.trust.weekResults.map(x=>`W${x.week}=${x.provider}`).join(', ')}${forceProjectionRefresh?' [REFRESH REQUESTED]':''}.`);
if(seasonProjectionRows.length){const c=prepared.diagnostics.seasonProjectionCoverage;console.error(`LONG RANGE: ${prepared.diagnostics.longRangeProjectionMethod}; season weight ${(100*prepared.diagnostics.longRangeSeasonWeight).toFixed(0)}%; season coverage ${(100*c.matchRate).toFixed(1)}%.`);if(c.missing?.length)console.error(`SEASON BASELINE MISSES (${c.missing.length}): ${c.missing.slice(0,30).map(x=>x.name??x.playerName??x.id).join(', ')}${c.missing.length>30?' ...':''}`);}
const confidence=prepared.diagnostics.longRangeConfidence;
if(confidence){const derived=prepared.diagnostics.longRangeProjectionWeeks??[];if(derived.length){const first=derived[0],last=derived.at(-1);console.error(`HORIZON CONFIDENCE: W${first} ${(100*confidence.byWeek[first]).toFixed(0)}% -> W${last} ${(100*confidence.byWeek[last]).toFixed(0)}% (${confidence.method}; diagnostic only).`);}}
console.error(`SIMULATION INPUT: ${fingerprint}; seed ${prepared.input.seed}; variant ${prepared.input.modelVariant}.`);
console.error(`READY CHECK: ${readiness.ready?'PASS':'FAIL'}; projections ${(100*readiness.projectionCoverage.matchRate).toFixed(1)}% usable; incomplete lineups ${readiness.incompleteLineups.length}.`);
if(!readiness.ready){for(const error of readiness.errors)console.error(`ERROR: ${error}`);console.log(JSON.stringify({readiness,projectionHealth:loaded.trust,metadata:prepared.input.metadata,report:null},null,2));process.exitCode=2;}
else{
 const tradeDiscovery=spec.tradeDiscovery;
 if(tradeDiscovery?.enabled&&!(spec.trades?.length)){
  try{
   const discovered=discoverTradeCandidates(prepared.input,{teamId:spec.teamId,projectionRows:loaded.rows,weeks,maxPartners:Number(tradeDiscovery.maxPartners??9),maxPlayersPerTeam:Number(tradeDiscovery.maxPlayersPerTeam??7),maxScenarios:Number(tradeDiscovery.maxScenarios??36),valueTolerance:Number(tradeDiscovery.valueTolerance??.35)});
   spec.trades=discovered.scenarios;
   spec.scanAvailability={...spec.scanAvailability,trades:{status:'available',source:'projection-value-screen',scenarioCount:discovered.scenarios.length,diagnostics:discovered.diagnostics}};
   console.error(`TRADES: projection-value discovery; ${discovered.diagnostics.partnerCount} partners / ${discovered.diagnostics.generatedScenarioCount} generated / ${discovered.scenarios.length} evaluated scenarios.`);
  }catch(error){spec.scanAvailability={...spec.scanAvailability,trades:{status:'unavailable',reason:error.message}};console.error(`TRADES: unavailable; ${error.message}; continuing without trade recommendations.`);}
 }
 const simulationTrust={requireProjectionCoverage:true,minimumProjectionMatchRate,...(spec.sourceAudit?{audit:spec.sourceAudit}:{})};
 if(spec.sourceAudit)console.error(`SOURCE AUDIT: ${spec.sourceAudit.passed?'PASS':'FAIL'}; ${spec.sourceAudit.checks?.length??0} checks; league ${spec.sourceAudit.leagueKey??'unknown'} week ${spec.sourceAudit.week??week}.`);
 console.error(`MONTE CARLO: running ${simulations.toLocaleString()} core simulations; scenario screening uses ${scenarioSimulations.toLocaleString()} each; promising actions confirm at ${confirmationSimulations.toLocaleString()}...`);
 const started=Date.now();
 const report=buildLeagueIntelligenceReport(prepared.input,{...spec,week,projectionRows:loaded.rows,providerHealth:loaded.trust,trust:simulationTrust,scenarioSimulations,confirmationSimulations});
 console.error(`MONTE CARLO: complete in ${((Date.now()-started)/1000).toFixed(1)}s.`);
 const t=report.timing;console.error(`TIMING: core ${t.coreMonteCarloSeconds.toFixed(1)}s | scenario baseline ${t.scenarioBaselineSeconds.toFixed(1)}s | matchup ${t.matchupSeconds.toFixed(1)}s | recommendations ${t.recommendationsSeconds.toFixed(1)}s | total ${t.totalSeconds.toFixed(1)}s.`);
 const rt=report.recommendations?.diagnostics?.timing;if(rt)console.error(`RECOMMENDATION TIMING: setup ${rt.setupSeconds.toFixed(1)}s | waivers ${rt.waiverSeconds.toFixed(1)}s | start/sit ${rt.startSitSeconds.toFixed(1)}s | trade screen ${rt.tradeScreenSeconds.toFixed(1)}s | confirmation ${rt.confirmationSeconds.toFixed(1)}s | finalize ${rt.finalizeSeconds.toFixed(1)}s.`);
const c=report.recommendations?.confirmation;if(c){const staged=c.precheckCount?`${c.precheckPassedCount}/${c.precheckCount} trade candidates passed the ${c.precheckSimulations.toLocaleString()}-simulation precheck; `:'';console.error(`CONFIRMATION: ${staged}${c.evaluatedCount??c.confirmedCount}/${c.finalCandidateCount??c.candidateCount} finalists re-evaluated at ${c.simulations.toLocaleString()} simulations each; ${c.passedCount??0} passed the final recommendation gate.`);}
 console.log(formatWeeklyIntelligence(report,{maxActions:Number(spec.maxActions??5)}));
 if(spec.outputPath){fs.writeFileSync(spec.outputPath,JSON.stringify({readiness,report},null,2));console.error(`REPORT JSON: ${spec.outputPath}`);}
 if(spec.includeJson) console.log(JSON.stringify({readiness,report},null,2));
}