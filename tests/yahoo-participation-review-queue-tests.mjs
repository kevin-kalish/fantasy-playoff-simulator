import assert from 'node:assert/strict';
import {buildParticipationReviewQueue} from '../src/data/yahoo-participation-review-queue.js';
const row=(week,id,actual=0,participation='unverified',position='WR',team='NE')=>({
  season:2026,week,yahooPlayerId:id,name:'Fixture Player',position,nflTeam:team,
  yahooActual:actual,participation,category:'known-player-no-same-week-record'
});
const readiness=[1,2,3,4,5,6].map(week=>({season:2026,week,status:week===6?'provisional-five-day-buffer':'team-coverage-ready'}));
const games=[1,2,3,4,5].map(week=>({season:2026,week,home_team:'NE',away_team:'NYJ'}));
const queue=buildParticipationReviewQueue([
  row(4,'rb',0,'unverified','RB'),
  row(5,'wr'),row(2,'bye',0,'unverified','WR','DET'),
  row(3,'verified',0,'scheduled-bye'),row(1,'nonzero',4),
  row(6,'provisional'),row(1,'matched',0,'matched')
],readiness,games);
assert.equal(queue.summary.total,3);
assert.equal(queue.summary.teamScheduled,2);
assert.equal(queue.summary.teamNotScheduled,1);
assert.equal(queue.summary.unverified,3);
assert.equal(queue.summary.sourceNotReady,0);
assert.deepEqual(queue.records.map(r=>r.yahooPlayerId),['wr','rb','bye']);
assert.ok(queue.records.every(r=>r.reviewStatus==='unverified'&&r.evidenceRequired===true));
assert.ok(queue.records.every(r=>!('verified' in r)));
assert.equal(queue.records.find(r=>r.yahooPlayerId==='bye').scheduleClassification,'team-not-scheduled');
assert.throws(()=>buildParticipationReviewQueue(null,readiness,games));
// Rams are LA in nflverse schedule and LAR in Yahoo player records.
const rams=buildParticipationReviewQueue([
  row(2,'lar-week2',0,'unverified','WR','LAR'),
  row(3,'lar-week3',0,'unverified','WR','LAR')
],readiness,[
  {season:2026,week:2,home_team:'LA',away_team:'NYG'},
  {season:2026,week:3,home_team:'DEN',away_team:'LA'}
]);
assert.equal(rams.summary.total,2);
assert.equal(rams.summary.teamScheduled,2);
assert.equal(rams.summary.teamNotScheduled,0);
assert.ok(rams.records.every(r=>r.reviewStatus==='unverified'&&r.evidenceRequired));
assert.ok(rams.records.every(r=>r.nflTeam==='LAR'));
console.log('yahoo-participation-review-queue-tests: all checks passed');
