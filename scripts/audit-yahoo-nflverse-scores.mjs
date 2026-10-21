import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {parseCSV} from '../src/data/csv.js';

import {auditYahooScoresWithOverrides} from '../src/data/yahoo-scoring-with-overrides.js';
import {summarizeYahooParticipationCoverage} from '../src/data/yahoo-participation-coverage.js';

const nflPath = 'data/private/historical-actuals.json';
const yahooPath = 'data/private/yahoo-player-actuals.json';
const out = 'data/private/yahoo-nflverse-score-audit.json';
const overridePath = 'data/private/yahoo-identity-overrides.json';
const evidencePath = 'data/private/yahoo-participation-evidence.json';
const schedulePath = 'data/private/nfl-kickoffs.csv';
const scheduleEvidencePrefix = 'data/private/kickoff-verification-week-';
const actualsFinalizationBufferMs = 5 * 86400000;
const scheduleSource = 'https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv';

function verifiedByeWeeks() {
  if (!fs.existsSync(schedulePath)) return [];
  const bytes = fs.readFileSync(schedulePath);
  const digest = createHash('sha256').update(bytes).digest('hex');
  const games = parseCSV(bytes.toString('utf8'));
  const seasonTeams = new Set(games.filter(g => Number(g.season) === 2026)
    .flatMap(g => [g.home_team, g.away_team]));
  if (seasonTeams.size !== 32) return [];
  const result = [];
  for (let week = 1; week <= 18; week++) {
    const file = scheduleEvidencePrefix + week + '.json';
    if (!fs.existsSync(file)) continue;
    let e;
    try { e = JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch { continue; }
    const weekGames = games.filter(g => Number(g.season) === 2026 && Number(g.week) === week);
    const playing = weekGames.flatMap(g => [g.home_team, g.away_team]);
    const unique = new Set(playing);
    if (e.schemaVersion !== 1 || e.match !== true || e.season !== 2026 ||
        e.week !== week || e.referenceSource !== scheduleSource ||
        e.localFile !== path.resolve(schedulePath) || e.localSha256 !== digest ||
        e.localGames !== weekGames.length || e.referenceGames !== weekGames.length ||
        !Number.isFinite(Date.parse(e.verifiedAt)) || Date.parse(e.verifiedAt) > Date.now() ||
        weekGames.length < 13 || weekGames.length > 16 ||
        playing.length !== unique.size || unique.size !== weekGames.length * 2 ||
        playing.some(t => !seasonTeams.has(t))) continue;
    result.push({season: 2026, week, verified: true,
      byeTeams: [...seasonTeams].filter(t => !unique.has(t))});
  }
  return result;
}

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
    {participationEvidence, verifiedByeWeeks: verifiedByeWeeks()}
  );

  // Report source-lag separately; never remove unresolved rows or relax parity.
  const scheduleGames = fs.existsSync(schedulePath)
    ? parseCSV(fs.readFileSync(schedulePath, 'utf8')) : [];
  const now = Date.now();
  const weekReadiness = [...new Set(yahoo.map(r =>
    [Number(r.season), Number(r.week)].join('|')))]
    .sort().map(pair => {
      const [season, week] = pair.split('|').map(Number);
      const games = scheduleGames.filter(g => Number(g.season) === season && Number(g.week) === week);
      const kickoffs = games.map(g => Date.parse(g.kickoffAt));
      const validSchedule = games.length >= 13 && games.length <= 16 &&
        kickoffs.every(Number.isFinite) &&
        new Set(games.flatMap(g => [g.home_team, g.away_team])).size === games.length * 2;
      const eligible = validSchedule && kickoffs.every(t => t + actualsFinalizationBufferMs <= now);
      const actualRows = nfl.filter(r => Number(r.season) === season && Number(r.week) === week);
      const actualTeams = new Set(actualRows.map(r => r.nflTeam));
      const scheduledTeams = new Set(games.flatMap(g => [g.home_team, g.away_team]));
      const completeTeams = eligible && [...scheduledTeams].every(t =>
        actualTeams.has(t) || (t === 'LAR' && actualTeams.has('LA')));
      return {season, week, status: !validSchedule ? 'unverified-schedule' :
        !eligible ? 'provisional-five-day-buffer' :
        !completeTeams ? 'provisional-source-incomplete' : 'team-coverage-ready',
        actualRows: actualRows.length, actualTeams: actualTeams.size,
        scheduledTeams: scheduledTeams.size};
    });
  report.actualsReadiness = {
    schemaVersion: 1, finalizationBufferDays: 5,
    weeks: weekReadiness,
    note: 'Diagnostic only. Team coverage does not prove player completeness or scoring parity.'
  };

  // Diagnostic partition only: source lag never excuses an unmatched score.
  const unresolvedByWeek = weekReadiness.map(source => {
    const rows = coverage.unresolved.filter(row =>
      Number(row.season) === source.season && Number(row.week) === source.week);
    const nonzero = rows.filter(row =>
      !Number.isFinite(row.yahooActual) || row.yahooActual !== 0).length;
    return {
      season: source.season, week: source.week, actualsStatus: source.status,
      unresolved: rows.length, unresolvedNonzero: nonzero,
      unresolvedZero: rows.length - nonzero,
      participationUnverified: rows.filter(row => row.participation === 'unverified').length
    };
  });
  report.participationCoverage = {
    ...coverage.summary,
    unresolvedRecords: coverage.unresolved,
    unresolvedByWeek
  };

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

  console.log('ACTUALS READINESS: ' + JSON.stringify(weekReadiness));

  console.log(
    'SCORING PARITY: ' +
    (coverage.summary.scoringParityPass ? 'PASS' : 'REVIEW REQUIRED') +
    '; ' + coverage.summary.unresolved +
    ' unmatched player-week records; ' +
    coverage.summary.unresolvedNonzero +
    ' unresolved nonzero records.'
  );

  console.log('UNRESOLVED BY WEEK: ' + JSON.stringify(unresolvedByWeek));

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