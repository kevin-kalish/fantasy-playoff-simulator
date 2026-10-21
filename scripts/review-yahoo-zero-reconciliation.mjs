import fs from 'node:fs';
import {summarizeYahooZeroReconciliation} from '../src/data/yahoo-zero-reconciliation.js';
try {
  const yahoo=JSON.parse(fs.readFileSync('data/private/yahoo-player-actuals.json','utf8'));
  const audit=JSON.parse(fs.readFileSync('data/private/yahoo-nflverse-score-audit.json','utf8'));
  const result=summarizeYahooZeroReconciliation(yahoo.rows,audit,2026,5);
  console.log('YAHOO ZERO RECONCILIATION: '+JSON.stringify(result));
  if (!result.classificationComplete || result.missing) process.exitCode=2;
} catch(e) {
  console.error('YAHOO ZERO RECONCILIATION: ERROR; '+e.message);
  process.exitCode=1;
}
