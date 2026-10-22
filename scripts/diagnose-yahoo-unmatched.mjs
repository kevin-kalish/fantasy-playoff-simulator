import fs from 'node:fs';
import path from 'node:path';
import { diagnoseUnmatchedYahooPlayers } from '../src/data/yahoo-unmatched-diagnostics.js';
import { parseKickoffScheduleCSV } from '../src/data/projection-kickoff-enrichment.js';
import { inspectKickoffVerificationEvidence } from '../src/data/kickoff-verification-evidence.js';

const load = file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data.rows)) {
    throw new Error('Expected rows array in ' + file);
  }
  return data.rows;
};

try {
  const nfl = load('data/private/historical-actuals.json');
  const yahoo = load('data/private/yahoo-player-actuals.json');

  const scheduleFile = 'data/private/nfl-kickoffs.csv';

  if (!fs.existsSync(scheduleFile)) {
    throw new Error('Missing kickoff schedule: ' + scheduleFile);
  }

  const scheduleRows = parseKickoffScheduleCSV(
    fs.readFileSync(scheduleFile, 'utf8')
  );

const verification = inspectKickoffVerificationEvidence({
  file: scheduleFile,
  season: 2026,
  week: 6
});

const verifiedScheduleWeeks = verification.ready
  ? [{ season: 2026, week: 6 }]
  : [];

console.log(
  'SCHEDULE VERIFICATION: ' +
  (verification.ready ? 'verified' : verification.reason)
);

const report = diagnoseUnmatchedYahooPlayers(nfl, yahoo, {
  scheduleRows,
  asOf: new Date().toISOString(),
  verifiedScheduleWeeks
});

  const output = 'data/private/yahoo-unmatched-diagnostics.json';

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');

  console.log(
    'UNMATCHED YAHOO: ' + report.unmatched +
    ' of ' + report.yahooRows + ' Yahoo records need review.'
  );
  console.log('UNMATCHED REASONS: ' + JSON.stringify(report.reasons));
  console.log(
    'UNMATCHED YAHOO: private report ' + output +
    '; no automatic player mapping or model changes.'
  );
} catch (error) {
  console.error('UNMATCHED YAHOO: ERROR; ' + error.message);
  process.exitCode = 1;
}