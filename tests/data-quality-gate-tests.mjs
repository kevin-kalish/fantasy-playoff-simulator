import assert from 'node:assert/strict';
import {assessRecommendationDataQuality} from '../src/model/data-quality-gate.js';

const good={teams:[{id:'A',name:'Alpha',roster:[{id:'P1',name:'One'}]},{id:'B',name:'Bravo',roster:[{id:'P2',name:'Two'}]}],schedule:[{week:11,matchups:[['A','B']]}],playoffWeeks:[13],calibration:{},nflGames:[{id:'G1'}],metadata:{lineupSlots:['QB'],rosterProjectionCoverage:{total:2,matched:2,usable:2,missing:0,bye:0,matchRate:1,weeks:[11]},incompleteLineups:[]}};
const pass=assessRecommendationDataQuality(good,{teamId:'A',week:11,projectionRows:[{playerId:'P1',week:11,projection:10},{playerId:'P2',week:11,projection:9}]});
assert.equal(pass.passed,true);assert.equal(pass.status,'PASS');

const low={...good,metadata:{...good.metadata,rosterProjectionCoverage:{...good.metadata.rosterProjectionCoverage,matchRate:.5}}};
const blocked=assessRecommendationDataQuality(low,{teamId:'A',week:11});
assert.equal(blocked.passed,false);assert.ok(blocked.blockingCodes.includes('LOW_PROJECTION_COVERAGE'));

const duplicate={...good,teams:[good.teams[0],{...good.teams[1],roster:[{id:'P1',name:'One'}]}]};
const dup=assessRecommendationDataQuality(duplicate,{teamId:'A',week:11});
assert.equal(dup.passed,false);assert.ok(dup.blockingCodes.includes('PLAYER_ON_MULTIPLE_TEAMS'));
console.log('data-quality-gate-tests: all checks passed');
