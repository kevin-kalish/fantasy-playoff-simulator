import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {simulateLeague} from '../src/simulator.js';

const snapshotPath=process.argv[2],projectionPath=process.argv[3];
const calibrationPath=process.argv[4]||'data/private/ffpros-research-calibration.json';
if(!snapshotPath||!projectionPath){console.error('Usage: node scripts/run-prepared-league.mjs league.json projections.json [calibration.json]');process.exit(1)}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read(snapshotPath),rawProjections=read(projectionPath),projectionRows=Array.isArray(rawProjections)?rawProjections:(rawProjections.rows||rawProjections.projections||[]);
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?read(calibrationPath):null;
const prepared=prepareLeagueSimulation(snapshot,projectionRows,{calibrationReport,simulations:Number(process.env.SIMULATIONS||50000),seed:Number(process.env.SEED||20260923),modelVariant:process.env.MODEL_VARIANT||'correlated',minimumProjectionMatchRate:Number(process.env.MIN_PROJECTION_MATCH_RATE||.9)});
const results=simulateLeague(prepared.input).sort((a,b)=>b.playoffProbability-a.playoffProbability||b.championshipProbability-a.championshipProbability);
const c=prepared.diagnostics.projectionCoverage,incomplete=prepared.diagnostics.incompleteLineups;
console.error(`READY CHECK: projections ${(100*c.matchRate).toFixed(1)}% usable (${c.usable}/${c.total}); incomplete lineups ${incomplete.length}; model ${prepared.input.metadata?.modelVariant||prepared.input.modelVariant}.`);
if(incomplete.length)console.error('WARNING: incomplete optimized lineups:',JSON.stringify(incomplete));
console.log(JSON.stringify({readiness:{ready:c.matchRate>=Number(process.env.MIN_PROJECTION_MATCH_RATE||.9)&&incomplete.length===0,projectionCoverage:c,incompleteLineups:incomplete,lineupSlots:prepared.diagnostics.lineupSlots},metadata:prepared.input.metadata,simulations:prepared.input.simulations,seed:prepared.input.seed,results},null,2));
