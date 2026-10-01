// Provider-independent normalization for waiver/free-agent candidate pools.
// Adapters (Yahoo, fixtures, future providers) should emit roughly player-shaped
// records; the GM layer consumes the stable shape returned here.
const text = value => value == null ? '' : String(value).trim();
const number = value => Number.isFinite(Number(value)) ? Number(value) : null;

export function normalizeWaiverCandidate(player, source='unknown') {
  if (!player || typeof player !== 'object') return null;
  const id = text(player.id ?? player.playerId ?? player.player_id ?? player.key ?? player.playerKey);
  const name = text(player.name ?? player.fullName ?? player.full_name);
  if (!id || !name) return null;
  const positions = Array.isArray(player.positions) ? player.positions : [player.position ?? player.eligiblePositions].flat().filter(Boolean);
  return {
    id,
    name,
    position: text(player.position ?? positions[0]),
    positions: [...new Set(positions.map(text).filter(Boolean))],
    nflTeam: text(player.nflTeam ?? player.team ?? player.editorial_team_abbr),
    percentOwned: number(player.percentOwned ?? player.percent_owned),
    source: text(player.source) || source,
    raw: player
  };
}

export function buildWaiverCandidatePool(rows=[], {source='unknown', limit=30}={}) {
  const seen = new Set();
  const candidates = [];
  for (const row of rows) {
    const candidate = normalizeWaiverCandidate(row, source);
    if (!candidate || seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    candidates.push(candidate);
    if (candidates.length >= Math.max(0, Number(limit) || 0)) break;
  }
  return {source, candidates, diagnostics:{inputCount:rows.length, candidateCount:candidates.length, rejectedCount:rows.length-candidates.length}};
}
