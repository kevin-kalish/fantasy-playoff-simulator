// Compare Yahoo-derived league state, excluding model projections and other
// locally calculated fields. Fail closed if either side lacks expected data.
const id=value=>String(value??'').trim();
const players=items=>(items??[]).map(p=>({id:id(p.id??p.playerId),slot:id(p.lineupSlot).toUpperCase()})).sort((a,b)=>a.id.localeCompare(b.id)||a.slot.localeCompare(b.slot));
const pairs=week=>(week.matchups??[]).map(m=>Array.isArray(m)?m:[m.home??m.team1,m.away??m.team2]).map(pair=>pair.map(id).sort().join('|')).sort();
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function reconcileCaptureSnapshot(saved,live,{week}={}){
 const differences=[];
 const a=new Map((saved?.teams??[]).map(t=>[id(t.id),t]));
 const b=new Map((live?.teams??[]).map(t=>[id(t.id),t]));
 if(a.size!==(saved?.teams??[]).length||b.size!==(live?.teams??[]).length)differences.push('duplicate-team-id');
 if(!equal([...a.keys()].sort(),[...b.keys()].sort()))differences.push('team-ids');
 for(const teamId of a.keys()){
  const x=a.get(teamId),y=b.get(teamId);if(!y)continue;
  if(!Array.isArray(x.roster)||!Array.isArray(y.roster)||!equal(players(x.roster).map(p=>p.id),players(y.roster).map(p=>p.id)))differences.push('roster:'+teamId);
  const xLineup=x.weeklyLineups?.[week]??x.lineup,yLineup=y.weeklyLineups?.[week]??y.lineup;
  if(!Array.isArray(xLineup)||!Array.isArray(yLineup)||!equal(players(xLineup),players(yLineup)))differences.push('lineup:'+teamId);
 }
 const xWeeks=new Map((saved?.schedule??[]).map(w=>[Number(w.week),w]));
 const yWeeks=new Map((live?.schedule??[]).map(w=>[Number(w.week),w]));
 if(xWeeks.size!==(saved?.schedule??[]).length||yWeeks.size!==(live?.schedule??[]).length)differences.push('duplicate-schedule-week');
 for(const [w,x]of xWeeks){const y=yWeeks.get(w);if(!y||!equal(pairs(x),pairs(y)))differences.push('matchups:'+w);}
 if(!xWeeks.has(Number(week))||!yWeeks.has(Number(week)))differences.push('current-week-schedule');
 return {passed:differences.length===0,differences};
}
