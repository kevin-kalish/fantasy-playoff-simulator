const normalize = s => String(s ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const team = s => ({
  JAC: 'JAX', WSH: 'WAS', OAK: 'LV',
  SD: 'LAC', STL: 'LA', LAR: 'LA'
}[String(s ?? '').toUpperCase()] ?? String(s ?? '').toUpperCase());

const FINALIZATION_MS = 5 * 86400000;

export function diagnoseUnmatchedYahooPlayers(
  nflRows,
  yahooRows,
  {
  scheduleRows = [],
  asOf = new Date().toISOString(),
  verifiedScheduleWeeks = []
} = {}
) {
  if (!Number.isFinite(Date.parse(asOf))) {
    throw new Error('Invalid diagnostics asOf timestamp');
  }

  const nflByWeek = new Map();

  for (const n of nflRows) {
    const k = [Number(n.season), Number(n.week)].join('|');
    if (!nflByWeek.has(k)) nflByWeek.set(k, []);
    nflByWeek.get(k).push(n);
  }

  const kickoffs = new Map();

  for (const g of scheduleRows) {
    for (const t of [g.home_team, g.away_team]) {
      const k = [
        Number(g.season),
        Number(g.week),
        team(t)
      ].join('|');

      if (kickoffs.has(k) && kickoffs.get(k) !== g.kickoffAt) {
        kickoffs.set(k, null);
      } else if (!kickoffs.has(k)) {
        kickoffs.set(k, g.kickoffAt);
      }
    }
  }
  const verifiedWeeks = new Set(
  verifiedScheduleWeeks.map(
    v => [Number(v.season), Number(v.week)].join('|')
    )
  );
  const details = [];
  const reasons = {};

  for (const y of yahooRows) {
    const week = nflByWeek.get(
      [Number(y.season), Number(y.week)].join('|')
    ) ?? [];

    const sameName = week.filter(
      n => normalize(n.name) === normalize(y.name)
    );

    const exact = sameName.filter(
      n =>
        String(n.position).toUpperCase() ===
          String(y.position).toUpperCase() &&
        team(n.nflTeam) === team(y.nflTeam)
    );

    if (exact.length === 1) continue;

    let reason;
    let candidates = [];

    if (exact.length > 1) {
      reason = 'ambiguous-exact-identity';
      candidates = exact;
    } else if (sameName.length > 1) {
      reason = 'ambiguous-name';
      candidates = sameName;
    } else if (sameName.length === 1) {
      const n = sameName[0];
      candidates = sameName;
      reason =
        String(n.position).toUpperCase() !==
        String(y.position).toUpperCase()
          ? 'position-disagreement'
          : 'team-disagreement';
    } else {
      const sameTeamPosition = week.filter(
        n =>
          team(n.nflTeam) === team(y.nflTeam) &&
          String(n.position).toUpperCase() ===
            String(y.position).toUpperCase()
      );

      if (!week.length) {
        reason = 'no-nflverse-week';
      } else if (!sameTeamPosition.length) {
        reason = 'no-same-team-position-candidate';
      } else {
        reason = 'name-or-roster-coverage';
        candidates = sameTeamPosition;
      }
    }

    if (reason === 'no-nflverse-week') {
      const k = [
        Number(y.season),
        Number(y.week),
        team(y.nflTeam)
      ].join('|');

      const kickoffAt = kickoffs.get(k);
      const kickoffTime = Date.parse(kickoffAt);
      const weekKey = [
  Number(y.season),
  Number(y.week)
].join('|');

if (
  !kickoffAt &&
  verifiedWeeks.has(weekKey) &&
  y.actual !== null &&
  y.actual !== undefined &&
  y.actual !== '' &&
  Number(y.actual) === 0
) {
  reason = 'bye-week-no-game';
}

      if (
        kickoffAt &&
        Number.isFinite(kickoffTime) &&
        kickoffTime <= Date.parse(asOf) &&
        kickoffTime + FINALIZATION_MS > Date.parse(asOf)
      ) {
        reason = 'pending-finalization';
      }
    }

    reasons[reason] = (reasons[reason] ?? 0) + 1;

    details.push({
      season: y.season,
      week: y.week,
      yahooPlayerId: y.playerId,
      name: y.name,
      position: y.position,
      nflTeam: y.nflTeam,
      yahooActual: y.actual,
      reason,
      candidateCount: candidates.length,
      candidates: candidates.slice(0, 8).map(n => ({
        playerId: n.playerId,
        name: n.name,
        position: n.position,
        nflTeam: n.nflTeam,
        actual: n.actual
      }))
    });
  }

  return {
    schemaVersion: 1,
    mode: 'offline-unmatched-identity-diagnostics',
    yahooRows: yahooRows.length,
    nflverseRows: nflRows.length,
    unmatched: details.length,
    reasons: Object.fromEntries(
      Object.entries(reasons).sort((a, b) => b[1] - a[1])
    ),
    details,
    note: 'Candidates are for manual investigation only. Pending finalization is not a successful match. No inferred matches, score-based identity matching, or calibration changes.'
  };
}