import { createDemoLeague } from './demo-data.js';
import { simulateLeague, simulatePlayer } from './simulator.js';
import { applyScenarioToWeek } from './scenarios.js';
import { createSeededRng } from './random.js';

const DEFAULT_SIMULATIONS=10000, DEFAULT_SEED=20260923;
const pct=v=>`${((v||0)*100).toFixed(1)}%`;
const signedPct=v=>`${(v||0)>=0?'+':''}${((v||0)*100).toFixed(1)} pts`;
const teamById=(league,id)=>league.teams.find(t=>t.id===id);

export function runDemo({simulations=DEFAULT_SIMULATIONS,seed=DEFAULT_SEED,league=createDemoLeague()}={}){return simulateLeague({...league,simulations,seed})}
function nextMatchup(league,teamId){for(const week of league.schedule){for(const [a,b] of week.matchups){if(a===teamId||b===teamId)return{week:week.week,opponentId:a===teamId?b:a,a,b}}}return null}
function seedBars(r){return r.seedProbability.map((p,i)=>`<div class="seed-row"><span>#${i+1}</span><div class="bar"><i style="width:${p*100}%"></i></div><strong>${pct(p)}</strong></div>`).join('')}
function scheduleRows(league,id){return league.schedule.map(w=>{const m=w.matchups.find(x=>x.includes(id));if(!m)return'';const opp=teamById(league,m[0]===id?m[1]:m[0]);return`<button class="schedule-row" data-week="${w.week}"><span>Week ${w.week}</span><strong>${opp.name}</strong><em>View</em></button>`}).join('')}

function matchupAnalysis(league,teamId,weekNumber,simulations=5000,seed=DEFAULT_SEED){
 const week=league.schedule.find(w=>w.week===weekNumber), m=week?.matchups.find(x=>x.includes(teamId)); if(!m)return null;
 const a=teamById(league,m[0]),b=teamById(league,m[1]),rng=createSeededRng(seed+weekNumber);let aw=0,bw=0,as=0,bs=0;
 for(let n=0;n<simulations;n++){const score=t=>(t.weeklyLineups?.[weekNumber]||t.lineup||[]).reduce((s,p)=>s+simulatePlayer(p.projection||0,p.position,rng,p.cv),0);const sa=score(a),sb=score(b);as+=sa;bs+=sb;if(sa>=sb)aw++;else bw++}
 return{week:weekNumber,a,b,aWin:aw/simulations,bWin:bw/simulations,aAvg:as/simulations,bAvg:bs/simulations};
}
function lineupHtml(team){return(team.lineup||[]).map(p=>`<div class="player-row"><span>${p.position}</span><strong>${p.name}</strong><em>${p.projection.toFixed(1)} proj</em></div>`).join('')}
function forcedScenario(league,teamId,winnerId,simulations,seed){const next=nextMatchup(league,teamId);if(!next)return null;const schedule=league.schedule.map(w=>w.week===next.week?applyScenarioToWeek(w,{forcedWinners:{[`${next.a}:${next.b}`]:winnerId}}):w);return simulateLeague({...league,schedule,simulations,seed}).find(r=>r.id===teamId)}

