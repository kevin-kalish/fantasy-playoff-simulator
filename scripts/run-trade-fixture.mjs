import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {evaluateTradeScenario} from '../src/model/trade-evaluator.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read('fixtures/prepared-league.json');
const projectionRows=read('data/private/e2e-projections.json');
const calibrationPath='data/private/ffpros-research-calibration.json';
const calibrationReport=fs.existsSync(calibrationPath)?read(calibrationPath):null;
const prepared=prepareLeagueSimulation(snapshot,projectionRows,{calibrationReport,simulations:Number(process.env.SIMULATIONS||10000),seed:Number(process.env.SEED||20260923),modelVariant:process.env.MODEL_VARIANT||'correlated',minimumProjectionMatchRate:.9});
const trade={teamAId:'T2',teamBId:'T3',teamAGives:['T2-WR'],teamBGives:['T3-RB'],projectionRows,weeks:[11,12,13],lineupSlots:snapshot.lineupSlots};
const result=evaluateTradeScenario(prepared.input,trade);
const pct=n=>`${n>=0?'+':''}${(n*100).toFixed(2)}%`,wins=n=>`${n>=0?'+':''}${n.toFixed(3)}`;
console.log('TRADE FIXTURE: end-to-end prepared league -> trade -> re-optimize both teams -> paired simulation');
for(const side of ['A','B']){const x=result.teams[side];console.log(`${x.teamName}: ${pct(x.playoffDelta)} playoff, ${pct(x.championshipDelta)} championship, ${wins(x.winsDelta)} wins`)}
console.log(JSON.stringify({trade:result.trade,simulations:result.simulations,seed:result.seed,teams:result.teams},null,2));
