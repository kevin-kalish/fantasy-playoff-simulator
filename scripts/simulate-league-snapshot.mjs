import fs from 'node:fs';
import {simulateLeague} from '../src/simulator.js';
import {buildLeagueSimulationInput} from '../src/model/league-simulation-input.js';

const inputPath=process.argv[2];
const calibrationPath=process.argv[3]||'data/private/ffpros-research-calibration.json';
if(!inputPath){console.error('Usage: node scripts/simulate-league-snapshot.mjs path/to/league.json [calibration-report.json]');process.exit(1)}
const snapshot=JSON.parse(fs.readFileSync(inputPath,'utf8'));
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?JSON.parse(fs.readFileSync(calibrationPath,'utf8')):null;
const input=buildLeagueSimulationInput(snapshot,{calibrationReport,simulations:Number(process.env.SIMULATIONS||50000),seed:Number(process.env.SEED||20260923),modelVariant:process.env.MODEL_VARIANT||'correlated',minimumProjectionMatchRate:Number(process.env.MIN_PROJECTION_MATCH_RATE||.9)});
const results=simulateLeague(input).sort((a,b)=>b.playoffProbability-a.playoffProbability||b.championshipProbability-a.championshipProbability);
console.log(JSON.stringify({metadata:input.metadata,simulations:input.simulations,seed:input.seed,results},null,2));
