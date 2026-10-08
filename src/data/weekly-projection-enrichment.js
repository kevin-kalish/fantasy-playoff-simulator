const key=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,'').replace(/[^a-z0-9]/g,'');
const positionAlias=value=>{const p=String(value||'').trim().toUpperCase();return p==='DST'||p==='D/ST'?'DEF':p};
const TEAM_ALIASES={LA:'LAR',LAR:'LAR',JAC:'JAX',JAX:'JAX',WAS:'WSH',WSH:'WSH',NEP:'NE',NWE:'NE',NE:'NE'};
const pos=p=>positionAlias(p.position||p.pos);
const team=p=>{const t=String(p.nflTeam||p.team||'').trim().toUpperCase();return TEAM_ALIASES[t]||t};
const identity=p=>[key(p.name||p.playerName),pos(p),team(p)].join('|');
const namePosition=p=>[key(p.name||p.playerName),pos(p)].join('|');
const nameOnly=p=>key(p.name||p.playerName);
const defenseTeam=p=>pos(p)==='DEF'&&team(p)?team(p):'';
const id=p=>String(p.playerId||p.id||'');
const weekKey=(season,week)=>`${season||''}:${week}`;

function add(map,k,row){
 if(!k)return;
 const rows=map.get(k)||[];
 rows.push(row);
 map.set(k,rows);
}

function unique(map,k){
 const rows=map.get(k)||[];
 return rows.length===1?rows[0]:null;
}

function indexRows(rows){
 const byWeekId=new Map();
 const byWeekIdentity=new Map();
 const byWeekNamePosition=new Map();
 const byWeekName=new Map();
 const byWeekDefenseTeam=new Map();

 for(const row of rows||[]){
  const projection=Number(row.projection??row.projectedPoints);
  const week=Number(row.week);
  if(!Number.isFinite(projection)||!Number.isInteger(week))continue;

  const wk=weekKey(row.season,week);
  const rid=id(row);
  if(rid)byWeekId.set(`${wk}:${rid}`,row);
  add(byWeekIdentity,`${wk}:${identity(row)}`,row);
  add(byWeekNamePosition,`${wk}:${namePosition(row)}`,row);
  add(byWeekName,`${wk}:${nameOnly(row)}`,row);

  const defTeam=defenseTeam(row);
  if(defTeam)add(byWeekDefenseTeam,`${wk}:${defTeam}`,row);
 }

 return {byWeekId,byWeekIdentity,byWeekNamePosition,byWeekName,byWeekDefenseTeam};
}

function find(index,p,season,week){
 const wk=weekKey(season,week);
 const pid=id(p);
 const defTeam=defenseTeam(p);

 return (pid&&index.byWeekId.get(`${wk}:${pid}`))
  ||(defTeam&&unique(index.byWeekDefenseTeam,`${wk}:${defTeam}`))
  ||unique(index.byWeekIdentity,`${wk}:${identity(p)}`)
  ||unique(index.byWeekNamePosition,`${wk}:${namePosition(p)}`)
  ||unique(index.byWeekName,`${wk}:${nameOnly(p)}`)
  ||null;
}

function defenseMedians(rows,season,weeks){
 const medians=new Map();
 for(const week of weeks){
  const values=(rows||[]).filter(r=>Number(r.week)===Number(week)&&Number(r.season??season)===Number(season)&&pos(r)==='DEF'&&Number.isFinite(Number(r.projection??r.projectedPoints))).map(r=>Number(r.projection??r.projectedPoints)).sort((a,b)=>a-b);
  if(values.length)medians.set(week,values.length%2?values[(values.length-1)/2]:(values[values.length/2-1]+values[values.length/2])/2);
 }
 return medians;
}
const UNAVAILABLE=new Set(['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE']);
const normalizedStatus=s=>String(s||'').trim().toUpperCase();
function apply(p,row,week,{currentWeek=week}={}){
 if(!row){const status=normalizedStatus(p.status);return UNAVAILABLE.has(status)?{...p,status,projection:0,projectionStatus:'unavailable',availabilitySource:'yahoo-roster',rawProjection:null}:{...p,projection:null,projectionStatus:'missing'};}
 const rosterStatus=Number(week)===Number(currentWeek)?normalizedStatus(p.status):'';
 const providerStatus=normalizedStatus(row.status);
 const currentOnlyStatus=normalizedStatus(p.status);
 const unresolvedFuture=Number(week)>Number(currentWeek)&&UNAVAILABLE.has(currentOnlyStatus)&&!providerStatus;
 const unavailable=UNAVAILABLE.has(rosterStatus)||UNAVAILABLE.has(providerStatus);
 const status=unavailable?(UNAVAILABLE.has(rosterStatus)?rosterStatus:providerStatus):(rosterStatus&&rosterStatus!=='ACTIVE'?rosterStatus:providerStatus||'ACTIVE');
 const byeWeek=Number(row.byeWeek??p.byeWeek);
 const bye=status==='BYE'||byeWeek===week;
 return {
  ...p,
  projection:bye||unavailable?0:Number(row.projection??row.projectedPoints),
  ...(unavailable?{rawProjection:Number(row.projection??row.projectedPoints),availabilitySource:UNAVAILABLE.has(rosterStatus)?'yahoo-roster':'projection-provider'}:{}),
  ...(unresolvedFuture?{availabilityUncertain:true,availabilitySource:'prior-week-yahoo-status'}:{}),
  status:bye?'BYE':status,
  ...(Number.isInteger(byeWeek)?{byeWeek}:{}),
  projectionStatus:bye?'bye':unavailable?'unavailable':'matched'
 };
}

