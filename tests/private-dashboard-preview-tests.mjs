import assert from 'node:assert/strict';
import {buildPrivatePreview} from '../scripts/build-private-dashboard-preview.mjs';
import {renderDashboardV1} from '../src/ui/live-dashboard-v1.js';
import {readFileSync} from 'node:fs';
const report={readiness:{ready:true},report:{schemaVersion:11,generatedAt:'2026-10-12T12:00:00Z',team:{id:'A'},league:{playoffSpots:1,outlook:[{id:'A',name:'<\/script><img src=x onerror=alert(1)>',record:{wins:1,losses:0,ties:0},currentSeed:1,playoffProbability:.5,championshipProbability:.5,averageWins:5,seedDistribution:[]}]},outlook:{simulations:50000,seed:1},trust:{trusted:true,projections:{directWeeks:[5],longRangeWeeks:[15]},postseason:{trusted:false,reason:'Derived'}}}};
const renderer='export function renderDashboardV1(root,payload) { root.textContent=payload.teams[0].name; }';
const html=buildPrivatePreview(report,renderer);
assert.match(html,/PRIVATE \/ LOCAL ONLY/);
assert.match(html,/renderDashboardV1\(document.getElementById/);
assert.match(html,/\\u003c\/script\\u003e/);
assert.doesNotMatch(html,/<img src=x/);
assert.doesNotMatch(html,/<\/script><img/);
assert.match(html,/connect-src 'none'/);
assert.throws(()=>buildPrivatePreview({...report,readiness:{ready:false}},renderer),/readiness/);
assert.throws(()=>buildPrivatePreview(report,'no renderer'),/renderer missing/);
// End-to-end acceptance: trusted ten-team report -> allowlisted payload ->
// real renderer embedded in a strictly offline private HTML preview.
const leagueTeams=Array.from({length:10},(_,i)=>({
 id:i===0?'A':'T'+i,name:i===0?'Focus <Team>':'Synthetic '+i,
 record:{wins:6,losses:4,ties:0},currentSeed:i+1,
 playoffProbability:i<4?.9-i*.07:.52-(i-4)*.04,
 championshipProbability:i===0?.28:.11-i*.01,
 averageWins:8-i*.15,seedDistribution:[{seed:i+1,probability:.6}],
 privateApiKey:'DO_NOT_LEAK_PRIVATE_KEY'
}));
const complete={readiness:{ready:true},report:{
 ...report.report,league:{playoffSpots:8,outlook:leagueTeams},
 roster:{starters:[{id:'P1',name:'Quarterback',position:'QB',slot:'QB',projection:18,privateApiKey:'DO_NOT_LEAK_PRIVATE_KEY'}]},
 remainingSchedule:[{week:7,opponentId:'T1',opponentName:'Synthetic 1',winProbability:.51,projectionSource:'derived',simulations:500,playoffImpact:{ifWin:.7,ifLoss:.5,swing:.2,championshipIfWin:.3,championshipIfLoss:.2,championshipSwing:.1,simulations:500,privateApiKey:'DO_NOT_LEAK_PRIVATE_KEY'}},{week:8,opponentId:'T2',opponentName:'Synthetic 2',privateApiKey:'DO_NOT_LEAK_PRIVATE_KEY'}],
 recommendations:{actionCount:0,diagnostics:{evaluatedActionCount:2,rejectedActionCount:2,nearMisses:[{type:'trade',label:'Rejected trade',reason:'low-confidence',privateApiKey:'DO_NOT_LEAK_PRIVATE_KEY'}]}},
 privateApiKey:'DO_NOT_LEAK_PRIVATE_KEY'
}};
const realRenderer=readFileSync(new URL('../src/ui/live-dashboard-v1.js',import.meta.url),'utf8');
const completeHtml=buildPrivatePreview(complete,realRenderer);
assert.match(completeHtml,/function renderDashboardV1\(/);
assert.match(completeHtml,/Focus \\u003cTeam\\u003e/);
assert.match(completeHtml,/Playoff leverage comparison/);
assert.match(completeHtml,/dashboard-leverage/);
assert.match(completeHtml,/connect-src 'none'/);
assert.match(completeHtml,/form-action 'none'/);
assert.doesNotMatch(completeHtml,/DO_NOT_LEAK_PRIVATE_KEY/);
assert.doesNotMatch(completeHtml,/<script[^>]*src=/);
assert.doesNotMatch(completeHtml,/<img src=/);
const captured={innerHTML:'',querySelector(){return {set innerHTML(value){captured.detail=value;}};}};
renderDashboardV1(captured,(await import('../src/ui/live-dashboard-export.js')).weeklyReportToDashboardV1(complete.report));
assert.equal((captured.innerHTML.match(/data-team-id="/g)||[]).length,10);
assert.match(captured.innerHTML,/Focus &lt;Team&gt;/);
assert.match(captured.innerHTML,/Week 8/);
assert.match(captured.innerHTML,/GM decision review/);
assert.doesNotMatch(captured.innerHTML,/NaN|Infinity|DO_NOT_LEAK_PRIVATE_KEY/);
console.log('private-dashboard-preview-tests: all checks passed');
