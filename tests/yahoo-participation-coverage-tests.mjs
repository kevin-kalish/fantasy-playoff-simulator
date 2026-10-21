
import assert from 'node:assert/strict';

import {auditYahooScoresWithOverrides} from '../src/data/yahoo-scoring-with-overrides.js';
import {summarizeYahooParticipationCoverage} from '../src/data/yahoo-participation-coverage.js';

// Baseline participation coverage regression tests.
const nfl = [
  {
    season: 2026,
    week: 1,
    playerId: 'n1',
    name: 'James Cook',
    position: 'RB',
    nflTeam: 'BUF',
    actual: 10
  }
];

const yahoo = [
  {
    season: 2026,
    week: 1,
    playerId: 'y1',
    name: 'James Cook III',
    position: 'RB',
    nflTeam: 'BUF',
    actual: 10
  },
  {
    season: 2026,
    week: 2,
    playerId: 'y1',
    name: 'James Cook III',
    position: 'RB',
    nflTeam: 'BUF',
    actual: 0
  },
  {
    season: 2026,
    week: 1,
    playerId: 'y2',
    name: 'Unknown Player',
    position: 'WR',
    nflTeam: 'BUF',
    actual: 0
  },
  {
    season: 2026,
    week: 1,
    playerId: 'd1',
    position: 'DEF',
    actual: 4
  }
];

const audit = auditYahooScoresWithOverrides(nfl, yahoo);
const report = summarizeYahooParticipationCoverage(nfl, yahoo, audit);

assert.equal(report.summary.matched, 1);
assert.equal(report.summary.unresolved, 2);
assert.equal(report.summary.unresolvedNonzero, 0);
assert.equal(
  report.summary.categories['known-player-no-same-week-record'],
  1
);
assert.equal(
  report.summary.categories['identity-not-in-actuals'],
  1
);
assert.equal(report.summary.scoringParityPass, true);
assert.equal(report.summary.participationCoverageComplete, false);
assert.equal(report.summary.excludedDefenses, 1);
assert.equal(report.summary.participationEvidenceVerified, 0);
assert.equal(report.summary.participationEvidenceUnverified, 2);

assert.ok(
  report.unresolved.every(r => r.participation === 'unverified')
);

// Unmatched nonzero scores must continue blocking scoring parity.
const nonzero = [
  ...yahoo.slice(0, 2),
  {...yahoo[2], actual: 3},
  yahoo[3]
];

const bad = summarizeYahooParticipationCoverage(
  nfl,
  nonzero,
  auditYahooScoresWithOverrides(nfl, nonzero)
);

assert.equal(bad.summary.scoringParityPass, false);
assert.equal(bad.summary.unresolvedNonzero, 1);

// Participation evidence tests.
// These URLs are illustrative test fixtures, not real verification sources.
const evidenceYahoo = [
  {
    season: 2026,
    week: 1,
    playerId: 'jacobs',
    name: 'Josh Jacobs',
    position: 'RB',
    nflTeam: 'GB',
    actual: 0
  },
  {
    season: 2026,
    week: 1,
    playerId: 'stribling',
    name: "De'Zhaun Stribling",
    position: 'WR',
    nflTeam: 'SF',
    actual: 0
  }
];

const evidenceAudit = auditYahooScoresWithOverrides(
  [],
  evidenceYahoo
);

const evidence = [
  {
    season: 2026,
    week: 1,
    yahooPlayerId: 'jacobs',
    status: 'commissioner-exempt',
    verified: true,
    reviewedAt: '2026-10-20',
    sourceUrl: 'https://example.com/jacobs'
  },
  {
    season: 2026,
    week: 1,
    yahooPlayerId: 'stribling',
    status: 'participated-no-fantasy-stats',
    verified: true,
    reviewedAt: '2026-10-20',
    sourceUrl: 'https://example.com/stribling'
  }
];

