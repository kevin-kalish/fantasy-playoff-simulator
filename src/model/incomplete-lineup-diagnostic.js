// Diagnostic only: explain empty optimized slots without changing lineup selection.
const ALIASES={'D/ST':'DEF',DST:'DEF','W/R/T':'FLEX','W/R':'RB/WR','W/T':'WR/TE','Q/W/R/T':'SUPERFLEX'};
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const UNAVAILABLE=new Set(['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE','BYE']);
const norm=x=>ALIASES[String(x??'').toUpperCase()]??String(x??'').toUpperCase();
export function diagnoseIncompleteLineups(prepared){
 const rows=prepared?.diagnostics?.incompleteLineups??[];
 return rows.map(row=>{
  const team=(prepared?.league?.teams??[]).find(t=>String(t.id)===String(row.teamId));
  const week=Number(row.week);
  const lineup=team?.weeklyLineups?.[week]??[];
  const roster=team?.weeklyRosters?.[week]??team?.roster??[];
  const empty=lineup.filter(p=>p.status==='EMPTY');
  const slots=empty.map(p=>{
   const slot=norm(p.lineupSlot??p.position);
   const candidates=roster.filter(p=>(ELIGIBLE[slot]??[slot]).includes(norm(p.position)));
   const bye=candidates.filter(p=>Number(p.byeWeek)===week);
   const unavailable=candidates.filter(p=>UNAVAILABLE.has(String(p.status??'').toUpperCase()));
   const missing=candidates.filter(p=>p.projectionStatus==='missing'||p.projection==null||!Number.isFinite(Number(p.projection)));
   const reason=!candidates.length?'no-rostered-eligible-player':candidates.every(p=>Number(p.byeWeek)===week)?'all-eligible-on-bye':candidates.every(p=>UNAVAILABLE.has(String(p.status??'').toUpperCase()))?'all-eligible-unavailable':candidates.every(p=>p.projectionStatus==='missing'||p.projection==null||!Number.isFinite(Number(p.projection)))?'all-eligible-missing-projection':'insufficient-usable-eligible-players';
   return {slot,reason,eligibleRosterCount:candidates.length,byeCount:bye.length,unavailableCount:unavailable.length,missingProjectionCount:missing.length};
  });
  return {...row,slots,diagnosticStatus:empty.length===Number(row.emptySlots)?'complete':'partial'};
 });
}
