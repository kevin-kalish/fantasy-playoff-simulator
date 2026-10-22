// Diagnostic only. Do not alter score reconciliation, evidence, or calibration gates.
const validZero = value => value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '') && Number.isFinite(Number(value)) && Number(value) === 0;
export function prioritizeScoringReadiness(report) {
 if(report?.schemaVersion !== 1 || !Array.isArray(report.unresolved) || !report.summary || typeof report.summary !== 'object') throw Error('Invalid participation coverage report');
 const s=report.summary;
 const nonzero=report.unresolved.filter(r=>!validZero(r.yahooActual));
 const zeros=report.unresolved.filter(r=>validZero(r.yahooActual));
 if(nonzero.length!==s.unresolvedNonzero || report.unresolved.length!==s.unresolved)throw Error('Coverage totals conflict with unresolved rows');
 const issues=[
  {id:'score-mismatches',count:s.scoreMismatches,priority:'P0',blocking:true},
  {id:'unmatched-nonzero-or-missing',count:nonzero.length,priority:'P0',blocking:true},
  {id:'invalid-overrides',count:s.invalidOverrides,priority:'P0',blocking:true},
  {id:'ambiguous-identity',count:null,priority:'P0',blocking:true,detail:'Count not available in coverage summary; inspect score audit'},
  {id:'unmatched-zero',count:zeros.length,priority:'P2',blocking:false,detail:'Score of zero is observed; participation coverage remains separate'}
 ];
 for(const issue of issues)if(issue.count!==null&&(!Number.isInteger(issue.count)||issue.count<0))throw Error('Invalid issue count');
 const ordered=[...nonzero].sort((a,b)=>Number(a.week)-Number(b.week)||String(a.name).localeCompare(String(b.name))).map(r=>({season:r.season,week:r.week,yahooPlayerId:r.yahooPlayerId,name:r.name,position:r.position,nflTeam:r.nflTeam,yahooActual:Number.isFinite(Number(r.yahooActual))&&r.yahooActual!==null&&String(r.yahooActual).trim()!==''?Number(r.yahooActual):null,category:r.category}));
 return {schemaVersion:1,mode:'read-only-scoring-readiness-priority',summary:{unmatchedNonzeroOrMissing:nonzero.length,unmatchedZero:zeros.length,scoreMismatches:s.scoreMismatches,invalidOverrides:s.invalidOverrides,scoringParityPass:s.scoringParityPass,participationCoverageComplete:s.participationCoverageComplete},issues,priorityRecords:ordered,note:'Prioritization only. Unmatched zero is not a scoring mismatch. No source, participation, calibration, or forecast acceptance changes.'};
}