export function renderDashboard(root,{simulations=DEFAULT_SIMULATIONS,seed=DEFAULT_SEED}={}){
 const league=createDemoLeague(),results=runDemo({simulations,seed,league});let selected=results[0].id,selectedWeek=null;
 function render(){
  const sorted=[...results].sort((a,b)=>b.playoffProbability-a.playoffProbability),r=results.find(x=>x.id===selected),team=teamById(league,selected),next=nextMatchup(league,selected),opp=next?teamById(league,next.opponentId):null;
  root.innerHTML=`<div class="dash-head"><div><div class="eyebrow">Synthetic Development League</div><h2>Monte Carlo Dashboard</h2></div><div class="sim-note">${simulations.toLocaleString()} simulations · seed ${seed}</div></div><div class="table-wrap"><table><thead><tr><th>Team</th><th>Avg Wins</th><th>Playoffs</th><th>#1 Seed</th><th>Champion</th></tr></thead><tbody>${sorted.map(t=>`<tr class="team-row ${t.id===selected?'selected':''}" data-team="${t.id}" tabindex="0"><td><strong>${t.name}</strong></td><td>${t.averageWins.toFixed(2)}</td><td>${pct(t.playoffProbability)}</td><td>${pct(t.seedProbability[0])}</td><td>${pct(t.championshipProbability)}</td></tr>`).join('')}</tbody></table></div><div class="detail-grid"><div class="detail-card"><div class="eyebrow">Selected Team</div><h3>${team.name} · ${team.wins}-${team.losses}</h3><div class="metric-grid"><div><span>Playoffs</span><strong>${pct(r.playoffProbability)}</strong></div><div><span>Champion</span><strong>${pct(r.championshipProbability)}</strong></div><div><span>Avg final wins</span><strong>${r.averageWins.toFixed(2)}</strong></div></div><h4>Seed distribution</h4>${seedBars(r)}</div><div class="detail-card"><div class="eyebrow">Remaining Schedule</div>${scheduleRows(league,selected)}<h4>Next matchup</h4><p>${next?`Week ${next.week} vs. <strong>${opp.name}</strong>`:'Complete'}</p>${next?`<div class="scenario-buttons"><button data-scenario="win">If ${team.name} wins</button><button data-scenario="loss">If ${team.name} loses</button><button data-scenario="reset">Reset</button></div><div id="scenario-result" class="scenario-result">Choose a scenario to measure its impact.</div>`:''}</div></div><div id="matchup-detail"></div><p class="demo-disclaimer">Development demo only. Click a team, then click any remaining week for matchup analysis.</p>`;
  if(selectedWeek)renderMatchup();
 }
 function renderMatchup(){const host=root.querySelector('#matchup-detail'),m=matchupAnalysis(league,selected,selectedWeek);if(!host||!m)return;host.innerHTML=`<div class="matchup-panel"><div class="eyebrow">Week ${m.week} Matchup Analysis</div><div class="matchup-score"><div><h3>${m.a.name}</h3><strong>${m.aAvg.toFixed(1)}</strong><span>avg simulated points · ${pct(m.aWin)} win</span></div><b>VS</b><div><h3>${m.b.name}</h3><strong>${m.bAvg.toFixed(1)}</strong><span>avg simulated points · ${pct(m.bWin)} win</span></div></div><div class="lineup-grid"><div><h4>${m.a.name} lineup</h4>${lineupHtml(m.a)}</div><div><h4>${m.b.name} lineup</h4>${lineupHtml(m.b)}</div></div></div>`}
 root.onclick=e=>{const row=e.target.closest('[data-team]');if(row){selected=row.dataset.team;selectedWeek=null;render();return}const wk=e.target.closest('[data-week]');if(wk){selectedWeek=Number(wk.dataset.week);renderMatchup();return}const btn=e.target.closest('[data-scenario]');if(!btn)return;const box=root.querySelector('#scenario-result');if(btn.dataset.scenario==='reset'){box.textContent='Choose a scenario to measure its impact.';return}box.textContent='Running scenario…';setTimeout(()=>{const n=nextMatchup(league,selected),base=results.find(x=>x.id===selected),winner=btn.dataset.scenario==='win'?selected:n.opponentId,sr=forcedScenario(league,selected,winner,simulations,seed);box.innerHTML=`<strong>${btn.dataset.scenario==='win'?'Win':'Loss'} scenario:</strong> Playoffs ${pct(sr.playoffProbability)} (${signedPct(sr.playoffProbability-base.playoffProbability)}), Champion ${pct(sr.championshipProbability)} (${signedPct(sr.championshipProbability-base.championshipProbability)}).`},20)};
 root.onkeydown=e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('[data-team]')){e.preventDefault();selected=e.target.dataset.team;selectedWeek=null;render()}};
 render();
}
