// Projection providers are intentionally isolated from the simulation engine.
// This lets us switch among manual data, FantasyPros, or future sources without
// changing season simulation code.

export class ProjectionProvider {
  async getWeeklyProjections(_season, _week) { throw new Error('Not implemented'); }
}

export class ManualProjectionProvider extends ProjectionProvider {
  constructor(rows=[]) { super(); this.rows=rows; }
  async getWeeklyProjections(season, week) {
    return this.rows.filter(r => r.season===season && r.week===week);
  }
}

export class FantasyProsProjectionProvider extends ProjectionProvider {
  constructor({apiKey, fetchImpl=fetch}) { super(); this.apiKey=apiKey; this.fetchImpl=fetchImpl; }
  async getWeeklyProjections(season, week) {
    if (!this.apiKey) throw new Error('FantasyPros API key required');
    const base='https://api.fantasypros.com/public/v2/json';
    const url=`${base}/nfl/${season}/projections?week=${week}`;
    const res=await this.fetchImpl(url,{headers:{'x-api-key':this.apiKey}});
    if(!res.ok) throw new Error(`FantasyPros request failed: ${res.status}`);
    const body=await res.json();
    return normalizeFantasyPros(body, season, week);
  }
}

export function normalizeFantasyPros(body, season, week) {
  const rows=body.players || body.projections || body.data || [];
  return rows.map(p=>({
    season, week,
    provider:'fantasypros',
    providerPlayerId:String(p.player_id ?? p.id ?? ''),
    name:p.player_name ?? p.name,
    team:p.player_team_id ?? p.team,
    position:p.player_position_id ?? p.position,
    projection:Number(p.fpts ?? p.fantasy_points ?? p.points ?? 0),
    stats:p.stats ?? p.projection ?? p
  }));
}
