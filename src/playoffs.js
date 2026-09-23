function scoreTeam(team, week, simulatePlayer, rng) {
  const lineup = team.weeklyLineups?.[week] || team.lineup || [];
  return lineup.reduce((sum, p) => sum + simulatePlayer(p.projection || 0, p.position, rng), 0);
}

function pairBySeed(alive, seeds) {
  const sorted = [...alive].sort((a,b) => seeds[a.id] - seeds[b.id]);
  const pairs = [];
  while (sorted.length > 1) pairs.push([sorted.shift(), sorted.pop()]);
  if (sorted.length) pairs.push([sorted.shift(), null]);
  return pairs;
}

export function simulatePlayoffs({ qualifiers, weeks=[15,16,17], simulatePlayer, rng, reseed=true }) {
  const seeds = Object.fromEntries(qualifiers.map((t,i)=>[t.id,i+1]));
  let alive = [...qualifiers];
  const rounds = [];
  for (const week of weeks) {
    const pairs = reseed ? pairBySeed(alive, seeds) : pairBySeed(alive, seeds);
    const winners = [];
    const games = [];
    for (const [a,b] of pairs) {
      if (!b) { winners.push(a); games.push({week,a:a.id,b:null,winner:a.id}); continue; }
      const sa=scoreTeam(a,week,simulatePlayer,rng), sb=scoreTeam(b,week,simulatePlayer,rng);
      // Yahoo playoff ties advance the higher seed.
      const winner = sa === sb ? (seeds[a.id] < seeds[b.id] ? a : b) : (sa > sb ? a : b);
      winners.push(winner);
      games.push({week,a:a.id,b:b.id,scoreA:sa,scoreB:sb,winner:winner.id});
    }
    rounds.push(games);
    alive = winners;
    if (alive.length === 1) break;
  }
  return { champion: alive[0] || null, rounds };
}
