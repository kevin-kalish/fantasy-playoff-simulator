// nflverse historical-data adapter.
// Intentionally isolated from the simulation engine so the data source can be replaced.

const BASE = "https://github.com/nflverse/nflverse-data/releases/download/player_stats";

export function weeklyStatsUrl(season, format="csv") {
  if (!Number.isInteger(season) || season < 1999) throw new Error("Invalid NFL season");
  if (format !== "csv") throw new Error("V1 browser adapter supports CSV only");
  return `${BASE}/player_stats.csv?season=${season}`;
}

export function normalizeWeeklyStat(row) {
  return {
    playerId: row.player_id || row.playerId || null,
    playerName: row.player_display_name || row.player_name || row.playerName || null,
    season: Number(row.season),
    week: Number(row.week),
    team: row.recent_team || row.team || null,
    position: row.position_group || row.position || null,
    passingYards: Number(row.passing_yards || 0),
    passingTDs: Number(row.passing_tds || 0),
    interceptions: Number(row.interceptions || 0),
    rushingYards: Number(row.rushing_yards || 0),
    rushingTDs: Number(row.rushing_tds || 0),
    receptions: Number(row.receptions || 0),
    receivingYards: Number(row.receiving_yards || 0),
    receivingTDs: Number(row.receiving_tds || 0),
    fumblesLost: Number(row.rushing_fumbles_lost || 0) + Number(row.receiving_fumbles_lost || 0) + Number(row.passing_fumbles_lost || 0)
  };
}
