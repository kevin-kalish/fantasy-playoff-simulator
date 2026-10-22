// Read-only comparison of surviving historical forecasts. NOT an immutable history archive.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function compareHistoricalReports(documents) {
  if (!Array.isArray(documents) || documents.length === 0) throw new Error('No historical reports supplied');
  const rows = [];
  let teamId = null;
  const weeks = new Set();
  for (const {week, document} of documents) {
    const report = document?.report;
    if (!Number.isInteger(week) || week < 1 || week > 18 || weeks.has(week)) throw new Error('Invalid or duplicate report week');
    if (document?.readiness?.ready !== true || report?.trust?.trusted !== true) throw new Error('Report is not readiness-passing and trusted');
    if (![10, 11].includes(report.schemaVersion)) throw new Error('Unsupported report schema');
    if (!Number.isFinite(Date.parse(report.generatedAt))) throw new Error('Invalid report timestamp');
    if (!Array.isArray(report.league?.outlook) || !report.league.outlook.length) throw new Error('Missing league outlook');
    const id = String(report.team?.id ?? '');
    if (!id || (teamId !== null && id !== teamId)) throw new Error('Historical reports refer to different focus teams');
    teamId = id;
    const focus = report.league.outlook.find(t => String(t.id) === id);
    const probability = focus?.playoffProbability;
    if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1) throw new Error('Missing or invalid focus-team probability');
    weeks.add(week);
    rows.push({week,generatedAt:report.generatedAt,playoffProbability:probability,schemaVersion:report.schemaVersion});
  }
  rows.sort((a,b) => a.week-b.week);
  for (let i=1;i<rows.length;i++) {
    if (Date.parse(rows[i].generatedAt) < Date.parse(rows[i-1].generatedAt)) throw new Error('Report dates conflict with week ordering');
  }
  return rows;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
  const privateRoot=path.join(root,'data','private');
  const names=fs.readdirSync(privateRoot).filter(n=>/^fightin-kali-week-\d+-report\.json$/.test(n));
  const documents=names.map(name=>({week:Number(name.match(/week-(\d+)/)[1]),document:JSON.parse(fs.readFileSync(path.join(privateRoot,name),'utf8'))}));
  const rows=compareHistoricalReports(documents);
  console.log('HISTORICAL REPORT COMPARISON — not a captured weekly history archive; forecasts shown as originally saved.');
  for (const row of rows) console.log('Week '+row.week+' | '+row.generatedAt+' | '+(row.playoffProbability*100).toFixed(1)+'% | schema '+row.schemaVersion);
  console.log('No immutable history archive was created or modified.');
}
