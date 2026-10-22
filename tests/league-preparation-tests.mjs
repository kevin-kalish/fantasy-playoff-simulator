import assert from 'node:assert/strict';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';

const snapshot={source:{season:2026},lineupSlots:['DEF'],playoffSpots:2,playoffWeeks:[15],schedule:[{week:4,matchups:[['a','b']]},{week:7,matchups:[['a','b']]}],teams:[{id:'a',name:'A',roster:[{id:'rams',name:'Rams',position:'DEF',nflTeam:'LAR'}]},{id:'b',name:'B',roster:[{id:'eagles',name:'Eagles',position:'DEF',nflTeam:'PHI'}]}]};
const projections=[{week:4,playerId:'rams',name:'Rams',position:'DEF',projection:8},{week:4,playerId:'eagles',name:'Eagles',position:'DEF',projection:8}];
const seasonProjectionRows=[{name:'Los Angeles Rams',position:'DST',projection:9},{name:'Philadelphia Eagles',position:'DST',projection:10}];
const result=prepareLeagueSimulation(snapshot,projections,{weeks:[4],seasonProjectionRows,simulations:10});
assert.equal(result.diagnostics.seasonProjectionCoverage.matched,2);
assert.deepEqual(result.diagnostics.seasonProjectionCoverage.byPosition.DEF,{eligible:2,matched:2,missing:0,matchRate:1});
assert.equal(result.diagnostics.seasonProjectionCoverage.missing.length,0);
assert.equal(result.diagnostics.longRangeConfidence.method,'horizon-decay-v1');
assert.equal(result.diagnostics.longRangeConfidence.byWeek[4],1);
assert.ok(result.diagnostics.longRangeConfidence.byWeek[7]<1);
assert.ok(result.diagnostics.longRangeConfidence.byWeek[15]<result.diagnostics.longRangeConfidence.byWeek[7]);
assert.equal(result.input.metadata.longRangeConfidence.byWeek[15],result.diagnostics.longRangeConfidence.byWeek[15]);
assert.ok(result.league.teams[0].weeklyRosters[15][0].projectionConfidence<result.league.teams[0].weeklyRosters[7][0].projectionConfidence);
const partial={source:{season:2026},lineupSlots:['RB','RB'],playoffSpots:2,playoffWeeks:[15],schedule:[{week:6,matchups:[['a','b']]}],teams:[
 {id:'a',name:'A',roster:[{id:'r1',name:'Runner One',position:'RB'},{id:'r2',name:'Runner Two',position:'RB'}],weeklyLineups:{6:[{id:'r1',name:'Runner One',position:'RB',lineupSlot:'RB'}]}},
 {id:'b',name:'B',roster:[{id:'r3',name:'Runner Three',position:'RB'},{id:'r4',name:'Runner Four',position:'RB'}],weeklyLineups:{6:[{id:'r3',name:'Runner Three',position:'RB',lineupSlot:'RB'},{id:'r4',name:'Runner Four',position:'RB',lineupSlot:'RB'}]}}
]};
const partialRows=['r1','r2','r3','r4'].map((id,i)=>({season:2026,week:6,playerId:id,name:['Runner One','Runner Two','Runner Three','Runner Four'][i],position:'RB',projection:10+i}));
const actual=prepareLeagueSimulation(partial,partialRows,{weeks:[6],simulations:100,lineupPolicy:'submitted'});
const hypothetical=prepareLeagueSimulation(partial,partialRows,{weeks:[6],simulations:100,lineupPolicy:'optimized-hypothetical'});
assert.equal(actual.diagnostics.incompleteLineups.find(x=>x.teamId==='a').emptySlots,1);
assert.equal(actual.diagnostics.seasonProjectionCoverage.byPosition.RB.missing,4);
assert.equal(actual.league.teams[0].weeklyLineups[6].length,1);
assert.equal(hypothetical.league.teams[0].weeklyLineups[6].length,2);
assert.equal(hypothetical.league.teams[0].submittedWeeklyLineups[6].length,1);
assert.ok(!hypothetical.diagnostics.incompleteLineups.some(x=>x.teamId==='a'));
assert.equal(hypothetical.input.metadata.lineupPolicy,'optimized-hypothetical');
console.log('league-preparation-tests: all checks passed');
