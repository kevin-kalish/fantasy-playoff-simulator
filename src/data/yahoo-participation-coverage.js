
const key = (season, week, id) =>
  [Number(season), Number(week), String(id)].join('|');

const norm = s =>
  String(s ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/(?:[\s.,]+)(?:jr|sr|ii|iii|iv|v)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '');

const allowedStatuses = new Set([
  'commissioner-exempt',
  'injured-reserve',
  'officially-inactive',
  'participated-no-fantasy-stats'
]);

function validEvidence(e) {
  if (!e || typeof e !== 'object') return false;

  if (!Number.isInteger(e.season) || e.season < 2000) {
    return false;
  }

  if (
    !Number.isInteger(e.week) ||
    e.week < 1 ||
    e.week > 18
  ) {
    return false;
  }

  if (
    typeof e.yahooPlayerId !== 'string' ||
    !e.yahooPlayerId.trim()
  ) {
    return false;
  }

  if (!allowedStatuses.has(e.status)) return false;

  if (e.verified !== true) return false;

  if (
    typeof e.reviewedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(e.reviewedAt) ||
    !Number.isFinite(Date.parse(e.reviewedAt)) ||
    new Date(e.reviewedAt).toISOString().slice(0, 10) !==
      e.reviewedAt
  ) {
    return false;
  }

  if (typeof e.sourceUrl !== 'string') return false;

  try {
    const url = new URL(e.sourceUrl);

    if (
      url.protocol !== 'https:' ||
      !url.hostname.includes('.')
    ) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

export function summarizeYahooParticipationCoverage(
  nfl,
  yahoo,
  audit,
  {participationEvidence = [], verifiedByeWeeks = []} = {}
) {
  const individuals = yahoo.filter(
    r => String(r.position).toUpperCase() !== 'DEF'
  );

  const matched = new Set(
    [
      ...audit.compared,
      ...audit.exceptionAudit.reviewedMatches
    ].map(r => key(r.season, r.week, r.yahooPlayerId))
  );

  const nflIdentity = new Map();

  for (const r of nfl) {
    const k =
      norm(r.name) + '|' +
      String(r.position).toUpperCase();

    if (!nflIdentity.has(k)) {
      nflIdentity.set(k, []);
    }

    nflIdentity.get(k).push(r);
  }

  // Bye weeks are derived only from independently verified, complete schedules.
  // They explain absence; they never turn unmatched rows into scoring matches.
  const byeKeys = new Set();
  for (const entry of verifiedByeWeeks) {
    if (!entry || !Number.isInteger(entry.season) ||
        !Number.isInteger(entry.week) || !Array.isArray(entry.byeTeams) ||
        entry.verified !== true) continue;
    for (const team of entry.byeTeams) {
      if (/^[A-Z]{2,3}$/.test(team)) {
        byeKeys.add(key(entry.season, entry.week, team));
      }
    }
  }

  const evidenceByKey = new Map();
  const seenEvidenceKeys = new Set();
  const duplicateEvidenceKeys = new Set();

  for (const e of participationEvidence) {
    if (!e || typeof e !== 'object') continue;

    const k = key(e.season, e.week, e.yahooPlayerId);

    if (seenEvidenceKeys.has(k)) {
      duplicateEvidenceKeys.add(k);
      evidenceByKey.delete(k);
      continue;
    }

    seenEvidenceKeys.add(k);

    if (validEvidence(e)) {
      evidenceByKey.set(k, {
        status: e.status,
        sourceUrl: e.sourceUrl,
        reviewedAt: e.reviewedAt
      });
    }
  }

  for (const k of duplicateEvidenceKeys) {
    evidenceByKey.delete(k);
  }

  const unresolved = individuals
    .filter(r => !matched.has(
      key(r.season, r.week, r.playerId)
    ))
    .map(r => {
      const peers = nflIdentity.get(
        norm(r.name) + '|' +
        String(r.position).toUpperCase()
      ) ?? [];

      const sameWeek = peers.filter(
        n =>
          Number(n.season) === Number(r.season) &&
          Number(n.week) === Number(r.week)
      );

      const category = sameWeek.length
        ? 'same-week-identity-unresolved'
        : peers.length
          ? 'known-player-no-same-week-record'
          : 'identity-not-in-actuals';

      // Missing/blank actuals are not legitimate zero-point observations.
      const actual = r.actual === null || r.actual === undefined ||
        (typeof r.actual === 'string' && r.actual.trim() === '')
        ? NaN : Number(r.actual);

      const evidence = evidenceByKey.get(
        key(r.season, r.week, r.playerId)
      );

      const verifiedBye = Number.isFinite(actual) && actual === 0 &&
        typeof r.nflTeam === 'string' &&
        byeKeys.has(key(r.season, r.week, r.nflTeam));

      const acceptedEvidence =
        evidence &&
        Number.isFinite(actual) &&
        actual === 0
          ? evidence
          : null;

      return {
        season: r.season,
        week: r.week,
        yahooPlayerId: r.playerId,
        name: r.name,
        position: r.position,
        nflTeam: r.nflTeam,
        yahooActual: actual,
        category,
        participation: acceptedEvidence
          ? acceptedEvidence.status
          : verifiedBye && !evidence && sameWeek.length === 0
            ? 'scheduled-bye'
            : 'unverified',
        ...(acceptedEvidence
          ? {
              participationSource: acceptedEvidence.sourceUrl,
              participationReviewedAt: acceptedEvidence.reviewedAt
            }
          : {})
      };
    });

  const categories = {};

  for (const r of unresolved) {
    categories[r.category] =
      (categories[r.category] ?? 0) + 1;
  }

  const nonzero = unresolved.filter(
    r =>
      !Number.isFinite(r.yahooActual) ||
      r.yahooActual !== 0
  ).length;

  const participationEvidenceVerified = unresolved.filter(
    r => r.participation !== 'unverified'
  ).length;

  const scoreMismatches =
    audit.summary.mismatches +
    audit.summary.reviewedScoreMismatches;

  const invalidOverrides =
    audit.exceptionAudit.rejected.length;

  const scoringParityPass =
    audit.summary.totalMatched > 0 &&
    scoreMismatches === 0 &&
    nonzero === 0 &&
    audit.ambiguous.length === 0 &&
    invalidOverrides === 0;

  return {
    schemaVersion: 1,
    summary: {
      individuals: individuals.length,
      matched: audit.summary.totalMatched,
      unresolved: unresolved.length,
      unresolvedNonzero: nonzero,
      scoreMismatches,
      invalidOverrides,
      excludedDefenses: audit.summary.excludedDefenses,
      categories,
      participationEvidenceVerified,
      participationEvidenceUnverified:
        unresolved.length - participationEvidenceVerified,
      scoringParityPass,
      participationCoverageComplete: unresolved.length === 0
    },
    unresolved,
    note:
      'Scoring parity is separate from participation coverage. ' +
      'Reviewed participation evidence explains unmatched zero-point ' +
      'records but does not establish statistical matches or ' +
      'calibration eligibility. Defense scores remain excluded.'
  };
}