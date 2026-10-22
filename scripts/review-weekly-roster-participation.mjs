import fs from 'node:fs';
import path from 'node:path';
import {parseCSV} from '../src/data/csv.js';
import {reviewWeeklyRosterParticipation} from '../src/data/weekly-roster-participation-review.js';
try {
  const source=process.argv[2];
  if (!source || !source.startsWith('data/private/') || !source.endsWith('.csv') ||
      source.includes('..') || path.isAbsolute(source)) throw new Error('Pass a weekly roster CSV under data/private/');
  const queue=JSON.parse(fs.readFileSync('data/private/yahoo-participation-review-queue.json','utf8'));
  const csv=fs.readFileSync(source,'utf8');
  const rows=parseCSV(csv);
  if (!rows.length || !['season','week','yahoo_id','team','status'].every(k=>Object.hasOwn(rows[0],k))) throw new Error('Missing required weekly roster columns');
  const report=reviewWeeklyRosterParticipation(queue,rows);
  const output='data/private/weekly-roster-participation-review.json';
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{mode:0o600});
  console.log('WEEKLY ROSTER REVIEW: '+JSON.stringify(report.summary));
  console.log('WEEKLY ROSTER REVIEW: private read-only triage '+output+'; no evidence accepted.');
} catch (e) {
  console.error('WEEKLY ROSTER REVIEW: BLOCKED; '+e.message);
  process.exitCode=1;
}
