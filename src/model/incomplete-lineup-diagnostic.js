// Diagnostic only: explain missing submitted or optimized slots without changing lineup selection.
const ALIASES={'D/ST':'DEF',DST:'DEF','W/R/T':'FLEX','W/R':'RB/WR','W/T':'WR/TE','Q/W/R/T':'SUPERFLEX'};
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const UNAVAILABLE=new Set(['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE','BYE']);
const norm=x=>ALIASES[String(x??'').toUpperCase()]??String(x??'').toUpperCase();
const NON_STARTER=new Set(['BN','BENCH','IR','IR+','NA']);
function missingSubmittedSlots(lineup,required){
 const slots=required.map(norm).filter(slot=>!NON_STARTER.has(slot));
 const used=new Set(),matched=new Set();
 // Honor explicit submitted lineup-slot assignments first, including FLEX.
 for(const [i,p] of lineup.entries()){
  const assigned=norm(p.lineupSlot??p.slot);
  const j=slots.findIndex((slot,k)=>!used.has(k)&&slot===assigned);
  if(j>=0){used.add(j);matched.add(i);}
 }
 // For providers that omit slot labels, match by position; maximize matches
 // before choosing which slot is missing (e.g. RB versus FLEX).
 const remaining=slots.map((slot,j)=>({slot,j})).filter(x=>!used.has(x.j));
 const players=lineup.map((p,i)=>({p,i})).filter(x=>!matched.has(x.i));
 const assignment=new Map();
 function augment(player,visited){
  for(const {slot,j} of remaining){
   if(visited.has(j)||!(ELIGIBLE[slot]??[slot]).includes(norm(player.p.position)))continue;
   visited.add(j);
   if(!assignment.has(j)||augment(assignment.get(j),visited)){assignment.set(j,player);return true;}
  }
  return false;
 }
 for(const player of players)augment(player,new Set());
 return remaining.filter(x=>!assignment.has(x.j)).map(x=>x.slot);
}
export function diagnoseIncompleteLineups(prepared){
 const rows=prepared?.diagnostics?.incompleteLineups??[];
 return rows.map(row=>{
  const team=(prepared?.league?.teams??[]).find(t=>String(t.id)===String(row.teamId));
  const week=Number(row.week);
  const lineup=team?.weeklyLineups?.[week]??[];
  const roster=team?.weeklyRosters?.[week]??team?.roster??[];
  const empty=lineup.filter(p=>p.status==='EMPTY');
  const submitted=team?.lineupDiagnostics?.[week]?.source==='live-submitted';
  const required=prepared?.diagnostics?.lineupSlots??prepared?.input?.metadata?.lineupSlots??[];
  const missing=submitted&&required.length?missingSubmittedSlots(lineup,required):[];
  const missingSlotNames=submitted?missing:empty.map(p=>norm(p.lineupSlot??p.position));
  const slots=missingSlotNames.map(slot=>{
   const candidates=roster.filter(p=>(ELIGIBLE[slot]??[slot]).includes(norm(p.position)));
   const bye=candidates.filter(p=>p.byeWeek!=null&&Number(p.byeWeek)===week);
   const unknownBye=candidates.filter(p=>p.byeWeek==null);
   const unavailable=candidates.filter(p=>UNAVAILABLE.has(String(p.status??'').toUpperCase()));
   const missing=candidates.filter(p=>p.projectionStatus==='missing'||p.projection==null||!Number.isFinite(Number(p.projection)));
   const reason=!candidates.length?'no-rostered-eligible-player':candidates.every(p=>p.byeWeek!=null&&Number(p.byeWeek)===week)?'all-eligible-on-bye':candidates.every(p=>UNAVAILABLE.has(String(p.status??'').toUpperCase()))?'all-eligible-unavailable':candidates.every(p=>p.projectionStatus==='missing'||p.projection==null||!Number.isFinite(Number(p.projection)))?'all-eligible-missing-projection':'insufficient-usable-eligible-players';
   return {slot,reason,eligibleRosterCount:candidates.length,byeCount:bye.length,unavailableCount:unavailable.length,missingProjectionCount:missing.length,unknownByeCount:unknownBye.length,byeEvidence:unknownBye.length?'incomplete':'roster-field'};
  });
  return {...row,slots,diagnosticStatus:slots.length===Number(row.emptySlots)?'complete':'partial',...(submitted?{lineupSource:'live-submitted'}:{})};
 });
}
