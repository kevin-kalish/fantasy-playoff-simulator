import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {evaluateStartSitChoices} from '../src/model/start-sit-evaluator.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read('fixtures/prepared-league.json');
const baseRows=read('data/private/e2e-projections.json');
const calibrationPath='data/private/ffpros-research-calibration.json';
const calibrationReport=fs.existsSync(calibrationPath)?read(calibrationPath):null;

const team=snapshot.teams.find(t=>t.id==='T2');
team.roster.push({id:'T2-RB-BENCH',name:'Bravo Bench RB',position:'RB',nflTeam:'DET'});
const projectionRows=[...baseRows];
for(const week of [11,12,13])projectionRows.push({season:2025,week,playerId:'T2-RB-BENCH',name:'Bravo Bench RB',position:'RB',nflTeam:'DET',projection:week===11?23:14});

const prepared=prepareLeagueSimulation(snapshot,projectionRows,{calibrationReport,simulations:Number(process.env.SIMULATIONS||10000),seed:Number(process.env.SEED||20260923),modelVariant:process.env.MODEL_VARIANT||'correlated',minimumProjectionMatchRate:.9});
const t2=prepared.input.teams.find(t=>t.id==='T2');
const week=11;
const starter=t2.weeklyLineups[week].find(p=>p.lineupSlot==='RB');
const bench=t2.roster.find(p=>p.id==='T2-RB-BENCH');
if(!starter||!bench)throw new Error('Fixture could not identify RB starter/bench');
const spec={teamId:'T2',week,projectionRows,choices:[{slot:'RB',startPlayerId:bench.id,startPlayerName:bench.name,sitPlayerId:starter.id,sitPlayerName:starter.name,projectedPointDelta:23-Number(starter.projection||0)}]};
const ranked=evaluateStartSitChoices(prepared.input,spec);
const pct=n=>`${n>=0?'+':''}${(n*100).toFixed(2)}%`;
console.log('START/SIT FIXTURE: prepared league -> legal substitution -> paired simulation -> decision impact');
for(const r of ranked)console.log(`#${r.rank} Start ${r.startPlayerName} / Sit ${r.sitPlayerName}: ${r.projectedPointDelta>=0?'+':''}${r.projectedPointDelta.toFixed(2)} pts, ${pct(r.playoffDelta)} playoff, ${pct(r.championshipDelta)} championship, ${r.winsDelta>=0?'+':''}${r.winsDelta.toFixed(3)} wins`);
console.log(JSON.stringify({teamId:'T2',teamName:'Bravo',week,simulations:prepared.input.simulations,seed:prepared.input.seed,ranked},null,2));
