import assert from 'node:assert/strict';
import { weeklyReportToDashboardV1 } from '../src/ui/live-dashboard-export.js';
const report = {
  schemaVersion: 11, generatedAt: '2026-10-08T14:00:00Z',
  team: { id: 'A' },
  league: { playoffSpots: 1, outlook: [{ id: 'A', name: 'Alpha', record: { wins: 2, losses: 1, ties: 0 }, currentSeed: 1, playoffProbability: 0.7, championshipProbability: 0.3, averageWins: 5.4, remainingGames: 4, seedDistribution: [{ seed: 1, probability: 0.7 }] }] },
  outlook: { simulations: 50000, seed: 123 },
  trust: { trusted: true, projections: { directWeeks: [5, 6], longRangeWeeks: [7] }, postseason: { trusted: false, reason: 'Derived playoff projections' } }
};
const payload = weeklyReportToDashboardV1(report);
assert.equal(payload.schemaVersion, 1);
assert.equal(payload.model.championshipStatus, 'provisional');
assert.equal(payload.teams[0].playoffProbability, 0.7);
assert.deepEqual(payload.recommendations, []);
assert.deepEqual(payload.roster.starters, []);
assert.equal(payload.matchup, null);
assert.deepEqual(payload.remainingSchedule, []);
const scheduled = {...report, remainingSchedule:[{week:6,opponentId:'A',opponentName:'Alpha',secret:'not-exported'}]};
assert.deepEqual(weeklyReportToDashboardV1(scheduled).remainingSchedule,[{week:6,opponentId:'A',opponentName:'Alpha'}]);
const forecasted={...report,remainingSchedule:[{week:6,opponentId:'A',opponentName:'Alpha',winProbability:.65,simulations:1000,projectionSource:'derived'}]};
assert.equal(weeklyReportToDashboardV1(forecasted).remainingSchedule[0].winProbability,.65);
assert.throws(()=>weeklyReportToDashboardV1({...forecasted,remainingSchedule:[{...forecasted.remainingSchedule[0],winProbability:2}]}),/Invalid probability/);
assert.throws(() => weeklyReportToDashboardV1({...report,remainingSchedule:[{week:6,opponentId:'missing'}]}),/Invalid remaining schedule/);
const withMatchup = {...report, matchup: {week:5,teamId:'A',opponentId:'A',opponentName:'Alpha',simulated:{winProbability:.6,teamMean:105,opponentMean:100},impact:{win:{playoffProbability:.8,championshipProbability:.4,averageWins:6},loss:{playoffProbability:.5,championshipProbability:.2,averageWins:5},simulations:5000}}};
assert.equal(weeklyReportToDashboardV1(withMatchup).matchup.winProbability,.6);
assert.throws(() => weeklyReportToDashboardV1({...withMatchup,matchup:{...withMatchup.matchup,simulated:{winProbability:1.5}}}),/Invalid probability/);
assert.throws(() => weeklyReportToDashboardV1({ ...report, generatedAt: 'not-a-date' }), /timestamp/);
assert.throws(() => weeklyReportToDashboardV1({ ...report, team: {id:'missing'} }), /Focus team missing/);
const privateReport = {...report, roster: {starters: [{id:'p1',name:'Player One',position:'QB',slot:'QB',projection:18,secretToken:'never-publish'}]}, trust: {...report.trust, secretToken:'never-publish'}};
assert.equal(weeklyReportToDashboardV1(privateReport).roster.starters[0].name, 'Player One');
assert.doesNotMatch(JSON.stringify(weeklyReportToDashboardV1(privateReport)), /never-publish/);
assert.deepEqual(payload.model.directWeeks, [5, 6]);
assert.throws(() => weeklyReportToDashboardV1({ ...report, trust: { ...report.trust, trusted: false } }), /Untrusted/);
assert.throws(() => weeklyReportToDashboardV1({ ...report, league: { ...report.league, outlook: [{ ...report.league.outlook[0], playoffProbability: 1.1 }] } }), /Invalid probability/);
assert.throws(() => weeklyReportToDashboardV1({ ...report, league: { ...report.league, outlook: [report.league.outlook[0], report.league.outlook[0]] } }), /Duplicate team IDs/);
console.log('live-dashboard-export-tests: all checks passed');
