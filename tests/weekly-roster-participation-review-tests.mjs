import assert from 'node:assert/strict';
import {reviewWeeklyRosterParticipation} from '../src/data/weekly-roster-participation-review.js';
const q={schemaVersion:1,records:[
  {season:2026,week:5,yahooPlayerId:'470.p.123',name:'Fixture A',position:'RB',nflTeam:'JAX',yahooActual:0,reviewStatus:'unverified'},
  {season:2026,week:5,yahooPlayerId:'470.p.456',name:'Fixture B',position:'WR',nflTeam:'NYJ',yahooActual:0,reviewStatus:'unverified'},
  {season:2026,week:5,yahooPlayerId:'470.p.789',name:'Fixture C',position:'RB',nflTeam:'CHI',yahooActual:0,reviewStatus:'unverified'}
]};
const rows=[
  {season:2026,week:5,yahoo_id:'123',team:'JAC',status:'RES'},
  {season:2026,week:5,yahoo_id:'456',team:'BUF',status:'ACT'},
  {season:2026,week:5,yahoo_id:'456',team:'NYJ',status:'INA'}
];
const result=reviewWeeklyRosterParticipation(q,rows);
assert.deepEqual(result.records.map(r=>r.classification),['roster-status-candidate','ambiguous-weekly-roster','missing-weekly-roster']);
assert.equal(result.records[0].rosterStatus,'RES');
assert.deepEqual(result.summary.byStatus, {RES:1,'(missing)':2});
assert.equal(result.summary.byWeek['5']['(missing)'],2);
assert.equal(result.records[1].rosterStatus,null);
assert.equal(result.summary.reviewBucketCounts.reserveSnapshot,1);
assert.equal(result.summary.reviewBucketCounts.identityOrCoverageException,2);
assert.equal(result.records[0].reviewBucket,'reserveSnapshot');
assert.equal(result.records[1].reviewBucket,'identityOrCoverageException');
assert.equal(result.summary.byWeek['5'].RES,1);
assert.equal(result.summary.byPosition.RB.RES,1);
assert.ok(result.records.every(r=>r.verified===false && r.reviewRequired===true));
assert.equal(reviewWeeklyRosterParticipation({schemaVersion:1,records:[q.records[1]]},[rows[1]]).records[0].classification,'team-identity-conflict');
assert.throws(()=>reviewWeeklyRosterParticipation({...q,records:[{...q.records[0],yahooActual:5}]},rows),/ineligible/);
assert.throws(()=>reviewWeeklyRosterParticipation(q,null),/Invalid/);
console.log('weekly-roster-participation-review-tests: all checks passed');
