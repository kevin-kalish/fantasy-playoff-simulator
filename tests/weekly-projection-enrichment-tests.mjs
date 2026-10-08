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

const ramsSnapshot={source:{season:2025},teams:[{id:'R',name:'R',roster:[{id:'yahoo-rams',name:'Rams',position:'DEF',nflTeam:'LAR'}]}],schedule:[{week:11,matchups:[]}],playoffWeeks:[]};
const ramsRows=[{season:2025,week:11,playerId:'jerry-rams',name:'Los Angeles Rams',position:'DST',nflTeam:'LA',projection:7.25}];
const ramsOut=enrichWeeklyProjections(ramsSnapshot,ramsRows);
assert.equal(ramsOut.coverage.matched,1,'LAR roster should match LA projection team alias');
assert.equal(ramsOut.coverage.missing,0);
assert.equal(ramsOut.league.teams[0].weeklyRosters[11][0].projection,7.25);

const patriotsSnapshot={source:{season:2025},teams:[{id:'NE',name:'NE',roster:[{id:'yahoo-ne',name:'Patriots',position:'DEF',nflTeam:'NE'}]}],schedule:[{week:11,matchups:[]}],playoffWeeks:[]};
for(const providerTeam of ['NEP','NWE']){
 const result=enrichWeeklyProjections(patriotsSnapshot,[{season:2025,week:11,playerId:'provider-ne',name:'New England Patriots',position:'DST',nflTeam:providerTeam,projection:7.5}]);
 assert.equal(result.coverage.matched,1,`Patriots DEF should match provider team ${providerTeam}`);
 assert.equal(result.league.teams[0].weeklyRosters[11][0].projection,7.5);
}
const missingDefenseSnapshot={source:{season:2025},teams:[{id:'M',name:'Missing',roster:[{id:'missing-ne',name:'Patriots',position:'DEF',nflTeam:'NE'}]}],schedule:[{week:11,matchups:[]}],playoffWeeks:[]};
const medianRows=[{season:2025,week:11,name:'Bills',position:'DST',nflTeam:'BUF',projection:6},{season:2025,week:11,name:'Rams',position:'DEF',nflTeam:'LAR',projection:10}];
const imputed=enrichWeeklyProjections(missingDefenseSnapshot,medianRows);
assert.equal(imputed.coverage.imputedCount,1);
assert.equal(imputed.coverage.missing,0);
assert.equal(imputed.coverage.imputations[0].method,'weekly-defense-median');
assert.equal(imputed.league.teams[0].weeklyRosters[11][0].projection,8);
assert.equal(imputed.league.teams[0].weeklyRosters[11][0].projectionStatus,'imputed-defense');
const noDefense=enrichWeeklyProjections(missingDefenseSnapshot,[]);
assert.equal(noDefense.coverage.missing,1,'Do not invent defense projections without a valid peer median');
const injurySnapshot={source:{season:2025},teams:[{id:'I',name:'Injured',roster:[{id:'baker',name:'Baker Mayfield',position:'QB',nflTeam:'TB',status:'OUT'},{id:'q',name:'Questionable WR',position:'WR',nflTeam:'TB',status:'QUESTIONABLE'}]}],schedule:[{week:11,matchups:[]}],playoffWeeks:[]};
const injuryRows=[{season:2025,week:11,playerId:'baker',name:'Baker Mayfield',position:'QB',nflTeam:'TB',projection:13.12,status:'ACTIVE'},{season:2025,week:11,playerId:'q',name:'Questionable WR',position:'WR',nflTeam:'TB',projection:8,status:'ACTIVE'}];
const injury=enrichWeeklyProjections(injurySnapshot,injuryRows);
assert.equal(injury.league.teams[0].weeklyRosters[11][0].projection,0);
assert.equal(injury.league.teams[0].weeklyRosters[11][0].rawProjection,13.12);
assert.equal(injury.league.teams[0].weeklyRosters[11][0].status,'OUT');
assert.equal(injury.coverage.unavailableCount,1);
assert.equal(injury.coverage.availabilityAudit.length,2);
assert.equal(injury.league.teams[0].weeklyRosters[11][1].status,'QUESTIONABLE');
const providerOut=enrichWeeklyProjections({...injurySnapshot,teams:[{...injurySnapshot.teams[0],roster:[{...injurySnapshot.teams[0].roster[0],status:'ACTIVE'}]}]},[injuryRows[0]&&{...injuryRows[0],status:'IR'}]);
assert.equal(providerOut.league.teams[0].weeklyRosters[11][0].projection,0);
assert.equal(providerOut.league.teams[0].weeklyRosters[11][0].status,'IR');
console.log('weekly-projection-enrichment-tests: all checks passed');
