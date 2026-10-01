import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {assessSimulationReadiness} from '../src/model/simulation-readiness.js';
import {buildLeagueIntelligenceReport} from '../src/model/league-intelligence-report.js';
import {formatWeeklyIntelligence} from '../src/model/weekly-intelligence-format.js';
import {simulationFingerprint} from '../src/model/simulation-fingerprint.js';
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
const projectionNames=[...new Set([...rosterNames,...waiverNames])];
let loaded;
try{loaded=await loadWeeklyProjectionHorizon({season,weeks,scoring:spec.scoring??'HALF',minimumRows:Number(spec.minimumProjectionRows??1),projectionNames,fixturePath:spec.projectionFixturePath??process.env.PROJECTION_FIXTURE_PATH??null});}
catch(error){console.error(`PROJECTIONS: FAIL; ${error.message}`);process.exit(2)}
let seasonProjectionRows=[];
if(process.env.JERRYGM_API_KEY&&spec.useJerryGMSeasonBaseline!==false){
 try{
  const payload=await new JerryGMClient({apiKey:process.env.JERRYGM_API_KEY}).seasonProjections({season,scoring:spec.scoring??'HALF',names:projectionNames});
  seasonProjectionRows=normalizeJerryGMSeasonProjections(payload,{season});
  console.error(`SEASON BASELINE: jerrygm; ${seasonProjectionRows.length} projections.`);
 }catch(error){console.error(`SEASON BASELINE: unavailable; ${error.message}; continuing with horizon-only long-range model.`);}
}
const calibrationPath=spec.calibrationPath??'data/private/ffpros-research-calibration.json';
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?read(calibrationPath):null;
const minimumProjectionMatchRate=Number(spec.minimumProjectionMatchRate??process.env.MIN_PROJECTION_MATCH_RATE??.9);
const simulations=Number(spec.simulations??process.env.SIMULATIONS??50000);
const scenarioSimulations=Number(spec.scenarioSimulations??process.env.SCENARIO_SIMULATIONS??5000);
const longRangeSeasonWeight=Number(spec.longRangeSeasonWeight??process.env.LONG_RANGE_SEASON_WEIGHT??.65);
const prepared=prepareLeagueSimulation(snapshot,loaded.rows,{calibrationReport,simulations,seed:Number(spec.seed??process.env.SEED??20260923),modelVariant:spec.modelVariant??process.env.MODEL_VARIANT??'correlated',minimumProjectionMatchRate,weeks,season,seasonProjectionRows,longRangeSeasonWeight});
prepared.input.metadata={...prepared.input.metadata,projectionProvider:loaded.trust};
const fingerprint=simulationFingerprint(prepared.input);
prepared.input.metadata.simulationFingerprint=fingerprint;
const readiness=assessSimulationReadiness(prepared,{minimumProjectionMatchRate});
console.error(`PROJECTIONS: ${loaded.provider}; ${loaded.rows.length} rows across weeks ${loaded.weeks.join(',')}; ${loaded.trust.degraded?'DEGRADED/FALLBACK':'PRIMARY'}.`);
if(seasonProjectionRows.length){const c=prepared.diagnostics.seasonProjectionCoverage;console.error(`LONG RANGE: ${prepared.diagnostics.longRangeProjectionMethod}; season weight ${(100*prepared.diagnostics.longRangeSeasonWeight).toFixed(0)}%; season coverage ${(100*c.matchRate).toFixed(1)}%.`);if(c.missing?.length)console.error(`SEASON BASELINE MISSES (${c.missing.length}): ${c.missing.slice(0,30).map(x=>x.name??x.playerName??x.id).join(', ')}${c.missing.length>30?' ...':''}`);}
const confidence=prepared.diagnostics.longRangeConfidence;
if(confidence){const derived=prepared.diagnostics.longRangeProjectionWeeks??[];if(derived.length){const first=derived[0],last=derived.at(-1);console.error(`HORIZON CONFIDENCE: W${first} ${(100*confidence.byWeek[first]).toFixed(0)}% -> W${last} ${(100*confidence.byWeek[last]).toFixed(0)}% (${confidence.method}; diagnostic only).`);}}
console.error(`SIMULATION INPUT: ${fingerprint}; seed ${prepared.input.seed}; variant ${prepared.input.modelVariant}.`);
console.error(`READY CHECK: ${readiness.ready?'PASS':'FAIL'}; projections ${(100*readiness.projectionCoverage.matchRate).toFixed(1)}% usable; incomplete lineups ${readiness.incompleteLineups.length}.`);
if(!readiness.ready){for(const error of readiness.errors)console.error(`ERROR: ${error}`);console.log(JSON.stringify({readiness,projectionHealth:loaded.trust,metadata:prepared.input.metadata,report:null},null,2));process.exitCode=2;}
else{
 console.error(`MONTE CARLO: running ${simulations.toLocaleString()} core simulations; scenario analyses use ${scenarioSimulations.toLocaleString()} each...`);
 const started=Date.now();
 const report=buildLeagueIntelligenceReport(prepared.input,{...spec,week,projectionRows:loaded.rows,providerHealth:loaded.trust,trust:{requireProjectionCoverage:true,minimumProjectionMatchRate},scenarioSimulations});
 console.error(`MONTE CARLO: complete in ${((Date.now()-started)/1000).toFixed(1)}s.`);
 const t=report.timing;console.error(`TIMING: core ${t.coreMonteCarloSeconds.toFixed(1)}s | scenario baseline ${t.scenarioBaselineSeconds.toFixed(1)}s | matchup ${t.matchupSeconds.toFixed(1)}s | recommendations ${t.recommendationsSeconds.toFixed(1)}s | total ${t.totalSeconds.toFixed(1)}s.`);
 console.log(formatWeeklyIntelligence(report,{maxActions:Number(spec.maxActions??5)}));
 if(spec.outputPath){fs.writeFileSync(spec.outputPath,JSON.stringify({readiness,report},null,2));console.error(`REPORT JSON: ${spec.outputPath}`);}
 if(spec.includeJson) console.log(JSON.stringify({readiness,report},null,2));
}
