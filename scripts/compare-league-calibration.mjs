import fs from 'node:fs';
import {simulateLeague} from '../src/simulator.js';
import {calibrationFromReport,calibrationReady} from '../src/model/calibration-loader.js';

const inputPath=process.argv[2];
const calibrationPath=process.argv[3]||'data/private/ffpros-research-calibration.json';
if(!inputPath){
 console.error('Usage: node scripts/compare-league-calibration.mjs path/to/league.json [calibration-report.json]');
 process.exit(1);
}
const league=JSON.parse(fs.readFileSync(inputPath,'utf8'));
const report=JSON.parse(fs.readFileSync(calibrationPath,'utf8'));
const calibration=calibrationFromReport(report);
if(!calibrationReady(calibration)){
 console.error('Calibration report is missing projection buckets or bias parameters.');
 process.exit(1);
}
const simulations=Number(process.env.SIMULATIONS||league.simulations||50000);
const seed=Number(process.env.SEED||league.seed||20260923);
const base={...league,simulations,seed};
const fixed=simulateLeague({...base,calibration:null});
const bucketed=simulateLeague({...base,calibration});
const byId=new Map(fixed.map(x=>[x.id,x]));
const comparison=bucketed.map(b=>{const f=byId.get(b.id);return{
 id:b.id,
 name:b.name,
 fixedPlayoff:f?.playoffProbability??null,
 bucketedPlayoff:b.playoffProbability,
 playoffDelta:b.playoffProbability-(f?.playoffProbability??0),
 fixedChampionship:f?.championshipProbability??null,
 bucketedChampionship:b.championshipProbability,
 championshipDelta:b.championshipProbability-(f?.championshipProbability??0),
 fixedAverageWins:f?.averageWins??null,
 bucketedAverageWins:b.averageWins,
 averageWinsDelta:b.averageWins-(f?.averageWins??0)
};}).sort((a,b)=>Math.abs(b.playoffDelta)-Math.abs(a.playoffDelta));
console.log(JSON.stringify({simulations,seed,calibration:calibration.source,comparison},null,2));
