import assert from 'node:assert/strict';
import {prioritizeScoringReadiness} from '../src/data/scoring-readiness-priority.js';
import {coverageFromAudit} from '../src/data/scoring-priority-audit-adapter.js';
const base={schemaVersion:1,summary:{unresolved:3,unresolvedNonzero:2,scoreMismatches:0,invalidOverrides:0,scoringParityPass:false,participationCoverageComplete:false},unresolved:[{season:2026,week:2,name:'Zero',yahooPlayerId:'a',yahooActual:0},{season:2026,week:1,name:'Nonzero',yahooPlayerId:'b',yahooActual:3},{season:2026,week:3,name:'Missing',yahooPlayerId:'c',yahooActual:null}]};
const result=prioritizeScoringReadiness(base);
assert.equal(result.summary.unmatchedZero,1);
assert.equal(result.summary.unmatchedNonzeroOrMissing,2);
assert.deepEqual(result.priorityRecords.map(x=>x.name),['Nonzero','Missing']);
assert.equal(result.issues.find(x=>x.id==='unmatched-zero').blocking,false);
assert.throws(()=>prioritizeScoringReadiness({...base,summary:{...base.summary,unresolvedNonzero:1}}),/conflict/);
assert.throws(()=>prioritizeScoringReadiness({...base,unresolved:null}),/Invalid/);
const audit={summary:{totalMatched:637},actualsReadiness:{weeks:[]},participationCoverage:{
 ...base.summary,unresolvedRecords:base.unresolved,unresolvedByWeek:[
 {week:1,unresolved:1,unresolvedNonzero:1},
 {week:2,unresolved:1,unresolvedNonzero:0},
 {week:3,unresolved:1,unresolvedNonzero:1}
 ]}};
assert.deepEqual(prioritizeScoringReadiness(coverageFromAudit(audit)).summary,result.summary);
assert.throws(()=>coverageFromAudit({...audit,participationCoverage:{...audit.participationCoverage,unresolvedByWeek:[]}}),/conflict/);
assert.throws(()=>coverageFromAudit({...audit,actualsReadiness:null}),/Invalid/);
assert.throws(()=>coverageFromAudit({...audit,participationCoverage:{...audit.participationCoverage,unresolvedByWeek:[{week:1,unresolved:-1,unresolvedNonzero:2}]}}),/conflict/);
console.log('scoring-readiness-priority-tests: all checks passed');
