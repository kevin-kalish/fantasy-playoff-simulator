import {scoreDefense} from '../scoring.js';
const n=v=>Number(v||0), yes=v=>n(v)===1;
const teamOf=(r,k)=>String(r[k]||'').trim();
function ensure(map,season,week,team,opp){if(!team)return null;const key=`${season}:${week}:${team}`;if(!map.has(key))map.set(key,{season:Number(season),week:Number(week),team,opponent:opp||'',sacks:0,interceptions:0,fumbleRecoveries:0,touchdowns:0,safeties:0,blockedKicks:0,returnTD:0,extraPointReturned:0,pointsAllowed:0});return map.get(key)}
function fumbleRecoveryTeam(r){return teamOf(r,'fumble_recovery_2_team')||teamOf(r,'fumble_recovery_1_team')}
function finalScore(r,team){const home=teamOf(r,'home_team'),away=teamOf(r,'away_team');if(team===home)return n(r.total_home_score||r.home_score);if(team===away)return n(r.total_away_score||r.away_score);return 0}
export function aggregateNflversePbpDST(rows=[],{regularSeasonOnly=true}={}){
 const map=new Map(),games=new Map();
 for(const r of rows){if(regularSeasonOnly&&r.season_type&&String(r.season_type).toUpperCase()!=='REG')continue;const season=r.season,week=r.week,home=teamOf(r,'home_team'),away=teamOf(r,'away_team');if(!season||!week||!home||!away)continue;const h=ensure(map,season,week,home,away),a=ensure(map,season,week,away,home);const gid=r.game_id||`${season}_${week}_${away}_${home}`;games.set(gid,r);
  const def=teamOf(r,'defteam'),post=teamOf(r,'posteam'),d=ensure(map,season,week,def,post);
  if(d&&yes(r.sack))d.sacks++;
  if(d&&yes(r.interception))d.interceptions++;
  if(d&&yes(r.fumble_lost)&&fumbleRecoveryTeam(r)===def)d.fumbleRecoveries++;
  const td=teamOf(r,'td_team');if(yes(r.touchdown)&&td){const t=ensure(map,season,week,td,td===home?away:home);const isKick=yes(r.kickoff_attempt)||yes(r.punt_attempt);const isDef=!isKick&&post&&td!==post;if(t&&isKick)t.returnTD++;else if(t&&isDef)t.touchdowns++;}
  if(yes(r.safety)){const st=def||((post===home)?away:home);const t=ensure(map,season,week,st,st===home?away:home);if(t)t.safeties++;}
  const blocked=(yes(r.field_goal_attempt)&&String(r.field_goal_result||'').toLowerCase()==='blocked')||(yes(r.extra_point_attempt)&&String(r.extra_point_result||'').toLowerCase()==='blocked')||(yes(r.punt_attempt)&&yes(r.punt_blocked));if(blocked){const bt=def||((post===home)?away:home);const t=ensure(map,season,week,bt,bt===home?away:home);if(t)t.blockedKicks++;}
  if(yes(r.defensive_two_point_conv)){const rt=def||teamOf(r,'return_team');const t=ensure(map,season,week,rt,rt===home?away:home);if(t)t.extraPointReturned++;}
 }
 for(const r of games.values()){const home=teamOf(r,'home_team'),away=teamOf(r,'away_team'),hs=finalScore(r,home),as=finalScore(r,away);const h=ensure(map,r.season,r.week,home,away),a=ensure(map,r.season,r.week,away,home);h.pointsAllowed=as;a.pointsAllowed=hs;}
 return [...map.values()].filter(x=>x.team).map(x=>({...x,actual:scoreDefense(x),playerId:`DST:${x.team}`,name:`${x.team} DST`,position:'DEF',nflTeam:x.team,source:'nflverse-pbp'})).sort((a,b)=>a.season-b.season||a.week-b.week||a.team.localeCompare(b.team));
}
