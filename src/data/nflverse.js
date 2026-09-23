import {HistoricalDataAdapter} from './provider-adapter.js';
import {scoreOffense,scoreKicker} from '../scoring.js';
const n=(v)=>Number(v||0);
export function nflverseFantasyPoints(r={}){
 const pos=String(r.position||'').toUpperCase();
 if(pos==='K')return scoreKicker({fg0_19:n(r.fg_made_0_19),fg20_29:n(r.fg_made_20_29),fg30_39:n(r.fg_made_30_39),fg40_49:n(r.fg_made_40_49),fg50plus:n(r.fg_made_50_plus),xpMade:n(r.pat_made)});
 return scoreOffense({passYds:n(r.passing_yards),passTD:n(r.passing_tds),interceptions:n(r.passing_interceptions),rushYds:n(r.rushing_yards),rushTD:n(r.rushing_tds),receptions:n(r.receptions),recYds:n(r.receiving_yards),recTD:n(r.receiving_tds),returnTD:n(r.return_touchdowns),twoPoint:n(r.passing_2pt_conversions)+n(r.rushing_2pt_conversions)+n(r.receiving_2pt_conversions),fumblesLost:n(r.fumbles_lost),offensiveFumbleReturnTD:n(r.fumble_recovery_tds)});
}
export class NflverseActualsAdapter extends HistoricalDataAdapter{
 constructor(){super({id:'nflverse-weekly',label:'nflverse weekly player stats',version:'1'})}
 normalize(r={}){return{season:r.season,week:r.week,playerId:r.player_id,name:r.player_display_name||r.player_name,position:r.position,nflTeam:r.team,opponent:r.opponent_team,projection:0,actual:nflverseFantasyPoints(r),status:'ACTIVE',source:'nflverse',projectionTimestamp:null}}
}
export function normalizeNflverseActual(r={}){return new NflverseActualsAdapter().normalize(r)}
export const NFLVERSE_REQUIRED_COLUMNS=['player_id','player_display_name','position','season','week','season_type','team','opponent_team','passing_yards','passing_tds','passing_interceptions','rushing_yards','rushing_tds','receptions','receiving_yards','receiving_tds','fumbles_lost'];
