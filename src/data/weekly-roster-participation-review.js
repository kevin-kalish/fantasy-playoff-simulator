// Read-only triage: roster snapshots are not proof of game-day inactivity.
const canonicalTeam = value => ({JAC:'JAX',WSH:'WAS',LAR:'LA',STL:'LA',SD:'LAC',OAK:'LV'}[String(value ?? '').toUpperCase()] ?? String(value ?? '').toUpperCase());
const yahooId = value => String(value ?? '').trim().replace(/^\d+\.p\./, '');
const nonempty = value => value !== null && value !== undefined && String(value).trim() !== '';
export function reviewWeeklyRosterParticipation(queue, rosterRows) {
  if (queue?.schemaVersion !== 1 || !Array.isArray(queue.records) || !Array.isArray(rosterRows)) throw new Error('Invalid queue or weekly roster data');
  const byKey = new Map();
  for (const row of rosterRows) {
    if (!Number.isInteger(Number(row.season)) || !Number.isInteger(Number(row.week)) || !nonempty(row.yahoo_id)) continue;
    const key = [Number(row.season),Number(row.week),yahooId(row.yahoo_id)].join('|');
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(row);
  }
  const records = queue.records.map(q => {
    if (!Number.isInteger(Number(q.season)) || !Number.isInteger(Number(q.week)) ||
        !nonempty(q.yahooPlayerId) || !nonempty(q.nflTeam) ||
        q.yahooActual !== 0 || q.reviewStatus !== 'unverified') throw new Error('Queue contains ineligible record');
    const key = [Number(q.season),Number(q.week),yahooId(q.yahooPlayerId)].join('|');
    const matches = byKey.get(key) ?? [];
    let classification = 'missing-weekly-roster';
    if (matches.length > 1) classification = 'ambiguous-weekly-roster';
    else if (matches.length === 1) {
      const row = matches[0];
      classification = canonicalTeam(row.team) === canonicalTeam(q.nflTeam)
        ? 'roster-status-candidate' : 'team-identity-conflict';
    }
    const row = matches.length === 1 ? matches[0] : null;
    return {
      season:q.season, week:q.week, yahooPlayerId:q.yahooPlayerId,
      name:q.name, position:q.position, nflTeam:q.nflTeam,
      classification,
      rosterStatus:row ? String(row.status ?? '') : null,
      rosterStatusDescription:row ? String(row.status_description_abbr ?? '') : null,
      source:'nflverse-weekly-roster-snapshot',
      verified:false, reviewRequired:true
    };
  });
  const counts = {};
  for (const record of records) counts[record.classification] = (counts[record.classification] ?? 0)+1;
  return {schemaVersion:1, mode:'read-only-weekly-roster-triage', summary:{total:records.length,counts},records,
    note:'Snapshot status is not dated transaction evidence or game-day inactive proof. No automatic verification, scoring change, or calibration eligibility.'};
}
