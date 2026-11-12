// Shared diagnostic identity and eligibility rules. No future transaction or availability is verified.
export const ELIGIBLE={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};
export const normPosition=x=>({'D/ST':'DEF',DST:'DEF','W/R/T':'FLEX','W/R':'RB/WR','W/T':'WR/TE'}[String(x??'').trim().toUpperCase()]??String(x??'').trim().toUpperCase());
export const normName=x=>String(x??'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,'').replace(/[^a-z0-9]/g,'');
export const normTeam=x=>({'LA':'LAR','JAC':'JAX','WAS':'WSH','NEP':'NE','NWE':'NE'}[String(x??'').trim().toUpperCase()]??String(x??'').trim().toUpperCase());
export const evidenceNumber=x=>x==null||x===''?null:Number.isFinite(Number(x))?Number(x):null;
export const unavailableStatus=x=>new Set(['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE','BYE']).has(String(x??'').trim().toUpperCase());
export const eligibleForSlot=(p,slot)=>(ELIGIBLE[normPosition(slot)]??[normPosition(slot)]).some(pos=>[normPosition(p.position),...(p.positions??[]).map(normPosition)].includes(pos));
export function matchingProjectionRows(p,rows,week,{season}={}){
 const position=normPosition(p.position),nflTeam=normTeam(p.nflTeam),name=normName(p.name);
 if(!position||!nflTeam||(position!=='DEF'&&!name))return [];
 return (rows??[]).filter(r=>Number(r.week)===Number(week)&&(season==null||Number(r.season)===Number(season))&&evidenceNumber(r.projection)!=null&&normPosition(r.position)===position&&normTeam(r.nflTeam)===nflTeam&&(position==='DEF'||normName(r.name)===name));
}
