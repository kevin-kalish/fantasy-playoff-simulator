const DEFAULT_SLOTS=['QB','RB','RB','WR','WR','TE','FLEX','K','DEF'];
const NON_STARTER_SLOTS=new Set(['BN','BENCH','IR','IR+','NA']);
const SLOT_ALIASES={'W/R/T':'FLEX','W/R':'RB/WR','W/T':'WR/TE','Q/W/R/T':'SUPERFLEX','D/ST':'DEF','DST':'DEF'};
const POSITION_ALIASES={'D/ST':'DEF','DST':'DEF'};
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const value=p=>Number.isFinite(Number(p?.projection))?Number(p.projection):-Infinity;
const UNAVAILABLE=new Set(['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE','BYE']);
const usable=(p,week)=>p&&p.projectionStatus!=='missing'&&!UNAVAILABLE.has(String(p.status||'ACTIVE').toUpperCase())&&Number(p.byeWeek)!==Number(week)&&Number.isFinite(Number(p.projection));
const normalizeSlot=slot=>{const key=String(slot||'').trim().toUpperCase();return SLOT_ALIASES[key]||key};
const normalizePosition=position=>{const key=String(position||'').trim().toUpperCase();return POSITION_ALIASES[key]||key};
const starterSlots=slots=>(slots||DEFAULT_SLOTS).map(normalizeSlot).filter(slot=>!NON_STARTER_SLOTS.has(slot));
const eligible=(p,slot)=>(ELIGIBLE[normalizeSlot(slot)]||[normalizeSlot(slot)]).includes(normalizePosition(p.position));

export function optimizeLineup(players,{week=null,slots=DEFAULT_SLOTS}={}){
 const activeSlots=starterSlots(slots),pool=(players||[]).filter(p=>usable(p,week)),n=activeSlots.length,memo=new Map();
 const search=(i,usedMask)=>{
  if(i===n)return {score:0,picks:[]};
  const key=`${i}:${usedMask.toString()}`,cached=memo.get(key);if(cached)return cached;
  const slot=activeSlots[i],emptyTail=search(i+1,usedMask);let best={score:emptyTail.score,picks:[-1,...emptyTail.picks]};
  for(let j=0;j<pool.length;j++){
   const bit=1n<<BigInt(j);if((usedMask&bit)!==0n||!eligible(pool[j],slot))continue;
   const tail=search(i+1,usedMask|bit),score=value(pool[j])+tail.score;
   if(score>best.score)best={score,picks:[j,...tail.picks]};
  }
  memo.set(key,best);return best;
 };
 const result=search(0,0n),lineup=result.picks.map((j,i)=>j<0?{id:`EMPTY-${i}`,name:'Empty slot',position:String(activeSlots[i]),projection:0,status:'EMPTY',lineupSlot:activeSlots[i]}:{...pool[j],lineupSlot:activeSlots[i]});
 const empty=lineup.filter(p=>p.status==='EMPTY').length;
 return {lineup,projectedPoints:Math.max(0,result.score),emptySlots:empty,complete:empty===0};
}

export function buildFutureWeeklyLineups(snapshot,{slots=DEFAULT_SLOTS,weeks=null,useRoster=true}={}){
 const targetWeeks=weeks||[...new Set([...(snapshot.schedule||[]).map(w=>Number(w.week)),...(snapshot.playoffWeeks||[]).map(Number)])].filter(Number.isInteger).sort((a,b)=>a-b);
 const teams=(snapshot.teams||[]).map(team=>{
  const weeklyLineups={...(team.weeklyLineups||{})},lineupDiagnostics={};
  for(const week of targetWeeks){
   const source=team.weeklyRosters?.[week]||(useRoster&&team.roster?.length?team.roster:weeklyLineups[week]||team.lineup||[]);
   const result=optimizeLineup(source,{week,slots});weeklyLineups[week]=result.lineup;
   lineupDiagnostics[week]={projectedPoints:result.projectedPoints,emptySlots:result.emptySlots,complete:result.complete,rosterPlayers:source.length};
  }
  return {...team,weeklyLineups,lineupDiagnostics};
 });
 return {...snapshot,teams};
}

export {DEFAULT_SLOTS};
