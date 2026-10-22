// Read-only adapter for the private cross-provider audit. No scoring gates are changed.
export function coverageFromAudit(audit) {
 if (!audit || typeof audit !== 'object' || !audit.participationCoverage ||
     !Array.isArray(audit.participationCoverage.unresolvedRecords) ||
     !Array.isArray(audit.participationCoverage.unresolvedByWeek) ||
     !audit.actualsReadiness || !Array.isArray(audit.actualsReadiness.weeks) ||
     !audit.summary || !Number.isInteger(audit.summary.totalMatched)) {
   throw Error('Invalid cross-provider audit; cannot derive scoring priority');
 }
 const {unresolvedRecords, unresolvedByWeek, ...summary} = audit.participationCoverage;
 if (unresolvedByWeek.some(w => !Number.isInteger(w.unresolved) || w.unresolved < 0 ||
     !Number.isInteger(w.unresolvedNonzero) || w.unresolvedNonzero < 0) ||
     unresolvedByWeek.reduce((n, w) => n + w.unresolved, 0) !== unresolvedRecords.length ||
     unresolvedByWeek.reduce((n, w) => n + w.unresolvedNonzero, 0) !== summary.unresolvedNonzero) {
   throw Error('Cross-provider audit week totals conflict');
 }
 return {schemaVersion: 1, summary, unresolved: unresolvedRecords};
}
