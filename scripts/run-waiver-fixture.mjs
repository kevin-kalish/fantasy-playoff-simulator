import fs from 'node:fs';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';
import {rankWaiverCandidates} from '../src/model/waiver-ranker.js';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const snapshot=read('fixtures/prepared-league.json');
const baseRows=read('data/private/e2e-projections.json');
const calibrationPath='data/private/ffpros-research-calibration.json';
const calibrationReport=fs.existsSync(calibrationPath)?read(calibrationPath):null;
const weeks=[11,12,13];
const candidates=[
 {id:'FA-RB-ELITE',name:'Fixture RB Elite',position:'RB',nflTeam:'DET'},
 {id:'FA-RB-SOLID',name:'Fixture RB Solid',position:'RB',nflTeam:'GB'},
 {id:'FA-WR-UPSIDE',name:'Fixture WR Upside',position:'WR',nflTeam:'LAR'}
];
const candidateRows=[];
for(const week of weeks){
 candidateRows.push({season:2025,week,playerId:'FA-RB-ELITE',name:'Fixture RB Elite',position:'RB',nflTeam:'DET',projection:20+(week-11)*.2});
 candidateRows.push({season:2025,week,playerId:'FA-RB-SOLID',name:'Fixture RB Solid',position:'RB',nflTeam:'GB',projection:16+(week-11)*.2});
 candidateRows.push({season:2025,week,playerId:'FA-WR-UPSIDE',name:'Fixture WR Upside',position:'WR',nflTeam:'LAR',projection:18+(week-11)*.2});
}
const projectionRows=[...baseRows,...candidateRows];
const prepared=prepareLeagueSimulation(snapshot,projectionRows,{calibrationReport,simulations:Number(process.env.SIMULATIONS||10000),seed:Number(process.env.SEED||20260923),modelVariant:process.env.MODEL_VARIANT||'correlated',minimumProjectionMatchRate:.9});
const spec={teamId:'T2',candidates,dropPlayerIds:['T2-RB','T2-WR'],projectionRows,weeks,lineupSlots:snapshot.lineupSlots};
const ranked=rankWaiverCandidates(prepared.input,spec);
const compact=ranked.map(r=>({rank:r.rank,add:r.addPlayerName,drop:r.dropPlayerId,playoffDelta:r.playoffDelta,championshipDelta:r.championshipDelta,winsDelta:r.winsDelta,summary:r.summary}));
console.log('WAIVER FIXTURE: end-to-end prepared league -> add/drop -> re-optimize -> paired simulation -> ranking');
for(const r of compact)console.log(r.summary);
console.log(JSON.stringify({teamId:spec.teamId,teamName:'Bravo',simulations:prepared.input.simulations,seed:prepared.input.seed,ranked:compact},null,2));
