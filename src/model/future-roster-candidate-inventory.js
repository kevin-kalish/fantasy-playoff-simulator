// Diagnostic-only inventory: position matches are not validated weekly projections,
// waiver availability guarantees, roster transactions, or simulation replacements.
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const norm=x=>({'D/ST':'DEF',DST:'DEF','W/R/T':'FLEX','W/R':'RB/WR','W/T':'WR/TE'}[String(x??'').toUpperCase()]??String(x??'').toUpperCase());
export function inventoryFutureRosterCandidates(futureRosterGaps,candidates=[]){
 const pool=Array.isArray(candidates)?candidates:[];
 return (futureRosterGaps??[]).map(row=>({
  teamName:row.teamName,week:row.week,
  slots:(row.slots??[]).map(slot=>{
   const matches=pool.filter(p=>(ELIGIBLE[norm(slot.slot)]??[norm(slot.slot)]).some(pos=>[norm(p.position),...(p.positions??[]).map(norm)].includes(pos)));
   return {slot:slot.slot,reason:slot.reason,positionMatches:matches.length,verifiedWeekProjectionMatches:0,projectionEvidence:'not-checked',replacementAssumed:false};
  })
 }));
}
