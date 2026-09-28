import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {assessSimulationReadiness} from '../src/model/simulation-readiness.js';
import {buildLeagueIntelligenceReport} from '../src/model/league-intelligence-report.js';
import {loadWeeklyProjections} from '../src/data/weekly-projection-provider.js';

const [snapshotPath,specPath]=process.argv.slice(2);
if(!snapshotPath||!specPath){console.error('Usage: npm run intelligence:weekly -- <league-snapshot.json> <weekly-spec.json>');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),spec=read(specPath);
const season=Number(spec.season??snapshot.source?.season),week=Number(spec.week);
if(!season||!week||!spec.teamId){console.error('weekly-spec.json requires teamId and week; season must be supplied or present in snapshot.source.season.');process.exit(2)}
let loaded;
try{loaded=await loadWeeklyProjections({season,week,scoring:spec.scoring??'HALF',minimumRows:Number(spec.minimumProjectionRows??1),fixturePath:spec.projectionFixturePath??process.env.PROJECTION_FIXTURE_PATH??null});}
catch(error){console.error(`PROJECTIONS: FAIL; ${error.message}`);process.exit(2)}
const calibrationPath=spec.calibrationPath??'data/private/ffpros-research-calibration.json';
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?read(calibrationPath):null;
const minimumProjectionMatchRate=Number(spec.minimumProjectionMatchRate??process.env.MIN_PROJECTION_MATCH_RATE??.9);
const prepared=prepareLeagueSimulation(snapshot,loaded.rows,{calibrationReport,simulations:Number(spec.simulations??process.env.SIMULATIONS??50000),seed:Number(spec.seed??process.env.SEED??20260923),modelVariant:spec.modelVariant??process.env.MODEL_VARIANT??'correlated',minimumProjectionMatchRate,weeks:spec.weeks??null,season});
prepared.input.metadata={...prepared.input.metadata,projectionProvider:loaded.trust};
const readiness=assessSimulationReadiness(prepared,{minimumProjectionMatchRate});
console.error(`PROJECTIONS: ${loaded.provider}; ${loaded.rows.length} rows; ${loaded.trust.degraded?'DEGRADED/FALLBACK':'PRIMARY'}.`);
console.error(`READY CHECK: ${readiness.ready?'PASS':'FAIL'}; projections ${(100*readiness.projectionCoverage.matchRate).toFixed(1)}% usable; incomplete lineups ${readiness.incompleteLineups.length}.`);
if(!readiness.ready){for(const error of readiness.errors)console.error(`ERROR: ${error}`);console.log(JSON.stringify({readiness,projectionHealth:loaded.trust,metadata:prepared.input.metadata,report:null},null,2));process.exitCode=2;}
else{
 const report=buildLeagueIntelligenceReport(prepared.input,{...spec,week,projectionRows:loaded.rows,providerHealth:loaded.trust,trust:{requireProjectionCoverage:true,minimumProjectionMatchRate}});
 console.log(`WEEKLY INTELLIGENCE: ${report.team.name} Week ${week}`);
 console.log(`OUTLOOK: playoff ${(100*report.outlook.playoffProbability).toFixed(1)}%; championship ${(100*report.outlook.championshipProbability).toFixed(1)}%; seed ${report.team.currentSeed}.`);
 console.log(`MATCHUP: ${report.matchup.opponentName}; win ${(100*report.matchup.simulated.winProbability).toFixed(1)}%; posture ${report.leverage.posture}; urgency ${report.leverage.urgency}.`);
 console.log(`TRUST: ${report.trust.trusted?'PASS':'REVIEW'}; projection source ${report.trust.projections.provider}${report.trust.projections.degraded?' (DEGRADED/FALLBACK)':''}.`);
 for(const r of report.recommendations.items)console.log(`#${r.rank} [${r.type}] ${r.summary}`);
 console.log(JSON.stringify({readiness,report},null,2));
}
