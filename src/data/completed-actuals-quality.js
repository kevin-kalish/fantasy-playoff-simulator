const validTime=v=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const positions=new Set(['QB','RB','WR','TE','K']);
export function auditCompletedActuals(rows,{sourceScoring='HALF'}={}){
 const issues=[],keys=new Map(),weeks=new Map(),positionsCount={};
 for(const [i,r] of rows.entries()){
  const row=i+1;
  const season=Number(r.season),week=Number(r.week),id=String(r.playerId??'').trim();
  const pos=String(r.position??'').toUpperCase(),team=String(r.nflTeam??'').trim();
  const scoring=String(r.scoring??'').toUpperCase();
  const fail=reason=>issues.push({row,reason,playerId:id||null,season:r.season??null,week:r.week??null});
  if(!Number.isInteger(season)||season<2000||!Number.isInteger(week)||week<1||week>18)fail('invalid-season-week');
  if(!id||!String(r.name??'').trim()||!team)fail('missing-identity');
  if(!positions.has(pos))fail('invalid-position');
  else positionsCount[pos]=(positionsCount[pos]??0)+1;
  if(scoring!==sourceScoring)fail('scoring-mismatch');
  if(!finite(r.actual)||r.actual < -50 || r.actual > 100)fail('invalid-actual-score');
  if(!validTime(r.actualRecordedAt)||!validTime(r.kickoffAt)||validTime(r.actualRecordedAt)&&validTime(r.kickoffAt)&&Date.parse(r.actualRecordedAt)<Date.parse(r.kickoffAt))fail('invalid-timeline');
  if(r.source!=='nflverse')fail('unexpected-source');
  const key=[season,week,id].join('|');
  if(id&&Number.isInteger(season)&&Number.isInteger(week)){
   if(keys.has(key))fail('duplicate-player-week');
   else keys.set(key,row);
  }
  if(Number.isInteger(week))weeks.set(week,(weeks.get(week)??0)+1);
 }
 const reasons=Object.fromEntries([...issues.reduce((m,x)=>m.set(x.reason,(m.get(x.reason)??0)+1),new Map())].sort((a,b)=>a[0].localeCompare(b[0])));
 return {schemaVersion:1,rows:rows.length,uniquePlayerWeeks:keys.size,positions:positionsCount,weeks:Object.fromEntries([...weeks].sort((a,b)=>a[0]-b[0])),issueCount:issues.length,reasons,issues,pass:issues.length===0,scoringVerifiedAgainstYahoo:false,note:'Structural audit only. NFLverse-derived fantasy points are not independently reconciled to Yahoo league scoring.'};
}
