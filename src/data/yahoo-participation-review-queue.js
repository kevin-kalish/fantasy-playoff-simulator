// Diagnostic review queue only: never converts absence to participation evidence.
// Align Rams and legacy team codes with the existing Yahoo unmatched diagnostic.
const team = s => ({JAC:'JAX',WSH:'WAS',OAK:'LV',SD:'LAC',STL:'LA',LAR:'LA'}[String(s ?? '').toUpperCase()] ?? String(s ?? '').toUpperCase());
export function buildParticipationReviewQueue(unresolved, readiness, games) {
  if (!Array.isArray(unresolved) || !Array.isArray(readiness) || !Array.isArray(games)) {
    throw new Error('Expected unresolved records, readiness and schedule arrays');
  }
  const readinessByWeek = new Map(readiness.map(r =>
    [Number(r.season) + '|' + Number(r.week), r.status]));
  const scheduledTeams = new Map();
  for (const game of games) {
    const k = Number(game.season) + '|' + Number(game.week);
    if (!scheduledTeams.has(k)) scheduledTeams.set(k, new Set());
    scheduledTeams.get(k).add(team(game.home_team));
    scheduledTeams.get(k).add(team(game.away_team));
  }
  const records = unresolved.filter(r =>
    Number(r.season) === 2026 &&
    Number.isInteger(Number(r.week)) && Number(r.week) >= 1 &&
    Number(r.week) <= 5 &&
    r.participation === 'unverified' &&
    Number.isFinite(r.yahooActual) && r.yahooActual === 0
  ).map(r => {
    const k = Number(r.season) + '|' + Number(r.week);
    const actualsStatus = readinessByWeek.get(k) ?? 'missing-readiness';
    const teamScheduled = scheduledTeams.get(k)?.has(team(r.nflTeam)) ?? false;
    return {
      season:r.season, week:r.week, yahooPlayerId:r.yahooPlayerId,
      name:r.name, position:r.position, nflTeam:r.nflTeam,
      yahooActual:r.yahooActual, category:r.category,
      actualsStatus, scheduleClassification:teamScheduled
        ? 'team-scheduled' : 'team-not-scheduled',
      reviewStatus:'unverified', evidenceRequired:true
    };
  }).sort((a,b) =>
    (b.week-a.week) ||
    (['WR','RB'].includes(b.position)?1:0) -
      (['WR','RB'].includes(a.position)?1:0) ||
    String(a.position).localeCompare(String(b.position)) ||
    String(a.yahooPlayerId).localeCompare(String(b.yahooPlayerId))
  );
  // Human-review ordering is informational only; it never changes evidence.
  const priorityCounts = {week5WrRb:0,week4WrRb:0,other:0};
  for (const record of records) {
    const bucket = [ 'WR', 'RB' ].includes(record.position)
      ? record.week === 5 ? 'week5WrRb' : record.week === 4 ? 'week4WrRb' : 'other'
      : 'other';
    record.reviewPriority = bucket === 'week5WrRb' ? 'first'
      : bucket === 'week4WrRb' ? 'second' : 'later';
    record.evidenceChecklist = ['independent-https-source', 'review-date',
      'player-and-week-confirmed', 'document-supported-status'];
    priorityCounts[bucket]++;
  }
  // Present the documented review priorities in actual review order.
  const rank = {first:0, second:1, later:2};
  records.sort((a,b) =>
    rank[a.reviewPriority]-rank[b.reviewPriority] ||
    b.week-a.week ||
    String(a.position).localeCompare(String(b.position)) ||
    String(a.yahooPlayerId).localeCompare(String(b.yahooPlayerId))
  );
  const summary = {
    total:records.length,
    priorityCounts,
    teamScheduled:records.filter(r=>r.scheduleClassification==='team-scheduled').length,
    teamNotScheduled:records.filter(r=>r.scheduleClassification==='team-not-scheduled').length,
    unverified:records.length,
    sourceNotReady:records.filter(r=>r.actualsStatus!=='team-coverage-ready').length
  };
  return {schemaVersion:1,season:2026,scope:'weeks-1-to-5-unverified-zero-only',
    summary,records,note:'Private triage only. Team scheduled is not player participation. Team not scheduled is not a verified bye. No automatic evidence or score matching.'};
}
