const DEFAULT_SLOTS=['QB','RB','RB','WR','WR','TE','FLEX','K','DEF'];
const NON_STARTER_SLOTS=new Set(['BN','BENCH','IR','IR+','NA']);
const SLOT_ALIASES={'W/R/T':'FLEX','W/R':'RB/WR','W/T':'WR/TE','Q/W/R/T':'SUPERFLEX'};
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const value=p=>Number.isFinite(Number(p?.projection))?Number(p.projection):-Infinity;
const usable=(p,week)=>p&&p.projectionStatus!=='missing'&&String(p.status||'ACTIVE').toUpperCase()!=='OUT'&&String(p.status||'ACTIVE').toUpperCase()!=='IR'&&String(p.status||'ACTIVE').toUpperCase()!=='SUSPENDED'&&String(p.status||'ACTIVE').toUpperCase()!=='BYE'&&Number(p.byeWeek)!==Number(week)&&Number.isFinite(Number(p.projection));
const normalizeSlot=slot=>{const key=String(slot||'').trim().toUpperCase();return SLOT_ALIASES[key]||key};
const starterSlots=slots=>(slots||DEFAULT_SLOTS).map(normalizeSlot).filter(slot=>!NON_STARTER_SLOTS.has(slot));
const eligible=(p,slot)=>(ELIGIBLE[normalizeSlot(slot)]||[normalizeSlot(slot)]).includes(String(p.position||'').toUpperCase());

export function optimizeLineup(players,{week=null,slots=DEFAULT_SLOTS}={}){
 const activeSlots=starterSlots(slots);
 const pool=(players||[]).filter(p=>usable(p,week));let best=null,bestScore=-Infinity;
 const search=(i,used,lineup,score)=>{
  if(i===activeSlots.length){if(score>bestScore){bestScore=score;best=lineup.slice()}return}
  const slot=activeSlots[i];
  for(let j=0;j<pool.length;j++)if(!used.has(j)&&eligible(pool[j],slot)){
   used.add(j);lineup.push({...pool[j],lineupSlot:slot});search(i+1,used,lineup,score+value(pool[j]));lineup.pop();used.delete(j);
  }
  lineup.push({id:`EMPTY-${i}`,name:'Empty slot',position:String(slot),projection:0,status:'EMPTY',lineupSlot:slot});search(i+1,used,lineup,score);lineup.pop();
 };
 search(0,new Set(),[],0);
 const empty=(best||[]).filter(p=>p.status==='EMPTY').length;
 return {lineup:best||[],projectedPoints:Math.max(0,bestScore),emptySlots:empty,complete:empty===0};
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
