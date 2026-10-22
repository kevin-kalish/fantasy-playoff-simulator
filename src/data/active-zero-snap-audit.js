// Focused diagnostic: never auto-accept participation or scoring evidence.
export function auditActiveZeroSnapCases(roster, snapReport, names=['Rashee Rice','Mike Gesicki']) {
 if(roster?.schemaVersion!==1 || snapReport?.schemaVersion!==1 || !Array.isArray(roster.records)||!Array.isArray(snapReport.records))throw Error('Invalid input reports');
 const byKey=new Map();
 for(const row of roster.records){const k=[row.season,row.week,row.yahooPlayerId].join('|');if(byKey.has(k))throw Error('Duplicate roster identity');byKey.set(k,row);}
 const seen=new Set(), cases=[];
 for(const row of snapReport.records.filter(r=>names.includes(r.name))){
  const k=[row.season,row.week,row.yahooPlayerId].join('|');
  if(seen.has(k))throw Error('Duplicate snap identity');
  seen.add(k);
  const base=byKey.get(k);
  if(!base || base.name!==row.name || base.reviewBucket!=='activeZero' || row.reviewBucket!=='activeZero')throw Error('Conflicting active-zero review identity');
  cases.push({season:row.season,week:row.week,name:row.name,yahooPlayerId:row.yahooPlayerId,nflTeam:base.nflTeam,position:base.position,rosterStatus:base.rosterStatus,snapClassification:row.classification,provisionalSnaps:row.totalSnaps,identityVerified:false,scoringVerified:false,verified:false,evidenceEligible:false,nextChecks:['Confirm Yahoo player ID against authoritative NFL/PFR player ID','Confirm game date and week for snap row','Compare official game stats with Yahoo scoring settings and zero actual']});
 }
 if(cases.length!==names.length || names.some(n=>cases.filter(c=>c.name===n).length!==1))throw Error('Missing or duplicate target case');
 return {schemaVersion:1,mode:'read-only-active-zero-identity-scoring-audit',summary:{total:cases.length,unverified:cases.length},cases,note:'Requires independent player identity, dated game statistics and league scoring comparison. No accepted evidence.'};
}
