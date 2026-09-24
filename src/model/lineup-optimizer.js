const DEFAULT_SLOTS=['QB','RB','RB','WR','WR','TE','FLEX','K','DEF'];
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const value=p=>Number.isFinite(Number(p?.projection))?Number(p.projection):-Infinity;
const usable=(p,week)=>p&&p.projectionStatus!=='missing'&&String(p.status||'ACTIVE').toUpperCase()!=='OUT'&&String(p.status||'ACTIVE').toUpperCase()!=='IR'&&String(p.status||'ACTIVE').toUpperCase()!=='SUSPENDED'&&String(p.status||'ACTIVE').toUpperCase()!=='BYE'&&Number(p.byeWeek)!==Number(week)&&Number.isFinite(Number(p.projection));
const eligible=(p,slot)=>(ELIGIBLE[String(slot).toUpperCase()]||[String(slot).toUpperCase()]).includes(String(p.position||'').toUpperCase());

export function optimizeLineup(players,{week=null,slots=DEFAULT_SLOTS}={}){
 const pool=(players||[]).filter(p=>usable(p,week));let best=null,bestScore=-Infinity;
 const search=(i,used,lineup,score)=>{
  if(i===slots.length){if(score>bestScore){bestScore=score;best=lineup.slice()}return}
  const slot=slots[i];
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
