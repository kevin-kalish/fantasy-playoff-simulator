import assert from 'node:assert/strict';
import {normalizeWaiverCandidate,buildWaiverCandidatePool} from '../src/data/waiver-candidate-source.js';

const normalized=normalizeWaiverCandidate({player_key:'449.p.123',name:'Example Back',eligiblePositions:['RB','W/R/T'],editorial_team_abbr:'BUF',percent_owned:'42'},'yahoo');
assert.equal(normalized.id,'449.p.123');
assert.equal(normalized.name,'Example Back');
assert.equal(normalized.position,'RB');
assert.deepEqual(normalized.positions,['RB','W/R/T']);
assert.equal(normalized.nflTeam,'BUF');
assert.equal(normalized.percentOwned,42);
assert.equal(normalized.source,'yahoo');
assert.equal(normalizeWaiverCandidate({id:'x'},'fixture'),null);

const pool=buildWaiverCandidatePool([
 {id:'1',name:'One',position:'RB'},
 {playerId:'1',name:'Duplicate One',position:'RB'},
 {playerId:'2',fullName:'Two',position:'WR'},
 {id:'3'},
 {id:'4',name:'Four',position:'TE'}
],{source:'fixture',limit:3});
assert.equal(pool.source,'fixture');
assert.deepEqual(pool.candidates.map(p=>p.id),['1','2','4']);
assert.equal(pool.diagnostics.inputCount,5);
assert.equal(pool.diagnostics.candidateCount,3);
assert.equal(pool.diagnostics.rejectedCount,2);
console.log('waiver-candidate-source-tests: all checks passed');
