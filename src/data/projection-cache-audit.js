const number=v=>{const n=Number(v);return Number.isFinite(n)?n:undefined};

export function auditProjectionCache(rows,{season,weeks,minimumRows=1}={}){
 const targetSeason=number(season);
 const targetWeeks=[...new Set((weeks??[]).map(number).filter(Number.isInteger))].sort((a,b)=>a-b);
 if(!targetSeason)throw new Error('Projection cache audit requires a season.');
 if(!targetWeeks.length)throw new Error('Projection cache audit requires at least one week.');
 const weekResults=targetWeeks.map(week=>{
  const matching=(rows??[]).filter(row=>number(row?.season??row?.year)===targetSeason&&number(row?.week??row?.wk)===week);
  const usable=matching.filter(row=>String(row?.name??row?.player??'').trim()&&String(row?.position??row?.pos??'').trim()&&Number.isFinite(number(row?.projection??row?.projected??row?.fpts??row?.fantasyPoints??row?.fantasy_points??row?.points)));
  return {week,rows:matching.length,usableRows:usable.length,ready:usable.length>=minimumRows};
 });
 const missingWeeks=weekResults.filter(result=>!result.ready).map(result=>result.week);
 return {season:targetSeason,weeks:targetWeeks,minimumRows,ready:missingWeeks.length===0,missingWeeks,totalRows:weekResults.reduce((sum,result)=>sum+result.rows,0),usableRows:weekResults.reduce((sum,result)=>sum+result.usableRows,0),weekResults};
}

export function formatProjectionCacheAudit(audit){
 const status=audit.ready?'READY':'INCOMPLETE';
 const weeks=audit.weekResults.map(result=>`W${result.week}:${result.usableRows}${result.ready?'':'!'}`).join(' ');
 const missing=audit.missingWeeks.length?` | missing/insufficient ${audit.missingWeeks.map(week=>`W${week}`).join(',')}`:'';
 return `PROJECTION CACHE: ${status} | ${audit.season} | ${weeks}${missing}`;
}
