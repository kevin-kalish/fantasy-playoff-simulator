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
assert.throws(()=>enrichWeeklyProjections(snapshot,rows,{strict:true}),/week 15/);
console.log('weekly-projection-enrichment-tests: all checks passed');
