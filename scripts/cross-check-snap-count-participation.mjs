import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parseCSV} from '../src/data/csv.js';
import {compareRosterToSnapCounts} from '../src/data/snap-count-participation-cross-check.js';
try {
  const source=process.argv[2];
  if(!source || !/^data\/private\/[a-zA-Z0-9_.-]+\.csv$/.test(source) || path.isAbsolute(source))throw Error('Pass snap counts CSV directly under data/private/');
  const report=JSON.parse(fs.readFileSync('data/private/weekly-roster-participation-review.json','utf8'));
  if(report.provenance?.evidenceEligible!==false)throw Error('Roster report provenance must be explicitly ineligible');
  const bytes=fs.readFileSync(source),rows=parseCSV(bytes.toString('utf8'));
  const required=['season','week','player','team','position','offense_snaps','defense_snaps','st_snaps'];
  if(!rows.length || !required.every(k=>Object.hasOwn(rows[0],k)))throw Error('Missing snap count columns');
  const out=compareRosterToSnapCounts(report,rows);
  out.provenance={sourceUrl:'https://github.com/nflverse/nflverse-data/releases/download/snap_counts/snap_counts_2026.csv',sourcePath:source,sourceSha256:crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),reviewGeneratedAt:new Date().toISOString(),source:'nflverse/PFR-snap-counts',identityMethod:'provisional-name-team-position',evidenceEligible:false};
  const output='data/private/snap-count-participation-cross-check.json';
  fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n',{mode:0o600});
  console.log('SNAP COUNT CROSS-CHECK: '+JSON.stringify(out.summary));
  console.log('SNAP COUNT CROSS-CHECK: '+output+'; no accepted evidence.');
} catch(e){console.error('SNAP COUNT CROSS-CHECK: BLOCKED; '+e.message);process.exitCode=1;}
