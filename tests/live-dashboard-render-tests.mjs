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
payload.matchup = {week:5,opponentName:'Bravo',winProbability:.6,simulatedMean:105,opponentMean:100,impact:{win:{playoffProbability:.8,championshipProbability:.25},loss:{playoffProbability:.5,championshipProbability:.15},simulations:5000}};
const root = {innerHTML: '', querySelector() {return {set innerHTML(value) {root.detailHTML=value;}};}};
renderDashboardV1(root, payload);
assert.match(root.innerHTML, /80\\.0%/);
assert.match(root.innerHTML,/data-dashboard-tab="history"/);
assert.match(root.innerHTML,/No recorded weekly playoff probability snapshots yet/);
renderDashboardV1(root,{...payload,playoffHistory:[{week:0,probability:.8,result:null},{week:1,probability:.6,result:'L'},{week:2,probability:.75,result:'W'}]});
assert.match(root.innerHTML,/Weekly playoff probability history/);
assert.match(root.innerHTML,/Week 2/);
assert.match(root.innerHTML,/-20.0 pp/);
assert.match(root.innerHTML,/15.0 pp/);
assert.match(root.innerHTML,/role="tabpanel" aria-labelledby="tab-history" hidden/);
renderDashboardV1(root,payload);
assert.match(root.innerHTML, /Expected final wins/);
assert.match(root.innerHTML, /aria-label="Dashboard sections"/);
assert.match(root.innerHTML, /href="#dashboard-matchup"/);
assert.match(root.innerHTML, /href="#dashboard-schedule"/);
assert.match(root.innerHTML, /href="#dashboard-leverage"/);
assert.match(root.innerHTML, /href="#dashboard-race"/);
assert.doesNotMatch(root.innerHTML, /href="#dashboard-gm"/);
assert.match(root.innerHTML, /<section id="dashboard-race"/);
assert.match(root.innerHTML, /Projection reliability:/);
assert.match(root.innerHTML, /Derived or cached forecasts may reduce confidence/);
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
assert.match(root.innerHTML,/simultaneous 95% Monte Carlo error bounds/);
assert.match(root.innerHTML,/pairwise screen/);
const championshipRanked={...payload,remainingSchedule:[
 {...payload.remainingSchedule[0],week:8,opponentName:'Low title impact',playoffImpact:{...payload.remainingSchedule[0].playoffImpact,championshipSwing:.02}},
 {...payload.remainingSchedule[0],week:9,opponentName:'High title impact',playoffImpact:{...payload.remainingSchedule[0].playoffImpact,swing:.10,championshipSwing:.15}}
]};
renderDashboardV1(root,championshipRanked);
assert.ok(root.innerHTML.indexOf('Low title impact')<root.innerHTML.indexOf('High title impact'));
assert.match(root.innerHTML,/Playoff leverage comparison/);
assert.match(root.innerHTML,/Making the playoffs/);
assert.match(root.innerHTML,/Winning the championship/);
assert.match(root.innerHTML,/top playoff and championship leverage games differ/i);
assert.match(root.innerHTML,/Championship leverage is PROVISIONAL/);
assert.match(root.innerHTML,/Too close to distinguish from #1/);
assert.match(root.innerHTML,/Pairwise 95% Monte Carlo bounds/);
assert.match(root.innerHTML,/#2 · Week 8/);
assert.match(root.innerHTML,/#2 · Week 9/);

assert.ok(root.innerHTML.indexOf('High title impact') > root.innerHTML.indexOf('Low title impact'));
assert.match(root.innerHTML,/data-schedule-order="chronological" aria-pressed="true"/);
assert.match(root.innerHTML,/data-schedule-order="impact" aria-pressed="false"/);
assert.match(root.innerHTML,/Chronological order is the default/);
assert.match(root.innerHTML,/Impact ranking sorts by conditional championship-probability swing/);
assert.match(root.innerHTML, /PROVISIONAL/);
assert.match(root.innerHTML, /&lt;Alpha&gt;/);
assert.doesNotMatch(root.innerHTML, /<Alpha>/);
assert.match(root.innerHTML, /Bravo/);
assert.match(root.detailHTML, /Seed probabilities/);
assert.match(root.detailHTML, /Starting lineup/);
const gmPayload={...payload,gmDiagnostics:{evaluated:42,approved:0,rejected:42,confirmation:{passed:0},coverageConstrained:true,noActionExplanation:'No action cleared the gate',rejectionCounts:{'low-confidence':36},nearMisses:[{type:'trade',label:'Trade <unsafe>',reason:'low-confidence',explanation:'Insufficient <evidence> to confirm',confidence:'low',playoffDelta:-.008,championshipDelta:.012}]}};
renderDashboardV1(root,gmPayload);
assert.match(root.innerHTML,/GM decision review/);
assert.match(root.innerHTML, /href="#dashboard-gm"/);
assert.match(root.innerHTML, /<section id="dashboard-gm"/);
assert.match(root.innerHTML,/No approved recommendations available for publication/);
assert.match(root.innerHTML,/42 actions screened/);
assert.match(root.innerHTML,/No action cleared the gate/);
assert.match(root.innerHTML,/Near misses \(not actionable\)/);
assert.match(root.innerHTML,/Trade &lt;unsafe&gt;/);
assert.doesNotMatch(root.innerHTML,/Trade <unsafe>/);
assert.match(root.innerHTML,/Insufficient &lt;evidence&gt; to confirm/);
assert.match(root.innerHTML,/Confidence: low/);
assert.doesNotMatch(root.innerHTML,/Insufficient <evidence>/);
// Ten-team offline stress fixture: tight bubble, diverse title odds and partial forecasts.
const tenTeams=Array.from({length:10},(_,i)=>({
  id: i===0?'A':'T'+i, name:'Synthetic Team '+(i+1),
  record:{wins:5+(i%3),losses:5-(i%3),ties:0},currentSeed:i+1,
  averageWins:i===4?null:7+(9-i)*.17,
  playoffProbability:i<4?.95-i*.07:.54-(i-4)*.018,
  championshipProbability:i===0?.52:i===9?.001:.12-i*.01,
  seedDistribution:[{seed:i+1,probability:.7}]
}));
const stressSchedule=Array.from({length:8},(_,i)=>({
  week:7+i,opponentName:'Opponent '+i,opponentId:'T'+(i+1),
  winProbability:i===3?null:.48+i*.02,projectionSource:i%2?'derived':'cached',simulations:500,
  playoffImpact:i===3?{swing:null,championshipSwing:null,simulations:0}:{swing:.2-i*.003,championshipSwing:i%3===0?null:.08-i*.002,simulations:500}
}));
renderDashboardV1(root,{...payload,teams:tenTeams,remainingSchedule:stressSchedule,matchup:null,gmDiagnostics:null});
assert.equal((root.innerHTML.match(/data-team-id="/g)||[]).length,10);
assert.match(root.innerHTML,/Synthetic Team 10/);
assert.match(root.innerHTML,/No weekly matchup analysis is available/);
assert.match(root.innerHTML,/Scheduled/);
assert.match(root.innerHTML,/Playoff leverage comparison/);
assert.match(root.innerHTML,/Too close to distinguish from #1/);
assert.doesNotMatch(root.innerHTML,/NaN|Infinity/);
assert.doesNotMatch(root.innerHTML,/Playoff swing — pp/);
assert.doesNotMatch(root.innerHTML,/href="#dashboard-gm"/);
assert.throws(() => renderDashboardV1(root, {...payload, schemaVersion: 99}), /Unsupported/);
assert.throws(() => renderDashboardV1(root, {...payload, league: {userTeamId: 'missing'}}), /Focus team missing/);
console.log('live-dashboard-render-tests: all checks passed');
