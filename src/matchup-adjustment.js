function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x));}

export function opponentFactor({position, opponent, defenseSplits, weight=.35}) {
  // defenseSplits format: { BUF: { QB: 0.92, RB: 1.08, ... } }
  // Values represent opponent fantasy production allowed relative to league average.
  const raw=defenseSplits?.[opponent]?.[position] ?? 1;
  // Regress matchup effects toward neutral; defense-vs-position samples are noisy.
  return clamp(1 + (raw-1)*weight, .85, 1.15);
}

export function adjustedProjection(player, defenseSplits, options={}) {
  const factor=opponentFactor({
    position:player.position,
    opponent:player.opponent,
    defenseSplits,
    weight:options.weight ?? .35
  });
  return {...player, baseProjection:player.projection, matchupFactor:factor, projection:player.projection*factor};
}
