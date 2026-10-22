import fs from 'node:fs';
import {prioritizeScoringReadiness} from '../src/data/scoring-readiness-priority.js';

export function coverageFromAudit(audit) {
 if (!audit || typeof audit !== 'object' || !audit.participationCoverage ||
     !Array.isArray(audit.participationCoverage.unresolvedRecords) ||
     !Array.isArray(audit.participationCoverage.unresolvedByWeek) ||
     !audit.actualsReadiness || !Array.isArray(audit.actualsReadiness.weeks) ||
     !audit.summary || !Number.isInteger(audit.summary.totalMatched)) {
   throw Error('Invalid cross-provider audit; cannot derive scoring priority');
 }
 const {unresolvedRecords, unresolvedByWeek, ...summary} = audit.participationCoverage;
 if (unresolvedByWeek.reduce((n, w) => n + w.unresolved, 0) !== unresolvedRecords.length ||
     unresolvedByWeek.reduce((n, w) => n + w.unresolvedNonzero, 0) !== summary.unresolvedNonzero) {
   throw Error('Cross-provider audit week totals conflict');
 }
 return {schemaVersion: 1, summary, unresolved: unresolvedRecords};
}

try {
 const source='data/private/yahoo-nflverse-score-audit.json';
 const input=process.argv[2]??source;
 if (!/^data\/private\/[a-zA-Z0-9_.-]+\.json$/.test(input)) throw Error('Input must be directly under data/private/');
 if (!fs.existsSync(input)) throw Error('Missing '+input+'; run npm run calibration:cross-provider-scores first');
 const raw=JSON.parse(fs.readFileSync(input,'utf8'));
 const report=input===source ? coverageFromAudit(raw) : raw;
 const result=prioritizeScoringReadiness(report);
 const output='data/private/scoring-readiness-priority.json';
 fs.writeFileSync(output,JSON.stringify({
  ...result, sourceReport: input,
  sourceNote: input===source ? 'Derived from cross-provider audit; rerun audit after refreshing actuals.' : 'Explicit standalone coverage report; verify it was regenerated after the latest audit.'
 },null,2)+'\n',{mode:0o600});
 console.log('SCORING PRIORITY: '+JSON.stringify(result.summary));
 console.table(result.priorityRecords.slice(0,20));
 console.log('SCORING PRIORITY: private report '+output+'; no gates changed.');
}catch(e){console.error('SCORING PRIORITY: BLOCKED; '+e.message);process.exitCode=1;}
