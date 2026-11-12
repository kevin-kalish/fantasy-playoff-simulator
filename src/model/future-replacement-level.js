// Read-only, opt-in replacement-level scenario estimates. Not a roster transaction or trusted forecast.
const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
const norm=x=>({'DST':'DEF','D/ST':'DEF','W/R/T':'FLEX'}[String(x??'').trim().toUpperCase()]??String(x??'').trim().toUpperCase());
const clean=x=>String(x??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,'').replace(/[^a-z0-9]/g,'');
const team=x=>({'LA':'LAR','JAC':'JAX','WAS':'WSH','NEP':'NE','NWE':'NE'}[String(x??'').trim().toUpperCase()]??String(x??'').trim().toUpperCase());
const number=x=>x==null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
const eligible=(p,slot)=>(ELIGIBLE[norm(slot)]??[norm(slot)]).some(x=>[norm(p.position),...(p.positions??[]).map(norm)].includes(x));
const unavailable=new Set(['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE']);
function directProjection(p,rows,week,season){
 const same=rows.filter(r=>Number(r.week)===Number(week)&&Number(r.season)===Number(season)&&number(r.projection)!=null&&norm(r.position)===norm(p.position)&&clean(r.name)&&clean(r.name)===clean(p.name)&&team(r.nflTeam)&&team(r.nflTeam)===team(p.nflTeam));
 return same.length===1?number(same[0].projection):null;
}
export function estimateFutureReplacementLevels(gaps,candidates,projectionRows,{season,currentWeek,baselines={},minDirectCandidates=5}={}){
 const pool=Array.isArray(candidates)?candidates:[],rows=Array.isArray(projectionRows)?projectionRows:[];
 const usedByWeek=new Map();
 return (gaps??[]).flatMap(gap=>(gap.slots??[]).map(slot=>{
  const week=Number(gap.week),position=norm(slot.slot);
  const result={teamId:gap.teamId??null,teamName:gap.teamName??null,week,slot:slot.slot,points:null,method:'unavailable',provisional:true,replacementAssumed:false,verifiedFutureAvailability:false,verifiedProjection:false};
  if(!Number.isInteger(week)||!Number.isInteger(Number(currentWeek))||week<=Number(currentWeek)||!Number.isInteger(Number(season)))return result;
  const used=usedByWeek.get(week)??new Set();usedByWeek.set(week,used);
  const eligiblePool=pool.filter(p=>!used.has(String(p.id??''))&&p.id!=null&&eligible(p,position)&&number(p.byeWeek)!=null&&Number(p.byeWeek)!==week&&!unavailable.has(String(p.status??'').toUpperCase()));
  const ranked=eligiblePool.map(p=>({...p,points:directProjection(p,rows,week,season)})).filter(p=>p.points!=null).sort((a,b)=>b.points-a.points);
  if(ranked.length>=Math.max(5,Number(minDirectCandidates)||5)){
   const sample=ranked.slice(2,5);
   result.points=sample.reduce((s,p)=>s+p.points,0)/sample.length;
   result.method='direct-week-ranks-3-to-5';result.sampleSize=ranked.length;
   // Reserve a distinct hypothetical candidate for every gap; never claim acquisition.
   used.add(String(ranked[2].id));
  }else{
   const baseline=number(baselines[position]);
   if(baseline!=null&&baseline>=0){result.points=baseline;result.method='assumed-position-baseline';result.sampleSize=ranked.length;}
  }
  if(result.points!=null)result.replacementAssumed=true;
  return result;
 }));
}
