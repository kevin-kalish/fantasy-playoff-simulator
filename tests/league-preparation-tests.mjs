import assert from 'node:assert/strict';
import {prepareLeagueSimulation} from '../src/model/league-preparation.js';

const snapshot={source:{season:2026},lineupSlots:['DST'],playoffWeeks:[],schedule:[{week:4,homeTeamId:'a',awayTeamId:'b'},{week:7,homeTeamId:'a',awayTeamId:'b'}],teams:[{id:'a',name:'A',roster:[{id:'rams',name:'Rams',position:'DST',nflTeam:'LAR'}]},{id:'b',name:'B',roster:[{id:'eagles',name:'Eagles',position:'DST',nflTeam:'PHI'}]}]};
const projections=[{week:4,playerId:'rams',name:'Rams',position:'DST',projection:8},{week:4,playerId:'eagles',name:'Eagles',position:'DST',projection:8}];
const seasonProjectionRows=[{name:'Los Angeles Rams',position:'DST',projection:9},{name:'Philadelphia Eagles',position:'DST',projection:10}];
const result=prepareLeagueSimulation(snapshot,projections,{weeks:[4],seasonProjectionRows,simulations:10});
assert.equal(result.diagnostics.seasonProjectionCoverage.matched,2);
assert.equal(result.diagnostics.seasonProjectionCoverage.missing.length,0);
console.log('league-preparation-tests: all checks passed');
