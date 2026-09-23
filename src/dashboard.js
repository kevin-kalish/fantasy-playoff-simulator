import { createDemoLeague } from './demo-data.js';
import { simulateLeague } from './simulator.js';
import { createSeededRng } from './random.js';

function pct(v){ return `${(v*100).toFixed(1)}%`; }

export function runDemo({simulations=10000,seed=20260923}={}) {
  const league=createDemoLeague();
  const rng=createSeededRng(seed);
  return simulateLeague({...league,simulations,rng,seed});
}

export function renderDashboard(root, results) {
  const sorted=[...results].sort((a,b)=>b.playoffProbability-a.playoffProbability);
  root.innerHTML=`
    <div class="dash-head"><div><div class="eyebrow">Synthetic Development League</div><h2>Monte Carlo Dashboard</h2></div><div class="sim-note">${Number(results.simulations||10000).toLocaleString()} simulations</div></div>
    <div class="table-wrap"><table><thead><tr><th>Team</th><th>Avg Wins</th><th>Playoffs</th><th>#1 Seed</th><th>Champion</th></tr></thead><tbody>
    ${sorted.map(t=>`<tr><td><strong>${t.name}</strong></td><td>${t.averageWins.toFixed(2)}</td><td>${pct(t.playoffProbability)}</td><td>${pct(t.seedProbability?.[0]||0)}</td><td>${pct(t.championshipProbability||0)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="demo-disclaimer">Development demo only. Teams, players and projections are synthetic. Live Yahoo league data and external projections will replace these inputs after API access is configured.</p>`;
}
