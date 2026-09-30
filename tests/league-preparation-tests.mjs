import assert from 'node:assert/strict';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';

const snapshot={source:{season:2026},lineupSlots:['DEF'],playoffSpots:2,playoffWeeks:[15],schedule:[{week:4,matchups:[['a','b']]},{week:7,matchups:[['a','b']]}],teams:[{id:'a',name:'A',roster:[{id:'rams',name:'Rams',position:'DEF',nflTeam:'LAR'}]},{id:'b',name:'B',roster:[{id:'eagles',name:'Eagles',position:'DEF',nflTeam:'PHI'}]}]};
const projections=[{week:4,playerId:'rams',name:'Rams',position:'DEF',projection:8},{week:4,playerId:'eagles',name:'Eagles',position:'DEF',projection:8}];
const seasonProjectionRows=[{name:'Los Angeles Rams',position:'DST',projection:9},{name:'Philadelphia Eagles',position:'DST',projection:10}];
const result=prepareLeagueSimulation(snapshot,projections,{weeks:[4],seasonProjectionRows,simulations:10});
assert.equal(result.diagnostics.seasonProjectionCoverage.matched,2);
assert.equal(result.diagnostics.seasonProjectionCoverage.missing.length,0);
assert.equal(result.diagnostics.longRangeConfidence.method,'horizon-decay-v1');
assert.equal(result.diagnostics.longRangeConfidence.byWeek[4],1);
assert.ok(result.diagnostics.longRangeConfidence.byWeek[7]<1);
assert.ok(result.diagnostics.longRangeConfidence.byWeek[15]<result.diagnostics.longRangeConfidence.byWeek[7]);
assert.equal(result.input.metadata.longRangeConfidence.byWeek[15],result.diagnostics.longRangeConfidence.byWeek[15]);
assert.ok(result.league.teams[0].weeklyRosters[15][0].projectionConfidence<result.league.teams[0].weeklyRosters[7][0].projectionConfidence);
console.log('league-preparation-tests: all checks passed');
