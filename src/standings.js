export function rankStandings(teams, state, { tiebreaker = 'points' } = {}) {
  return [...teams].sort((a, b) => {
    const A = state[a.id], B = state[b.id];
    const winPctA = A.wins / Math.max(1, A.wins + A.losses + (A.ties || 0));
    const winPctB = B.wins / Math.max(1, B.wins + B.losses + (B.ties || 0));
    if (winPctB !== winPctA) return winPctB - winPctA;
    if (tiebreaker === 'points' && B.points !== A.points) return B.points - A.points;
    return String(a.id).localeCompare(String(b.id));
  });
}

export function standingsSnapshot(ranked, state) {
  return ranked.map((team, index) => ({
    seed: index + 1,
    id: team.id,
    name: team.name,
    wins: state[team.id].wins,
    losses: state[team.id].losses,
    ties: state[team.id].ties || 0,
    points: state[team.id].points
  }));
}
