/** Distinguish verified source absence from unknown absence in truncated provider pools. */
export function assessPositionSourceCoverage(coverage,{sourceQuality=null}={}){
 const truncated=sourceQuality?.truncated===true;
 return Object.entries(coverage?.byPosition??{}).sort((a,b)=>a[0].localeCompare(b[0])).map(([position,v])=>({
  position,eligible:v.eligible,matched:v.matched,unmatched:v.eligible-v.matched,matchRate:v.eligible?v.matched/v.eligible:null,
  attribution:truncated?'source-truncated-unattributed':'source-completeness-unverified',
  note:truncated?'Unmatched players may be omitted by the provider top-N cap; identifier failure not established.':'Unmatched players cannot be attributed to identifiers without a verified complete source.'
 }));
}
