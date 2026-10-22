// Pure eligibility check shared by capture CLI and offline integration tests.
// Provider retrieval establishes observation, not the forecast's original issuance.
const time=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))?Date.parse(value):null;
export function evaluatePregameCaptureArchive(archive){
 const rows=Array.isArray(archive?.rows)?archive.rows:[];
 const captured=time(archive?.capturedAt);
 const reasons={};
 let retrieved=0,kickoffVerified=0,issuanceVerified=0;
 for(const row of rows){
  const p=row.forecastProvenance??{},observed=time(p.retrievedAt??p.observedAt),kickoff=time(row.kickoffAt),issued=time(p.issuedAt);
  let reason=null;
  if(archive?.schemaVersion!==3||archive?.immutableArchive!==true||captured===null)reason='invalid-archive';
  else if(p.kind!=='fresh-provider-response'||!['jerrygm','fantasypros'].includes(p.provider)||observed===null||observed>captured||time(row.projectedAt)!==observed)reason='unverified-retrieval';
  else {
   retrieved++;
   if(kickoff===null||observed>=kickoff||captured>=kickoff)reason='kickoff-not-verified-pregame';
   else{
    kickoffVerified++;
    if(p.issuanceVerified===true&&issued!==null&&issued<=observed&&issued<kickoff)issuanceVerified++;
   }
  }
  if(reason)reasons[reason]=(reasons[reason]??0)+1;
 }
 return {rows:rows.length,freshProviderRows:retrieved,pregameKickoffVerifiedRows:kickoffVerified,providerIssuanceVerifiedRows:issuanceVerified,unverifiedRows:rows.length-retrieved,reasons};
}
