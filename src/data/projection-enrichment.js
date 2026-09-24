const key=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
const playerKey=p=>[key(p.name),String(p.position||'').toUpperCase(),String(p.nflTeam||'').toUpperCase()].join('|');

export function enrichLeagueSnapshotProjections(snapshot,projectionRows,{strict=false}={}){
 const byId=new Map(),byIdentity=new Map();
 for(const row of projectionRows||[]){
  const projection=Number(row.projection??row.projectedPoints);
  if(!Number.isFinite(projection))continue;
  if(row.playerId||row.id)byId.set(String(row.playerId||row.id),projection);
  byIdentity.set(playerKey(row),projection);
 }
 let matched=0,total=0;
 const enrich=p=>{
  total++;
  const projection=byId.get(String(p.id))??byIdentity.get(playerKey(p));
  if(Number.isFinite(projection)){matched++;return {...p,projection}}
  if(strict)throw new Error(`No projection match for ${p.name} (${p.position}, ${p.nflTeam}).`);
  return p;
 };
 const teams=snapshot.teams.map(t=>({...t,lineup:t.lineup.map(enrich),...(t.weeklyLineups?{weeklyLineups:Object.fromEntries(Object.entries(t.weeklyLineups).map(([w,players])=>[w,players.map(enrich)]))}:{})}));
 return {league:{...snapshot,teams},matched,total,matchRate:total?matched/total:0};
}
