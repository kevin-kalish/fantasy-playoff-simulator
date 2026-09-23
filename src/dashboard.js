import { createDemoLeague } from './demo-data.js';
import { simulateLeague } from './simulator.js';
import { applyScenarioToWeek } from './scenarios.js';

const DEFAULT_SIMULATIONS=10000, DEFAULT_SEED=20260923;
function pct(v){return `${((v||0)*100).toFixed(1)}%`}
function signedPct(v){const n=(v||0)*100;return `${n>=0?'+':''}${n.toFixed(1)} pts`}

export function runDemo({simulations=DEFAULT_SIMULATIONS,seed=DEFAULT_SEED,league=createDemoLeague()}={}) {
  return simulateLeague({...league,simulations,seed});
}

function nextMatchup(league,teamId){
  for(const week of league.schedule){for(const [a,b] of week.matchups){if(a===teamId||b===teamId)return {week:week.week,opponentId:a===teamId?b:a,a,b};}}
  return null;
}

function teamById(league,id){return league.teams.find(t=>t.id===id)}

function seedBars(result){
  return result.seedProbability.map((p,i)=>`<div class="seed-row"><span>#${i+1}</span><div class="bar"><i style="width:${Math.max(1,p*100)}%"></i></div><strong>${pct(p)}</strong></div>`).join('');
}

function scheduleRows(league,teamId){
  return league.schedule.map(w=>{const m=w.matchups.find(([a,b])=>a===teamId||b===teamId);if(!m)return'';const opp=teamById(league,m[0]===teamId?m[1]:m[0]);return `<div class="schedule-row"><span>Week ${w.week}</span><strong>${opp?.name||'Opponent'}</strong></div>`}).join('');
}

function runForcedScenario(league,teamId,winnerId,simulations,seed){
  const next=nextMatchup(league,teamId); if(!next)return null;
  const schedule=league.schedule.map(w=>w.week===next.week?applyScenarioToWeek(w,{forcedWinners:{[`${next.a}:${next.b}`]:winnerId}}):w);
  return simulateLeague({...league,schedule,simulations,seed}).find(r=>r.id===teamId);
}

export function renderDashboard(root,{simulations=DEFAULT_SIMULATIONS,seed=DEFAULT_SEED}={}){
  const league=createDemoLeague();
  let results=runDemo({simulations,seed,league});
  let selected=results[0].id;

  function render(){
    const sorted=[...results].sort((a,b)=>b.playoffProbability-a.playoffProbability);
    const r=results.find(x=>x.id===selected), team=teamById(league,selected), next=nextMatchup(league,selected), opp=next?teamById(league,next.opponentId):null;
    root.innerHTML=`
      <div class="dash-head"><div><div class="eyebrow">Synthetic Development League</div><h2>Monte Carlo Dashboard</h2></div><div class="sim-note">${simulations.toLocaleString()} simulations · seed ${seed}</div></div>
      <div class="table-wrap"><table><thead><tr><th>Team</th><th>Avg Wins</th><th>Playoffs</th><th>#1 Seed</th><th>Champion</th></tr></thead><tbody>
      ${sorted.map(t=>`<tr class="team-row ${t.id===selected?'selected':''}" data-team="${t.id}"><td><strong>${t.name}</strong></td><td>${t.averageWins.toFixed(2)}</td><td>${pct(t.playoffProbability)}</td><td>${pct(t.seedProbability[0])}</td><td>${pct(t.championshipProbability)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="detail-grid">
        <div class="detail-card"><div class="eyebrow">${team.name}</div><h3>${team.wins}-${team.losses} current record</h3><div class="metric-grid"><div><span>Playoffs</span><strong>${pct(r.playoffProbability)}</strong></div><div><span>Champion</span><strong>${pct(r.championshipProbability)}</strong></div><div><span>Avg final wins</span><strong>${r.averageWins.toFixed(2)}</strong></div></div><h4>Seed distribution</h4>${seedBars(r)}</div>
        <div class="detail-card"><div class="eyebrow">Remaining Schedule</div>${scheduleRows(league,selected)}<h4>Next matchup</h4><p>${next?`Week ${next.week} vs. <strong>${opp.name}</strong>`:'Regular season complete'}</p>${next?`<div class="scenario-buttons"><button data-scenario="win">If ${team.name} wins</button><button data-scenario="loss">If ${team.name} loses</button><button data-scenario="reset">Reset</button></div><div id="scenario-result" class="scenario-result">Choose a scenario to measure its impact.</div>`:''}</div>
      </div>
      <p class="demo-disclaimer">Development demo only. Click any team for details. Teams, players and projections are synthetic.</p>`;

    root.querySelectorAll('[data-team]').forEach(el=>el.addEventListener('click',()=>{selected=el.dataset.team;render()}));
    root.querySelectorAll('[data-scenario]').forEach(btn=>btn.addEventListener('click',()=>{
      const box=root.querySelector('#scenario-result');
      if(btn.dataset.scenario==='reset'){box.textContent='Choose a scenario to measure its impact.';return;}
      box.textContent='Running scenario…';
      setTimeout(()=>{
        const winner=btn.dataset.scenario==='win'?selected:next.opponentId;
        const sr=runForcedScenario(league,selected,winner,simulations,seed);
        box.innerHTML=`<strong>${btn.dataset.scenario==='win'?'Win':'Loss'} scenario:</strong> Playoffs ${pct(sr.playoffProbability)} (${signedPct(sr.playoffProbability-r.playoffProbability)}), Champion ${pct(sr.championshipProbability)} (${signedPct(sr.championshipProbability-r.championshipProbability)}).`;
      },10);
    }));
  }
  render();
}
