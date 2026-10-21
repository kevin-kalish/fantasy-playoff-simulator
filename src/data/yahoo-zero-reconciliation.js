// Diagnostic only. Missing scores are never treated as explicit zeros.
const key = r => [Number(r.season),Number(r.week),String(r.playerId ?? r.yahooPlayerId)].join('|');
export function summarizeYahooZeroReconciliation(yahooRows, audit, season, week) {
  if (!Array.isArray(yahooRows) || !Array.isArray(audit?.compared) ||
      !Array.isArray(audit?.exceptionAudit?.reviewedMatches) ||
      !Array.isArray(audit?.participationCoverage?.unresolvedRecords)) {
    throw new Error('Incomplete Yahoo audit inputs');
  }
  const rows = yahooRows.filter(r => Number(r.season) === season && Number(r.week) === week && String(r.position).toUpperCase() !== 'DEF');
  const zeros = rows.filter(r => r.actual === 0 || r.actual === '0' || r.actual === '0.00');
  const missing = rows.filter(r => r.actual === null || r.actual === undefined || r.actual === '');
  const matched = new Set([...audit.compared,...audit.exceptionAudit.reviewedMatches].filter(r =>
    Number(r.season) === season && Number(r.week) === week).map(key));
  const unresolved = new Set(audit.participationCoverage.unresolvedRecords.filter(r =>
    Number(r.season) === season && Number(r.week) === week).map(key));
  const ids = zeros.map(key);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate Yahoo zero player-week keys');
  const matchedZero = ids.filter(k => matched.has(k));
  const unresolvedZero = ids.filter(k => unresolved.has(k));
  const unclassifiedZero = ids.filter(k => !matched.has(k) && !unresolved.has(k));
  const overlap = ids.filter(k => matched.has(k) && unresolved.has(k));
  return {season,week,totalRows:rows.length,explicitZero:zeros.length,missing:missing.length,
    matchedZero:matchedZero.length,unresolvedZero:unresolvedZero.length,
    unclassifiedZero:unclassifiedZero.length,overlap:overlap.length,
    classificationComplete:unclassifiedZero.length===0 && overlap.length===0,
    note:'Diagnostic only; matched means audit identity/score comparison, not independently verified player participation.'};
}
