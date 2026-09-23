// Scenario overrides let the same Monte Carlo engine answer questions such as
// "What are my playoff odds if I win Week 9?" without changing projections.
export function applyScenarioToWeek(week, scenario = {}) {
  if (!scenario.forcedWinners) return week;
  return { ...week, forcedWinners: { ...(week.forcedWinners || {}), ...scenario.forcedWinners } };
}

export function scenarioDelta(baseResults, scenarioResults) {
  const byId = Object.fromEntries(baseResults.map(r => [r.id, r]));
  return scenarioResults.map(r => ({
    id: r.id,
    name: r.name,
    playoffProbability: r.playoffProbability,
    playoffDelta: r.playoffProbability - (byId[r.id]?.playoffProbability || 0),
    championshipProbability: r.championshipProbability ?? null,
    championshipDelta: r.championshipProbability == null ? null : r.championshipProbability - (byId[r.id]?.championshipProbability || 0)
  }));
}
