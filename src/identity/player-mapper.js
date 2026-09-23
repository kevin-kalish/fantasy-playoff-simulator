// Cross-provider player identity. Prefer stable IDs; use names only as a guarded fallback.
export function normalizeName(name="") {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g,"").replace(/[^a-z0-9]/g,"");
}

export function buildPlayerIndex(players) {
  const index={ yahoo:new Map(), fantasyPros:new Map(), nflverse:new Map(), fallback:new Map() };
  for (const p of players) {
    if (p.yahooId) index.yahoo.set(String(p.yahooId),p);
    if (p.fantasyProsId) index.fantasyPros.set(String(p.fantasyProsId),p);
    if (p.nflverseId) index.nflverse.set(String(p.nflverseId),p);
    const key=`${normalizeName(p.name)}|${p.position||""}|${p.team||""}`;
    if (!index.fallback.has(key)) index.fallback.set(key,[]);
    index.fallback.get(key).push(p);
  }
  return index;
}

export function resolvePlayer(index, candidate) {
  const direct=[
    candidate.yahooId && index.yahoo.get(String(candidate.yahooId)),
    candidate.fantasyProsId && index.fantasyPros.get(String(candidate.fantasyProsId)),
    candidate.nflverseId && index.nflverse.get(String(candidate.nflverseId))
  ].find(Boolean);
  if (direct) return { player:direct, confidence:"id" };
  const key=`${normalizeName(candidate.name)}|${candidate.position||""}|${candidate.team||""}`;
  const matches=index.fallback.get(key)||[];
  return matches.length===1 ? {player:matches[0],confidence:"name-position-team"} : {player:null,confidence:"unresolved"};
}
