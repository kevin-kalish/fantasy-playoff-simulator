export function reviewParticipationCandidates(candidates, yahooRows, existingEvidence) {
  if (!Array.isArray(candidates) || !Array.isArray(yahooRows) || !Array.isArray(existingEvidence)) {
    throw new Error('Expected candidate, Yahoo actuals and existing evidence arrays');
  }
  const key = r => [r.season,r.week,r.yahooPlayerId ?? r.playerId].join('|');
  const yahooKeys = new Map();
  for (const r of yahooRows) {
    const k=key(r);
    if (yahooKeys.has(k)) throw new Error('Duplicate Yahoo player-week record');
    yahooKeys.set(k,r);
  }
  const existing=new Set(existingEvidence.map(key));
  const seen=new Set();
  return candidates.map(c => {
    const k=key(c);
    if (seen.has(k)) throw new Error('Duplicate candidate player-week');
    seen.add(k);
    const row=yahooKeys.get(k);
    const zero=row && (row.actual===0 || row.actual==='0' || row.actual==='0.00');
    const identity=row && row.name===c.name && row.nflTeam===c.nflTeam &&
      String(row.position).toUpperCase()===String(c.position).toUpperCase();
    return {season:c.season,week:c.week,yahooPlayerId:c.yahooPlayerId,
      name:c.name,sourceUrl:c.sourceUrl ?? null,
      yahooIdentityMatch:Boolean(identity),explicitYahooZero:Boolean(zero),
      existingEvidence:existing.has(k),
      sourceSupplied:typeof c.sourceUrl==='string' && /^https:\/\/[^/]+\.[^/]+/.test(c.sourceUrl),
      reviewRequired:true,
      eligibleForManualReview:Boolean(identity && zero && !existing.has(k))
    };
  });
}
