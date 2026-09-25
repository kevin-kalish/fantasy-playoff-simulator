import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {buildWeeklyGMRecommendations} from '../src/model/gm-recommendation-engine.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read('fixtures/prepared-league.json');
const projectionRows=read('data/private/e2e-projections.json');
const calibrationPath='data/private/ffpros-research-calibration.json';
const calibrationReport=fs.existsSync(calibrationPath)?read(calibrationPath):null;
const prepared=prepareLeagueSimulation(snapshot,projectionRows,{calibrationReport,simulations:Number(process.env.SIMULATIONS||5000),seed:Number(process.env.SEED||20260923),modelVariant:'correlated',minimumProjectionMatchRate:.9});
const report=buildWeeklyGMRecommendations(prepared.input,{teamId:'T2',week:11,projectionRows,startSit:true,trades:[],waivers:null,limit:5});
console.log(`GM FIXTURE: ${report.teamName} Week ${report.week}`);
for(const r of report.recommendations)console.log(`#${r.rank} [${r.type}] ${r.summary}`);
console.log(JSON.stringify(report,null,2));
