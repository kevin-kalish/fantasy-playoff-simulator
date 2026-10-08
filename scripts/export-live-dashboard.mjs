import fs from 'node:fs';
import path from 'node:path';
import { weeklyReportToDashboardV1 } from '../src/ui/live-dashboard-export.js';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node scripts/export-live-dashboard.mjs <weekly-report.json> <dashboard-output.json>');
  process.exit(1);
}
const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (input.readiness?.ready === false) throw new Error('Weekly report failed readiness gate');
const payload = weeklyReportToDashboardV1(input.report ?? input);
const output = path.resolve(outputPath);
fs.mkdirSync(path.dirname(output), { recursive: true });
const temporary = output + '.tmp';
try {
  fs.writeFileSync(temporary, JSON.stringify(payload, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temporary, output);
} finally {
  if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
}
console.error('Dashboard export written: ' + output);
