const VOLATILITY = { QB:0.27, RB:0.40, WR:0.47, TE:0.48, K:0.45, DEF:0.50 };

function gaussian(rng=Math.random) {
  let u=0,v=0; while(!u)u=rng(); while(!v)v=rng();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
}

export function simulatePlayer(projection, position, rng=Math.random) {
  const cv=VOLATILITY[position] ?? 0.42;
  // Lognormal keeps scores nonnegative and produces realistic right-skewed boom outcomes.
  const sigma=Math.sqrt(Math.log(1+cv*cv));
  const mu=Math.log(Math.max(projection,0.05))-sigma*sigma/2;
  return Math.exp(mu+sigma*gaussian(rng));
}

export function simulateLeague({teams, schedule, playoffSpots=8, simulations=100000, rng=Math.random}) {
  const out=Object.fromEntries(teams.map(t=>[t.id,{playoffs:0,seeds:Array(teams.length).fill(0),wins:0}]));
  for(let n=0;n<simulations;n++) {
    const state=Object.fromEntries(teams.map(t=>[t.id,{wins:t.wins||0,losses:t.losses||0,points:t.points||0}]));
    for(const week of schedule) {
      const scores={};
      for(const t of teams) {
        const lineup=t.weeklyLineups?.[week.week] || t.lineup || [];
        scores[t.id]=lineup.reduce((sum,p)=>sum+simulatePlayer(p.projection||0,p.position,rng),0);
        state[t.id].points += scores[t.id];
      }
      for(const [a,b] of week.matchups) {
        if(scores[a] > scores[b]) { state[a].wins++; state[b].losses++; }
        else if(scores[b] > scores[a]) { state[b].wins++; state[a].losses++; }
        else { state[a].points += 0.000001; }
      }
    }
    const ranked=[...teams].sort((a,b)=>state[b.id].wins-state[a.id].wins || state[b.id].points-state[a.id].points);
    ranked.forEach((t,i)=>{ out[t.id].seeds[i]++; out[t.id].wins += state[t.id].wins; if(i<playoffSpots) out[t.id].playoffs++; });
  }
  return teams.map(t=>({id:t.id,name:t.name,playoffProbability:out[t.id].playoffs/simulations,averageWins:out[t.id].wins/simulations,seedProbability:out[t.id].seeds.map(x=>x/simulations)}));
}
