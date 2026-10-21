// Diagnostic review queue only: never converts absence to participation evidence.
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
    scheduledTeams.get(k).add(game.home_team);
    scheduledTeams.get(k).add(game.away_team);
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
    const teamScheduled = scheduledTeams.get(k)?.has(r.nflTeam) ?? false;
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
  const summary = {
    total:records.length,
    teamScheduled:records.filter(r=>r.scheduleClassification==='team-scheduled').length,
    teamNotScheduled:records.filter(r=>r.scheduleClassification==='team-not-scheduled').length,
    unverified:records.length,
    sourceNotReady:records.filter(r=>r.actualsStatus!=='team-coverage-ready').length
  };
  return {schemaVersion:1,season:2026,scope:'weeks-1-to-5-unverified-zero-only',
    summary,records,note:'Private triage only. Team scheduled is not player participation. Team not scheduled is not a verified bye. No automatic evidence or score matching.'};
}
