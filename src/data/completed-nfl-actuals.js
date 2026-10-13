import {parseCSV} from './csv.js';
import {nflverseFantasyPoints} from './nflverse.js';
const positions=new Set(['QB','RB','WR','TE','K']);
const canonical=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const number=v=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
const team=s=>({JAC:'JAX',WSH:'WAS',OAK:'LV',SD:'LAC',STL:'LA',LAR:'LA'}[String(s??'').toUpperCase()]??String(s??'').toUpperCase());
const key=(r)=>[Number(r.season),Number(r.week),canonical(r.name),String(r.position).toUpperCase(),team(r.nflTeam)].join('|');
export function normalizeCompletedNflverseActuals(csv,{season,scheduleRows,recordedAt=new Date().toISOString(),asOf=recordedAt}={}){
 if(!Number.isFinite(Date.parse(recordedAt))||!Number.isFinite(Date.parse(asOf)))throw new Error('Invalid actuals timestamp');
 const schedule=new Map();
 for(const g of scheduleRows??[]){
  for(const t of [g.home_team,g.away_team]){
   const k=[Number(g.season),Number(g.week),team(t)].join('|');
   if(schedule.has(k)&&schedule.get(k)!==g.kickoffAt)schedule.set(k,null);
   else if(!schedule.has(k))schedule.set(k,g.kickoffAt);
  }
 }
 const rows=[],rejected=[];
 for(const [i,r] of parseCSV(csv).entries()){
  if(Number(r.season)!==Number(season)||String(r.season_type).toUpperCase()!=='REG'||!positions.has(String(r.position).toUpperCase()))continue;
  const nflTeam=team(r.team),kickoffAt=schedule.get([Number(r.season),Number(r.week),nflTeam].join('|'));
  // A conservative 5-day buffer prevents in-progress games and late stat corrections from being treated as final.
  if(!kickoffAt||!Number.isFinite(Date.parse(kickoffAt))||Date.parse(kickoffAt)+5*86400000>Date.parse(asOf)){rejected.push({row:i+2,reason:'game-not-complete-or-kickoff-unknown'});continue;}
  const name=r.player_display_name||r.player_name,playerId=String(r.player_id??'').trim();
  if(!name||!playerId||!nflTeam||number(r.week)===null){rejected.push({row:i+2,reason:'missing-player-identity'});continue;}
  rows.push({season:Number(r.season),week:Number(r.week),playerId,name,position:String(r.position).toUpperCase(),nflTeam,scoring:'HALF',actual:nflverseFantasyPoints(r),actualRecordedAt:recordedAt,kickoffAt,source:'nflverse'});
 }
 return {rows,rejected};
}
export function reconcileProjectionActualIds(archives,actualRows){
 const byName=new Map(),ambiguous=new Set();
 for(const a of actualRows){
  const k=key(a);
  if(byName.has(k)&&byName.get(k).playerId!==a.playerId)ambiguous.add(k);
  else byName.set(k,a);
 }
 const ids=new Map(),conflicts=new Set();
 for(const archive of archives){
  for(const r of archive.data?.rows??[]){
   const k=key(r),a=byName.get(k),id=String(r.playerId??'').trim();
   if(!id||!a||ambiguous.has(k))continue;
   const pair=[Number(r.season),Number(r.week),id].join('|');
   if(ids.has(pair)&&ids.get(pair)!==a.playerId)conflicts.add(pair);
   else ids.set(pair,a.playerId);
  }
 }
 const mapped=[],rejected=[];
 const actualWeeks=new Set(actualRows.map(a=>[Number(a.season),Number(a.week)].join('|')));
 const actualWeeksByTeam=new Set(actualRows.map(a=>[Number(a.season),Number(a.week),team(a.nflTeam)].join('|')));
 for(const archive of archives){
  const rows=(archive.data?.rows??[]).map(r=>{
   const pair=[Number(r.season),Number(r.week),String(r.playerId??'').trim()].join('|'),a=byName.get(key(r));
   if(!a||ambiguous.has(key(r))||conflicts.has(pair)||ids.get(pair)!==a.playerId){
    const weekKey=[Number(r.season),Number(r.week)].join('|');
    const teamKey=[Number(r.season),Number(r.week),team(r.nflTeam)].join('|');
    const reason=!actualWeeks.has(weekKey)?'no-completed-actuals-for-week':!actualWeeksByTeam.has(teamKey)?'no-completed-actuals-for-team-week':!r.playerId?'missing-projection-player-id':ambiguous.has(key(r))?'ambiguous-player-identity':conflicts.has(pair)?'conflicting-player-id':'player-not-matched';
    rejected.push({season:r.season,week:r.week,name:r.name,reason});return {...r,playerId:''};}
   return {...r,playerId:a.playerId,originalProjectionPlayerId:r.playerId};
  });
  mapped.push({...archive,data:{...archive.data,rows}});
 }
 return {archives:mapped,rejected,matched:mapped.reduce((s,a)=>s+a.data.rows.filter(r=>r.playerId).length,0)};
}
