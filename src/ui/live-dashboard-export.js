export function weeklyReportToDashboardV1(report) {
  if (report?.schemaVersion !== 11 || !report.trust?.trusted) throw new Error('Untrusted weekly report');
  const probability = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid probability');
    return value;
  };
  const teams = report.league.outlook.map(team => ({
    id: String(team.id),
    name: String(team.name),
    record: { ...team.record },
    currentSeed: team.currentSeed,
    playoffProbability: probability(team.playoffProbability),
    championshipProbability: probability(team.championshipProbability),
    averageWins: team.averageWins,
    remainingGames: team.remainingGames,
    seedDistribution: team.seedDistribution.map(seed => ({ seed: seed.seed, probability: probability(seed.probability) }))
  }));
  if (new Set(teams.map(team => team.id)).size !== teams.length) throw new Error('Duplicate team IDs');
  const directWeeks = report.trust.projections.directWeeks;
  const derivedWeeks = report.trust.projections.longRangeWeeks;
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    mode: 'live',
    league: { teamCount: teams.length, playoffTeamCount: report.league.playoffSpots, userTeamId: String(report.team.id) },
    model: { simulations: report.outlook.simulations, seed: report.outlook.seed, championshipStatus: report.trust.postseason.trusted ? 'direct' : 'provisional', directWeeks: [...directWeeks], derivedWeeks: [...derivedWeeks] },
    teams,
    recommendations: [],
    warnings: report.trust.postseason.trusted ? [] : [report.trust.postseason.reason]
  };
}