const summarizeEvidence = entries =>
  summarizeYahooParticipationCoverage(
    [],
    evidenceYahoo,
    evidenceAudit,
    {participationEvidence: entries}
  );

const evidenced = summarizeEvidence(evidence);

assert.equal(evidenced.summary.unresolved, 2);
assert.equal(evidenced.summary.matched, 0);
assert.equal(evidenced.summary.participationEvidenceVerified, 2);
assert.equal(evidenced.summary.participationEvidenceUnverified, 0);
assert.equal(evidenced.summary.participationCoverageComplete, false);
assert.equal(evidenced.summary.scoringParityPass, false);

assert.equal(
  evidenced.unresolved[0].participation,
  'commissioner-exempt'
);

assert.equal(
  evidenced.unresolved[1].participation,
  'participated-no-fantasy-stats'
);

// No evidence: both records remain unverified.
const withoutEvidence = summarizeEvidence([]);

assert.equal(
  withoutEvidence.summary.participationEvidenceVerified,
  0
);

assert.equal(
  withoutEvidence.summary.participationEvidenceUnverified,
  2
);

// Provisional evidence must be rejected.
const provisional = summarizeEvidence([
  {...evidence[0], verified: false}
]);

assert.equal(
  provisional.summary.participationEvidenceVerified,
  0
);

// Missing source URL must be rejected.
const missingSource = summarizeEvidence([
  {...evidence[0], sourceUrl: ''}
]);

assert.equal(
  missingSource.summary.participationEvidenceVerified,
  0
);

// Non-HTTPS URLs must be rejected.
const insecureSource = summarizeEvidence([
  {...evidence[0], sourceUrl: 'http://example.com/jacobs'}
]);

assert.equal(
  insecureSource.summary.participationEvidenceVerified,
  0
);

// Invalid review dates must be rejected.
const invalidDate = summarizeEvidence([
  {...evidence[0], reviewedAt: '2026-02-30'}
]);

assert.equal(
  invalidDate.summary.participationEvidenceVerified,
  0
);

// Unsupported statuses must be rejected.
const invalidStatus = summarizeEvidence([
  {...evidence[0], status: 'unknown'}
]);

assert.equal(
  invalidStatus.summary.participationEvidenceVerified,
  0
);

// Duplicate evidence must not be accepted.
const duplicate = summarizeEvidence([
  evidence[0],
  {...evidence[0]}
]);

assert.equal(
  duplicate.summary.participationEvidenceVerified,
  0
);

// Evidence cannot validate a nonzero unmatched score.
const nonzeroEvidenceYahoo = [
  {...evidenceYahoo[0], actual: 5}
];

const nonzeroEvidenceAudit = auditYahooScoresWithOverrides(
  [],
  nonzeroEvidenceYahoo
);

const nonzeroEvidenceReport = summarizeYahooParticipationCoverage(
  [],
  nonzeroEvidenceYahoo,
  nonzeroEvidenceAudit,
  {participationEvidence: [evidence[0]]}
);

assert.equal(
  nonzeroEvidenceReport.summary.participationEvidenceVerified,
  0
);

assert.equal(
  nonzeroEvidenceReport.summary.unresolvedNonzero,
  1
);

assert.equal(
  nonzeroEvidenceReport.summary.scoringParityPass,
  false
);

const fs = await import('node:fs');
const script = fs.readFileSync(
  'scripts/audit-yahoo-nflverse-scores.mjs', 'utf8'
);

assert.match(
  script,
  /unresolvedRecords:\s*coverage\.unresolved/
);

const exportedCoverage = {
  ...evidenced.summary,
  unresolvedRecords: evidenced.unresolved
};

assert.equal(
  exportedCoverage.unresolvedRecords.length,
  exportedCoverage.unresolved
);

assert.equal(
  exportedCoverage.unresolvedRecords.filter(
    r => r.participation !== 'unverified'
  ).length,
  exportedCoverage.participationEvidenceVerified
);

console.log(
  'yahoo-participation-coverage-tests: all checks passed'
);