// Adapter for nflverse weekly player-stat rows. Keeps source-specific field names
// outside the simulation/model layer.
const n=v=>Number(v||0);
export function nflverseToScoringStats(r={}){
  return {
    passYds:n(r.passing_yards),passTD:n(r.passing_tds),interceptions:n(r.interceptions),
    rushYds:n(r.rushing_yards),rushTD:n(r.rushing_tds),receptions:n(r.receptions),
    recYds:n(r.receiving_yards),recTD:n(r.receiving_tds),
    twoPoint:n(r.passing_2pt_conversions)+n(r.rushing_2pt_conversions)+n(r.receiving_2pt_conversions),
    fumblesLost:n(r.rushing_fumbles_lost)+n(r.receiving_fumbles_lost)+n(r.sack_fumbles_lost),
    returnTD:n(r.special_teams_tds),offensiveFumbleReturnTD:n(r.fantasy_fumble_recovery_tds)
  };
}
export function normalizeNFLVersePlayerWeek(r={}){
  return {season:n(r.season),week:n(r.week),playerId:String(r.player_id||''),name:r.player_display_name||r.player_name||null,position:String(r.position||'').toUpperCase(),nflTeam:r.team||null,opponent:r.opponent_team||null,seasonType:r.season_type||'REG',stats:nflverseToScoringStats(r)};
}
export function filterFantasyPositions(rows=[]){return rows.filter(r=>['QB','RB','WR','TE','K'].includes(String(r.position||'').toUpperCase()))}
