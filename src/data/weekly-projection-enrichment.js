const key=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const identity=p=>[key(p.name||p.playerName),String(p.position||p.pos||'').toUpperCase(),String(p.nflTeam||p.team||'').toUpperCase()].join('|');
const id=p=>String(p.playerId||p.id||'');
const weekKey=(season,week)=>`${season||''}:${week}`;

function indexRows(rows){
 const byWeekId=new Map(),byWeekIdentity=new Map();
 for(const row of rows||[]){
  const projection=Number(row.projection??row.projectedPoints);
  const week=Number(row.week);if(!Number.isFinite(projection)||!Number.isInteger(week))continue;
  const wk=weekKey(row.season,week),rid=id(row);
  if(rid)byWeekId.set(`${wk}:${rid}`,row);
  byWeekIdentity.set(`${wk}:${identity(row)}`,row);
 }
 return {byWeekId,byWeekIdentity};
}
function find(index,p,season,week){const wk=weekKey(season,week),pid=id(p);return (pid&&index.byWeekId.get(`${wk}:${pid}`))||index.byWeekIdentity.get(`${wk}:${identity(p)}`)||null}
function apply(p,row,week){
 if(!row)return {...p,projection:null,projectionStatus:'missing'};
 const status=String(row.status??p.status??'ACTIVE').toUpperCase();
 const byeWeek=Number(row.byeWeek??p.byeWeek);
 const bye=status==='BYE'||byeWeek===week;
 return {...p,projection:bye?0:Number(row.projection??row.projectedPoints),status:bye?'BYE':status,...(Number.isInteger(byeWeek)?{byeWeek}:{}),projectionStatus:bye?'bye':'matched'};
}

export function enrichWeeklyProjections(snapshot,projectionRows,{weeks=null,season=snapshot?.source?.season,strict=false}={}){
 const targetWeeks=weeks||[...new Set([...(snapshot.schedule||[]).map(x=>Number(x.week)),...(snapshot.playoffWeeks||[]).map(Number)])].filter(Number.isInteger).sort((a,b)=>a-b);
 const index=indexRows(projectionRows);let matched=0,missing=0,bye=0,total=0;
 const teams=(snapshot.teams||[]).map(team=>{
  const weeklyLineups={};
  for(const week of targetWeeks){
   const base=team.weeklyLineups?.[week]||team.lineup||[];
   weeklyLineups[week]=base.map(p=>{total++;const row=find(index,p,season,week);const out=apply(p,row,week);if(out.projectionStatus==='matched')matched++;else if(out.projectionStatus==='bye')bye++;else{missing++;if(strict)throw new Error(`No projection match for ${p.name} (${p.position}, ${p.nflTeam}) in week ${week}.`)}return out});
  }
  return {...team,weeklyLineups};
 });
 return {league:{...snapshot,teams},coverage:{total,matched,bye,missing,usable:matched+bye,matchRate:total?(matched+bye)/total:0,weeks:targetWeeks}};
}
