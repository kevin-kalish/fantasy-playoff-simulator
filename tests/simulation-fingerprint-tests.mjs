import assert from 'node:assert/strict';
import {simulationFingerprint} from '../src/model/simulation-fingerprint.js';

const input={teams:[{id:'a',weeklyLineups:{4:[{id:'p1',projection:10,position:'RB'}]}}],schedule:[{week:4,matchups:[['a','b']]}],playoffSpots:1,playoffWeeks:[15],simulations:50000,seed:20260923,modelVariant:'correlated',metadata:{provider:'one'}};
const reordered={modelVariant:'correlated',seed:20260923,simulations:50000,playoffWeeks:[15],playoffSpots:1,schedule:[{matchups:[['a','b']],week:4}],teams:[{weeklyLineups:{4:[{position:'RB',projection:10,id:'p1'}]},id:'a'}],metadata:{provider:'two',diagnostic:'ignored'}};
assert.equal(simulationFingerprint(input),simulationFingerprint(reordered));
assert.equal(simulationFingerprint(input).length,16);
const changed=structuredClone(input);changed.teams[0].weeklyLineups[4][0].projection=10.1;
assert.notEqual(simulationFingerprint(input),simulationFingerprint(changed));
const changedSeed=structuredClone(input);changedSeed.seed++;
assert.notEqual(simulationFingerprint(input),simulationFingerprint(changedSeed));
console.log('simulation-fingerprint-tests: all checks passed');
