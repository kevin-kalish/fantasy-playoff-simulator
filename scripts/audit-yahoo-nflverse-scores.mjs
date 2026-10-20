import fs from 'node:fs';
import path from 'node:path';

import {auditYahooScoresWithOverrides} from '../src/data/yahoo-scoring-with-overrides.js';
import {summarizeYahooParticipationCoverage} from '../src/data/yahoo-participation-coverage.js';

const nflPath = 'data/private/historical-actuals.json';
const yahooPath = 'data/private/yahoo-player-actuals.json';
const out = 'data/private/yahoo-nflverse-score-audit.json';
const overridePath = 'data/private/yahoo-identity-overrides.json';
const evidencePath = 'data/private/yahoo-participation-evidence.json';

try {
  const read = p => {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));

    if (!Array.isArray(data.rows)) {
      throw new Error('Missing rows in ' + p);
    }

    return data.rows;
  };

  const overrides = fs.existsSync(overridePath)
    ? JSON.parse(fs.readFileSync(overridePath, 'utf8'))
    : [];

  if (!Array.isArray(overrides)) {
    throw new Error('Identity overrides must be a JSON array');
  }

  const participationEvidence = fs.existsSync(evidencePath)
    ? JSON.parse(fs.readFileSync(evidencePath, 'utf8'))
    : [];

  if (!Array.isArray(participationEvidence)) {
    throw new Error('Participation evidence must be a JSON array');
  }

  const nfl = read(nflPath);
  const yahoo = read(yahooPath);

  const report = auditYahooScoresWithOverrides(
    nfl,
    yahoo,
    {overrides}
  );

  const coverage = summarizeYahooParticipationCoverage(
    nfl,
    yahoo,
    report,
    {participationEvidence}
  );

  report.participationCoverage = coverage.summary;

  fs.mkdirSync(path.dirname(out), {recursive: true});

  fs.writeFileSync(
    out,
    JSON.stringify(report, null, 2) + '\n'
  );

  console.log(
    'CROSS-PROVIDER SCORES: ' +
    report.summary.compared + ' base matches; ' +
    report.summary.reviewedMatches + ' reviewed matches; ' +
    report.summary.totalMatched + ' total matched; ' +
    report.summary.unmatchedIndividuals + ' unmatched individuals.'
  );

  console.log(
    'CROSS-PROVIDER EXCEPTIONS: ' +
    report.exceptionAudit.rejected.length + ' rejected; ' +
    report.summary.excludedDefenses + ' defenses excluded.'
  );

  console.log(
    'CROSS-PROVIDER POSITIONS: ' +
    JSON.stringify(report.byPosition)
  );

  console.log(
    'SCORING PARITY: ' +
    (coverage.summary.scoringParityPass ? 'PASS' : 'REVIEW REQUIRED') +
    '; ' + coverage.summary.unresolved +
    ' unmatched player-week records; ' +
    coverage.summary.unresolvedNonzero +
    ' unresolved nonzero records.'
  );

  console.log(
    'PARTICIPATION EVIDENCE: ' +
    coverage.summary.participationEvidenceVerified +
    ' verified; ' +
    coverage.summary.participationEvidenceUnverified +
    ' unverified.'
  );

  console.log(
    'PARTICIPATION COVERAGE: ' +
    (coverage.summary.participationCoverageComplete
      ? 'COMPLETE'
      : 'INCOMPLETE') +
    '; ' + JSON.stringify(coverage.summary.categories)
  );

  console.log(
    'CROSS-PROVIDER SCORES: ' +
    (report.pass
      ? 'INDIVIDUAL SCORING COVERAGE PASS (identity still provisional)'
      : 'REVIEW REQUIRED') +
    '; ' + out
  );

  if (!report.pass) {
    process.exitCode = 2;
  }

} catch (e) {
  console.error(
    'CROSS-PROVIDER SCORES: ERROR; ' + e.message
  );

  process.exitCode = 1;
}