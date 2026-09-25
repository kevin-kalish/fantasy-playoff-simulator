import fs from 'node:fs';
import {simulateLeague} from '../src/simulator.js';
import {buildLeagueSimulationInput} from '../src/model/league-simulation-input.js';
import {requireSimulationTrust} from '../src/model/simulation-trust-gate.js';

const inputPath=process.argv[2];
const calibrationPath=process.argv[3]||'data/private/ffpros-research-calibration.json';
if(!inputPath){console.error('Usage: node scripts/simulate-league-snapshot.mjs path/to/league.json [calibration-report.json]');process.exit(1)}
const snapshot=JSON.parse(fs.readFileSync(inputPath,'utf8'));
const calibrationReport=calibrationPath&&fs.existsSync(calibrationPath)?JSON.parse(fs.readFileSync(calibrationPath,'utf8')):null;
const input=buildLeagueSimulationInput(snapshot,{calibrationReport,simulations:Number(process.env.SIMULATIONS||50000),seed:Number(process.env.SEED||20260923),modelVariant:process.env.MODEL_VARIANT||'correlated',minimumProjectionMatchRate:Number(process.env.MIN_PROJECTION_MATCH_RATE||.9)});
const auditPath=process.env.YAHOO_AUDIT_REPORT;const audit=auditPath&&fs.existsSync(auditPath)?JSON.parse(fs.readFileSync(auditPath,'utf8')):null;
let trust;try{trust=requireSimulationTrust(input,{audit});}catch(error){console.error(JSON.stringify({status:'BLOCKED',message:error.message,trust:error.trust},null,2));process.exit(3)}
const results=simulateLeague(input).sort((a,b)=>b.playoffProbability-a.playoffProbability||b.championshipProbability-a.championshipProbability);
console.log(JSON.stringify({metadata:input.metadata,trust,simulations:input.simulations,seed:input.seed,results},null,2));
