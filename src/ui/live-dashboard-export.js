export function weeklyReportToDashboardV1(report) {
  if (report?.schemaVersion !== 11 || !report.trust?.trusted) throw new Error('Untrusted weekly report');
  const probability = (value) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw new Error('Invalid probability');
    return value;
  };
  if (!Array.isArray(report.league?.outlook) || !report.league.outlook.length) throw new Error('Missing league outlook');
  if (!Number.isFinite(Date.parse(report.generatedAt))) throw new Error('Invalid report timestamp');
  const teams = report.league.outlook.map(team => ({
    id: String(team.id),
    name: String(team.name),
    record: { wins: Number(team.record?.wins), losses: Number(team.record?.losses), ties: Number(team.record?.ties) },
    currentSeed: team.currentSeed,
    playoffProbability: probability(team.playoffProbability),
    championshipProbability: probability(team.championshipProbability),
    averageWins: team.averageWins,
    remainingGames: team.remainingGames,
    seedDistribution: (team.seedDistribution ?? []).map(seed => ({ seed: seed.seed, probability: probability(seed.probability) }))
  }));
  if (new Set(teams.map(team => team.id)).size !== teams.length) throw new Error('Duplicate team IDs');
  if (!teams.some(team => team.id === String(report.team?.id))) throw new Error('Focus team missing');
  const directWeeks = report.trust.projections?.directWeeks ?? [];
  const derivedWeeks = report.trust.projections?.longRangeWeeks ?? [];
  const rosterPlayer = player => ({ id: String(player.id ?? ''), name: String(player.name ?? ''), position: String(player.position ?? ''), slot: player.slot == null ? null : String(player.slot), projection: Number.isFinite(player.projection) ? player.projection : null });
  const roster = { teamId: String(report.team.id), starters: (report.roster?.starters ?? []).map(rosterPlayer), bench: (report.roster?.bench ?? []).map(rosterPlayer) };
  const matchup = report.matchup && (() => {
    const source = report.matchup;
    if (String(source.teamId) !== String(report.team.id)) throw new Error('Matchup team mismatch');
    if (!teams.some(team => team.id === String(source.opponentId))) throw new Error('Unknown matchup opponent');
    const outcome = value => ({
      playoffProbability: probability(value?.playoffProbability),
      championshipProbability: probability(value?.championshipProbability),
      averageWins: Number.isFinite(value?.averageWins) ? value.averageWins : null
    });
    const impact = source.impact;
    return {
      week: Number(source.week), teamId: String(source.teamId),
      opponentId: String(source.opponentId),
      opponentName: String(source.opponentName ?? ''),
      winProbability: probability(source.simulated?.winProbability),
      simulatedMean: Number.isFinite(source.simulated?.teamMean) ? source.simulated.teamMean : null,
      opponentMean: Number.isFinite(source.simulated?.opponentMean) ? source.simulated.opponentMean : null,
      impact: impact ? { win: outcome(impact.win), loss: outcome(impact.loss), simulations: Number(impact.simulations) } : null
    };
  })();
  return {
    schemaVersion: 1,
    generatedAt: report.generatedAt,
    mode: 'live',
    league: { teamCount: teams.length, playoffTeamCount: report.league.playoffSpots, userTeamId: String(report.team.id) },
    model: { simulations: report.outlook.simulations, seed: report.outlook.seed, championshipStatus: report.trust.postseason.trusted ? 'direct' : 'provisional', directWeeks: [...directWeeks], derivedWeeks: [...derivedWeeks] },
    teams,
    roster,
    matchup: matchup ?? null,
    remainingSchedule: (report.remainingSchedule ?? []).map(game => {
      if (!Number.isInteger(game.week) || !teams.some(team => team.id === String(game.opponentId))) throw new Error('Invalid remaining schedule');
      return {week: game.week, opponentId: String(game.opponentId), opponentName: String(game.opponentName)};
    }),
    recommendations: [],
    warnings: report.trust.postseason.trusted ? [] : [report.trust.postseason.reason]
  };
}
