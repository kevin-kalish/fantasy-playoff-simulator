import assert from 'node:assert/strict';
import {inventoryFutureRosterCandidates} from '../src/model/future-roster-candidate-inventory.js';
const gaps=[{teamName:'Alpha',week:11,slots:[{slot:'K',reason:'all-eligible-on-bye'},{slot:'RB/WR/TE',reason:'insufficient-usable-eligible-players'}]}];
const candidates=[{id:'1',position:'K'},{id:'2',position:'WR'},{id:'3',position:'QB',positions:['QB','TE']}];
const result=inventoryFutureRosterCandidates(gaps,candidates);
assert.equal(result.length,1);
assert.equal(result[0].slots[0].positionMatches,1);
assert.equal(result[0].slots[1].positionMatches,2);
assert.equal(result[0].slots[0].verifiedWeekProjectionMatches,0);
assert.equal(result[0].slots[0].projectionEvidence,'not-checked');
assert.equal(result[0].slots[0].replacementAssumed,false);
assert.equal(inventoryFutureRosterCandidates(gaps,[])[0].slots[0].positionMatches,0);
assert.equal(inventoryFutureRosterCandidates([],candidates).length,0);
const audited=inventoryFutureRosterCandidates([{teamName:'A',week:14,slots:[{slot:'K',reason:'bye'}]}],[
 {id:'a',position:'K',byeWeek:14,status:'ACTIVE'},
 {id:'b',position:'K',byeWeek:13,status:'OUT'},
 {id:'c',position:'K',status:''},
 {id:'d',position:'K',byeWeek:0,status:'ACTIVE'}
])[0].slots[0];
assert.equal(audited.positionMatches,4);
assert.equal(audited.knownByeWeek,3);
assert.equal(audited.onBye,1);
assert.equal(audited.offBye,2);
assert.equal(audited.unknownByeWeek,1);
assert.equal(audited.currentStatusKnown,3);
assert.equal(audited.currentStatusUnavailable,1);
assert.equal(audited.currentStatusUnknown,1);
assert.equal(audited.futureAvailabilityVerified,0);
assert.equal(audited.verifiedWeekProjectionMatches,0);
console.log('future-roster-candidate-inventory-tests: all checks passed');