export function enrichWeeklyProjections(snapshot,projectionRows,{weeks=null,season=snapshot?.source?.season,strict=false}={}){
 const targetWeeks=weeks||[...new Set([
  ...(snapshot.schedule||[]).map(x=>Number(x.week)),
  ...(snapshot.playoffWeeks||[]).map(Number)
 ])].filter(Number.isInteger).sort((a,b)=>a-b);

 const index=indexRows(projectionRows);
 const medianDefense=defenseMedians(projectionRows,season,targetWeeks);
 const imputations=[],availabilityAudit=[];
 let matched=0,missing=0,bye=0,total=0;
 const missingPlayers=[];

 const teams=(snapshot.teams||[]).map(team=>{
  const weeklyRosters={};
  const weeklyLineups={};

  for(const week of targetWeeks){
   const base=team.roster?.length?team.roster:(team.weeklyLineups?.[week]||team.lineup||[]);
   const enriched=base.map(p=>{
    total++;
    const row=find(index,p,season,week);
    const median=medianDefense.get(week);
    const conflictingDefense=(projectionRows||[]).some(candidate=>Number(candidate.week)===Number(week)&&Number(candidate.season??season)===Number(season)&&pos(candidate)==='DEF'&&key(candidate.name||candidate.playerName)===key(p.name||p.playerName)&&team(candidate)&&team(p)&&team(candidate)!==team(p));
    const peerCount=(projectionRows||[]).filter(candidate=>Number(candidate.week)===Number(week)&&Number(candidate.season??season)===Number(season)&&pos(candidate)==='DEF'&&Number.isFinite(Number(candidate.projection??candidate.projectedPoints))).length;
    const imputed=!row&&!conflictingDefense&&pos(p)==='DEF'&&peerCount>=2&&Number.isFinite(median);
    const out=imputed?{...p,projection:median,projectionStatus:'imputed-defense',projectionSource:'weekly-defense-median',projectionConfidence:0.5}:apply(p,row,week,{currentWeek:Number(snapshot.currentWeek??snapshot.source?.currentWeek??Math.min(...targetWeeks))});
    if(out.projectionStatus==='unavailable'||out.availabilityUncertain||['QUESTIONABLE','DOUBTFUL','Q','D'].includes(normalizedStatus(out.status)))availabilityAudit.push({teamId:team.id,teamName:team.name,week,playerId:id(p),name:p.name,status:out.status,source:out.availabilitySource??'yahoo-roster',uncertain:Boolean(out.availabilityUncertain||['QUESTIONABLE','DOUBTFUL','Q','D'].includes(normalizedStatus(out.status))),rawProjection:out.rawProjection??out.projection});
    if(imputed)imputations.push({teamId:team.id,teamName:team.name,week,playerId:id(p),name:p.name,projection:median,method:'weekly-defense-median'});
    if(out.projectionStatus==='matched'||out.projectionStatus==='unavailable'||imputed)matched++;
    else if(out.projectionStatus==='bye')bye++;
    else{
     missing++;
     missingPlayers.push({teamId:team.id,teamName:team.name,week,name:p.name,position:p.position,nflTeam:p.nflTeam,playerId:id(p)});
     if(strict)throw new Error(`No projection match for ${p.name} (${p.position}, ${p.nflTeam}) in week ${week}.`);
    }
    return out;
   });

   weeklyRosters[week]=enriched;
   if(!team.roster?.length)weeklyLineups[week]=enriched;
   else if(team.weeklyLineups?.[week]){
    const wanted=new Set(team.weeklyLineups[week].map(id));
    weeklyLineups[week]=enriched.filter(p=>wanted.has(id(p)));
   }
  }

  return {...team,weeklyRosters,...(Object.keys(weeklyLineups).length?{weeklyLineups}:{})};
 });

 return {
  league:{...snapshot,teams},
  coverage:{total,matched,bye,missing,usable:matched+bye,matchRate:total?(matched+bye)/total:0,weeks:targetWeeks,missingPlayers,imputations,imputedCount:imputations.length,availabilityAudit,unavailableCount:availabilityAudit.filter(x=>UNAVAILABLE.has(x.status)).length}
 };
}
