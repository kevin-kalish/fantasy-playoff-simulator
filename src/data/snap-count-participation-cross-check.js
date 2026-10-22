// Diagnostic only. Snap counts are PFR-derived, not official inactive lists.
// Name/team/position joins are deliberately provisional; no evidence acceptance.
const norm = x => String(x ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const team = x => ({JAC:'JAX',WSH:'WAS',LAR:'LA',STL:'LA',SD:'LAC',OAK:'LV'}[String(x ?? '').toUpperCase()] ?? String(x ?? '').toUpperCase());
export function compareRosterToSnapCounts(report, snaps) {
  if (report?.schemaVersion !== 1 || !Array.isArray(report.records) || !Array.isArray(snaps)) throw Error('Invalid roster review or snap counts');
  const index = new Map();
  for (const row of snaps) {
    if (!Number.isInteger(Number(row.season)) || !Number.isInteger(Number(row.week)) || !row.player || !row.team || !row.position) continue;
    const key=[Number(row.season),Number(row.week),team(row.team),norm(row.player),norm(row.position)].join('|');
    if (!index.has(key)) index.set(key,[]);
    index.get(key).push(row);
  }
  const records=report.records.map(record=>{
    const key=[Number(record.season),Number(record.week),team(record.nflTeam),norm(record.name),norm(record.position)].join('|');
    const candidates=index.get(key) ?? [];
    let classification='no-snap-match', totalSnaps=null;
    if (candidates.length>1) classification='ambiguous-snap-match';
    else if (candidates.length===1) {
      const row=candidates[0], fields=['offense_snaps','defense_snaps','st_snaps'];
      const values=fields.map(k=>String(row[k]??'').trim());
      if (values.every(v=>v!=='' && Number.isFinite(Number(v)) && Number(v)>=0)) {
        totalSnaps=values.reduce((n,v)=>n+Number(v),0);
        classification=totalSnaps>0?'positive-snaps-name-match':'zero-snaps-name-match';
      } else classification='invalid-snap-counts';
    }
    return {season:record.season,week:record.week,yahooPlayerId:record.yahooPlayerId,name:record.name,reviewBucket:record.reviewBucket,classification,totalSnaps,identityVerified:false,verified:false,evidenceEligible:false};
  });
  const counts={};for(const row of records)counts[row.classification]=(counts[row.classification]??0)+1;
  return {schemaVersion:1,mode:'read-only-snap-count-cross-check',summary:{total:records.length,counts},records,note:'PFR snap counts matched provisionally by name/team/position. Positive snaps suggest participation, but are not identity-verified. Zero/missing snaps do not prove inactivity. No evidence acceptance.'};
}
