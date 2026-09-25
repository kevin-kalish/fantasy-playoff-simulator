import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {buildWeeklyGMRecommendations} from '../src/model/gm-recommendation-engine.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read('fixtures/prepared-league.json');
const baseRows=read('data/private/e2e-projections.json');
const calibrationPath='data/private/ffpros-research-calibration.json';
const calibrationReport=fs.existsSync(calibrationPath)?read(calibrationPath):null;
const weeks=[11,12,13];

const t2=snapshot.teams.find(t=>t.id==='T2');
t2.roster.push({id:'T2-RB-BENCH',name:'Bravo Bench RB',position:'RB',nflTeam:'DET'});
const waiverCandidates=[{id:'FA-RB-ELITE',name:'Fixture RB Elite',position:'RB',nflTeam:'GB'},{id:'FA-WR-SOLID',name:'Fixture WR Solid',position:'WR',nflTeam:'LAR'}];
const projectionRows=[...baseRows];
for(const week of weeks){
 projectionRows.push({season:2025,week,playerId:'T2-RB-BENCH',name:'Bravo Bench RB',position:'RB',nflTeam:'DET',projection:week===11?23:14});
 projectionRows.push({season:2025,week,playerId:'FA-RB-ELITE',name:'Fixture RB Elite',position:'RB',nflTeam:'GB',projection:20+(week-11)*.2});
 projectionRows.push({season:2025,week,playerId:'FA-WR-SOLID',name:'Fixture WR Solid',position:'WR',nflTeam:'LAR',projection:17+(week-11)*.2});
}

const prepared=prepareLeagueSimulation(snapshot,projectionRows,{calibrationReport,simulations:Number(process.env.SIMULATIONS||5000),seed:Number(process.env.SEED||20260923),modelVariant:'correlated',minimumProjectionMatchRate:.9});
const bravo=prepared.input.teams.find(t=>t.id==='T2');
const w11=bravo.weeklyLineups[11];
const benchIndex=w11.findIndex(p=>p.id==='T2-RB-BENCH');
const original=bravo.roster.find(p=>p.id==='T2-RB');
if(benchIndex>=0&&original)w11[benchIndex]={...original,projection:18.9,lineupSlot:'RB'};

const report=buildWeeklyGMRecommendations(prepared.input,{
 teamId:'T2',week:11,projectionRows,
 startSit:{slot:'RB'},
 waivers:{candidates:waiverCandidates,dropPlayerIds:['T2-RB','T2-WR'],weeks,lineupSlots:snapshot.lineupSlots},
 trades:[{label:'Trade Bravo WR for Charlie RB',teamAId:'T2',teamBId:'T3',teamAGives:['T2-WR'],teamBGives:['T3-RB'],weeks,lineupSlots:snapshot.lineupSlots}],
 limit:10
});
console.log(`GM FIXTURE: ${report.teamName} Week ${report.week}`);
for(const r of report.recommendations)console.log(`#${r.rank} [${r.type}] ${r.summary}${Number.isFinite(r.projectedPointDelta)?` (${r.projectedPointDelta>=0?'+':''}${r.projectedPointDelta.toFixed(2)} projected pts)`:''}`);
console.log(JSON.stringify(report,null,2));
