import assert from 'node:assert/strict';
import {renderDashboardV1} from '../src/ui/live-dashboard-v1.js';

const payload = {
  schemaVersion: 1, mode: 'live', generatedAt: '2026-10-08T14:00:00Z',
  league: {userTeamId: 'A'},
  model: {simulations: 50000, championshipStatus: 'provisional', directWeeks: [5, 6], derivedWeeks: [7]},
  teams: [
    {id: 'A', name: '<Alpha>', record: {wins: 3, losses: 1, ties: 0}, currentSeed: 1, averageWins: 7.2, playoffProbability: .8, championshipProbability: .2},
    {id: 'B', name: 'Bravo', record: {wins: 2, losses: 2, ties: 0}, currentSeed: 2, averageWins: 6.1, playoffProbability: .6, championshipProbability: .1}
  ]
};
payload.remainingSchedule = [{week:6,opponentName:'Bravo',opponentId:'B',winProbability:.65,projectionSource:'derived',simulations:1000,playoffImpact:{ifWin:.8,ifLoss:.5,swing:.3,championshipIfWin:.3,championshipIfLoss:.2,championshipSwing:.1,simulations:500}}];
payload.matchup = {week:5,opponentName:'Bravo',winProbability:.6,simulatedMean:105,opponentMean:100,impact:{win:{playoffProbability:.8},loss:{playoffProbability:.5},simulations:5000}};
const root = {innerHTML: '', querySelector() {return {set innerHTML(value) {root.detailHTML=value;}};}};
renderDashboardV1(root, payload);
assert.match(root.innerHTML, /80\.0%/);
assert.match(root.innerHTML, /30.0 pp/);
assert.match(root.innerHTML, /Week 5 matchup/);
assert.match(root.innerHTML, /Remaining schedule/);
assert.match(root.innerHTML, /Week 6/);
assert.match(root.innerHTML, /65.0%/);
assert.match(root.innerHTML, /Playoff swing 30.0 pp/);
assert.match(root.innerHTML, /Championship swing 10.0 pp/);
assert.match(root.innerHTML, /derived/);
const closePayload={...payload,remainingSchedule:[payload.remainingSchedule[0],{...payload.remainingSchedule[0],week:7,playoffImpact:{ifWin:.79,ifLoss:.50,swing:.29,simulations:500}}]};
renderDashboardV1(root,closePayload);
assert.match(root.innerHTML,/Close playoff rankings: 2 games/);
assert.match(root.innerHTML,/95% Monte Carlo error bound/);
const championshipRanked={...payload,remainingSchedule:[
 {...payload.remainingSchedule[0],week:8,opponentName:'Low title impact',playoffImpact:{...payload.remainingSchedule[0].playoffImpact,championshipSwing:.02}},
 {...payload.remainingSchedule[0],week:9,opponentName:'High title impact',playoffImpact:{...payload.remainingSchedule[0].playoffImpact,swing:.10,championshipSwing:.15}}
]};
renderDashboardV1(root,championshipRanked);
assert.ok(root.innerHTML.indexOf('High title impact')<root.innerHTML.indexOf('Low title impact'));
assert.match(root.innerHTML,/ranked by conditional championship-probability swing/);
assert.match(root.innerHTML, /PROVISIONAL/);
assert.match(root.innerHTML, /&lt;Alpha&gt;/);
assert.doesNotMatch(root.innerHTML, /<Alpha>/);
assert.match(root.innerHTML, /Bravo/);
assert.match(root.detailHTML, /Seed probabilities/);
assert.match(root.detailHTML, /Starting lineup/);
assert.throws(() => renderDashboardV1(root, {...payload, schemaVersion: 99}), /Unsupported/);
assert.throws(() => renderDashboardV1(root, {...payload, league: {userTeamId: 'missing'}}), /Focus team missing/);
console.log('live-dashboard-render-tests: all checks passed');
