import assert from 'node:assert/strict';
import {enrichWeeklyProjections} from '../src/data/weekly-projection-enrichment.js';

const snapshot={source:{provider:'fixture',leagueId:'x',season:2025},teams:[{id:'A',name:'A',lineup:[{id:'1',name:'Josh Allen',position:'QB',nflTeam:'BUF'},{id:'2',name:'Test WR',position:'WR',nflTeam:'MIN'}]},{id:'B',name:'B',lineup:[{id:'3',name:'Other QB',position:'QB',nflTeam:'KC'}]}],schedule:[{week:11,matchups:[['A','B']]},{week:12,matchups:[['A','B']]}],playoffSpots:2,playoffWeeks:[15],reseed:true};
const rows=[
 {season:2025,week:11,playerId:'1',name:'Josh Allen',position:'QB',nflTeam:'BUF',projection:24},
 {season:2025,week:11,playerId:'2',name:'Test WR',position:'WR',nflTeam:'MIN',projection:14},
 {season:2025,week:11,playerId:'3',name:'Other QB',position:'QB',nflTeam:'KC',projection:21},
 {season:2025,week:12,playerId:'1',name:'Josh Allen',position:'QB',nflTeam:'BUF',projection:25},
 {season:2025,week:12,playerId:'2',name:'Test WR',position:'WR',nflTeam:'MIN',projection:13,status:'BYE'},
 {season:2025,week:12,playerId:'3',name:'Other QB',position:'QB',nflTeam:'KC',projection:22},
 {season:2025,week:15,playerId:'1',name:'Josh Allen',position:'QB',nflTeam:'BUF',projection:26},
 {season:2025,week:15,playerId:'3',name:'Other QB',position:'QB',nflTeam:'KC',projection:23}
];
const out=enrichWeeklyProjections(snapshot,rows);
assert.deepEqual(out.coverage.weeks,[11,12,15]);assert.equal(out.league.teams[0].weeklyLineups[11][0].projection,24);assert.equal(out.league.teams[0].weeklyLineups[12][0].projection,25);
const bye=out.league.teams[0].weeklyLineups[12][1];assert.equal(bye.projection,0);assert.equal(bye.status,'BYE');assert.equal(bye.projectionStatus,'bye');
assert.equal(out.coverage.total,9);assert.equal(out.coverage.bye,1);assert.equal(out.coverage.missing,1);assert.equal(out.coverage.usable,8);assert.equal(out.league.teams[0].weeklyLineups[15][1].projection,null);
assert.equal(out.coverage.missingPlayers.length,1);assert.equal(out.coverage.missingPlayers[0].name,'Test WR');
assert.throws(()=>enrichWeeklyProjections(snapshot,rows,{strict:true}),/week 15/);

const defenseSnapshot={source:{season:2025},teams:[{id:'D',name:'D',roster:[{id:'yahoo-def',name:'Bills',position:'DEF',nflTeam:'BUF'}]}],schedule:[{week:11,matchups:[]}],playoffWeeks:[]};
for(const projectionPosition of ['DST','D/ST']){
 const defenseRows=[{season:2025,week:11,playerId:'jerry-def',name:'Buffalo Bills',position:projectionPosition,nflTeam:'BUF',projection:8.5}];
 const defenseOut=enrichWeeklyProjections(defenseSnapshot,defenseRows);
 assert.equal(defenseOut.coverage.matched,1,`DEF roster should match ${projectionPosition} projection by team`);
 assert.equal(defenseOut.coverage.missing,0);
 assert.equal(defenseOut.league.teams[0].weeklyRosters[11][0].projection,8.5);
}

const wrongDefenseRows=[{season:2025,week:11,playerId:'jerry-def',name:'Buffalo Bills',position:'DST',nflTeam:'MIA',projection:8.5}];
const wrongDefenseOut=enrichWeeklyProjections(defenseSnapshot,wrongDefenseRows);
assert.equal(wrongDefenseOut.coverage.matched,0);
assert.equal(wrongDefenseOut.coverage.missing,1);

console.log('weekly-projection-enrichment-tests: all checks passed');
