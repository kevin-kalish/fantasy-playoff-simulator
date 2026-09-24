import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {assessSimulationReadiness} from '../src/model/simulation-readiness.js';
import {simulateLeague} from '../src/simulator.js';

const snapshotPath=process.argv[2],projectionPath=process.argv[3];
const calibrationPath=process.argv[4]||'data/private/ffpros-research-calibration.json';
if(!snapshotPath||!projectionPath){console.error('Usage: node scripts/run-prepared-league.mjs league.json projections.json [calibration.json]');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),rawProjections=read(projectionPath),projectionRows=Array.isArray(rawProjections)?rawProjections:(rawProjections.rows||rawProjections.projections||[]);
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?read(calibrationPath):null;
const minimumProjectionMatchRate=Number(process.env.MIN_PROJECTION_MATCH_RATE||.9);
const prepared=prepareLeagueSimulation(snapshot,projectionRows,{calibrationReport,simulations:Number(process.env.SIMULATIONS||50000),seed:Number(process.env.SEED||20260923),modelVariant:process.env.MODEL_VARIANT||'correlated',minimumProjectionMatchRate});
const readiness=assessSimulationReadiness(prepared,{minimumProjectionMatchRate});
console.error(`READY CHECK: ${readiness.ready?'PASS':'FAIL'}; projections ${(100*readiness.projectionCoverage.matchRate).toFixed(1)}% usable (${readiness.projectionCoverage.usable}/${readiness.projectionCoverage.total}); incomplete lineups ${readiness.incompleteLineups.length}; model ${readiness.modelVariant}.`);
for(const warning of readiness.warnings)console.error(`WARNING: ${warning}`);
if(!readiness.ready){for(const error of readiness.errors)console.error(`ERROR: ${error}`);console.log(JSON.stringify({readiness,metadata:prepared.input.metadata,results:[]},null,2));process.exitCode=2}else{
 const results=simulateLeague(prepared.input).sort((a,b)=>b.playoffProbability-a.playoffProbability||b.championshipProbability-a.championshipProbability);
 console.log(JSON.stringify({readiness,metadata:prepared.input.metadata,simulations:prepared.input.simulations,seed:prepared.input.seed,results},null,2));
}
