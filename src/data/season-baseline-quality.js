/** Source-level coverage is distinct from roster-level player matching. */
export function assessSeasonBaselineSource(payload,normalizedRows=[]){
 const returned=Array.isArray(payload?.players)?payload.players.length:Array.isArray(payload)?payload.length:normalizedRows.length;
 const reportedCount=Number(payload?.count),total=Number(payload?.total);
 const sourceCount=Number.isFinite(reportedCount)?reportedCount:returned;
 const sourceTotal=Number.isFinite(total)?total:null;
 const truncated=payload?.truncated===true;
 const byPosition={};
 for(const row of normalizedRows){const pos=String(row.position??row.pos??'UNKNOWN').toUpperCase();byPosition[pos]=(byPosition[pos]??0)+1;}
 const generatedAt=typeof payload?.generatedAt==='string'&&Number.isFinite(Date.parse(payload.generatedAt))?payload.generatedAt:null;
 const note=typeof payload?.truncatedNote==='string'?payload.truncatedNote:null;
 return {status:truncated?'truncated':'unverified-completeness',truncated,returned,reportedCount:sourceCount,total:sourceTotal,sourceFraction:sourceTotal>0?returned/sourceTotal:null,generatedAt,dataThroughWeek:Number.isInteger(Number(payload?.dataThroughWeek))?Number(payload.dataThroughWeek):null,byPosition,truncatedNote:note,rosterMatchingInterpretation:truncated?'Missing roster baselines may be absent from the truncated provider response; do not classify as identity-match failures without source verification.':'Source completeness has not been established; unmatched roster players may reflect missing source rows or identity differences.'};
}
