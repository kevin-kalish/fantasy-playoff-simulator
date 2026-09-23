import {scoreDefense} from '../scoring.js';
const n=v=>Number(v||0);
const first=(r,names,def=0)=>{for(const k of names)if(r[k]!=null&&r[k]!=='')return n(r[k]);return def};
export function nflverseDSTFantasyPoints(r={}){
 const pa=first(r,['points_allowed','opponent_points','points_against'],0);
 return scoreDefense({
  sacks:first(r,['sacks','def_sacks']),
  interceptions:first(r,['interceptions','def_interceptions']),
  fumbleRecoveries:first(r,['fumble_recoveries','def_fumble_recoveries']),
  touchdowns:first(r,['defensive_tds','def_tds','touchdowns']),
  safeties:first(r,['safeties','def_safeties']),
  blockedKicks:first(r,['blocked_kicks','def_blocked_kicks']),
  returnTD:first(r,['kick_return_tds','punt_return_tds'])+first(r,['special_teams_tds']),
  extraPointReturned:first(r,['extra_point_returns','extra_point_returned']),pointsAllowed:pa
 });
}
export function normalizeNflverseDST(r={}){return{season:Number(r.season),week:Number(r.week),playerId:`DST:${r.team}`,name:`${r.team} DST`,position:'DEF',nflTeam:r.team,opponent:r.opponent_team,actual:nflverseDSTFantasyPoints(r),source:'nflverse-team-stats',seasonType:r.season_type||'REG'}}
export function importNflverseDST(rows=[],{regularSeasonOnly=true}={}){const filtered=regularSeasonOnly?rows.filter(r=>!r.season_type||String(r.season_type).toUpperCase()==='REG'):rows;return filtered.map(normalizeNflverseDST)}
