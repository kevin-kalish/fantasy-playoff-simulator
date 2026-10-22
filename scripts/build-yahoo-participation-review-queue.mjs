import fs from 'node:fs';
import path from 'node:path';
import {parseCSV} from '../src/data/csv.js';
import {buildParticipationReviewQueue} from '../src/data/yahoo-participation-review-queue.js';

try {
  const audit = JSON.parse(fs.readFileSync('data/private/yahoo-nflverse-score-audit.json', 'utf8'));
  const schedule = parseCSV(fs.readFileSync('data/private/nfl-kickoffs.csv', 'utf8'));
  const rows = audit.participationCoverage?.unresolvedRecords;
  const readiness = audit.actualsReadiness?.weeks;
  if (!Array.isArray(rows) || !Array.isArray(readiness)) {
    throw new Error('Missing cross-provider unresolved records or source readiness; run calibration:cross-provider-scores');
  }
  const queue = buildParticipationReviewQueue(rows, readiness, schedule);
  const output = 'data/private/yahoo-participation-review-queue.json';
  fs.mkdirSync(path.dirname(output), {recursive:true});
  fs.writeFileSync(output, JSON.stringify(queue, null, 2) + '\n', {flag:'w', mode:0o600});
  console.log('PARTICIPATION REVIEW QUEUE: ' + JSON.stringify(queue.summary));
  console.log('PARTICIPATION REVIEW QUEUE: private output ' + output + '; no automatic evidence, identity overrides or scoring changes.');
} catch (error) {
  console.error('PARTICIPATION REVIEW QUEUE: ERROR; ' + error.message);
  process.exitCode = 1;
}
