const POSITIONS=new Set(['QB','RB','WR','TE','K','DEF']);
const num=(v,fallback=0)=>{const n=Number(v);return Number.isFinite(n)?n:fallback};
const text=(v)=>v==null?'':String(v).trim();

export const LEAGUE_SNAPSHOT_VERSION=1;

function normalizePlayer(raw,index,teamId){
 const position=text(raw.position||raw.pos).toUpperCase();
 return {
  id:text(raw.id||raw.playerId||raw.player_id)||`${teamId}-P${index+1}`,
  name:text(raw.name||raw.playerName||raw.player_name)||`Unknown ${position||'player'}`,
  position,
  nflTeam:text(raw.nflTeam||raw.team||raw.proTeam).toUpperCase(),
  projection:num(raw.projection??raw.projectedPoints??raw.projected_points,0),
  ...(Number.isFinite(Number(raw.cv))?{cv:Number(raw.cv)}:{}),
  ...(raw.status?{status:text(raw.status).toUpperCase()}:{}),
  ...(raw.byeWeek!=null?{byeWeek:num(raw.byeWeek,null)}:{}),
 };
}

function normalizeTeam(raw,index){
 const id=text(raw.id||raw.teamId||raw.team_id)||`T${index+1}`;
 const lineup=(raw.lineup||raw.starters||[]).map((p,i)=>normalizePlayer(p,i,id));
 const weeklyLineups={};
 for(const [week,players] of Object.entries(raw.weeklyLineups||{})) weeklyLineups[week]=(players||[]).map((p,i)=>normalizePlayer(p,i,id));
 return {
  id,
  name:text(raw.name||raw.teamName||raw.team_name)||id,
  wins:num(raw.wins),losses:num(raw.losses),ties:num(raw.ties),
  points:num(raw.points??raw.pointsFor??raw.points_for),
  lineup,
  ...(Object.keys(weeklyLineups).length?{weeklyLineups}:{}),
 };
}

function normalizeMatchup(raw){
 if(Array.isArray(raw)) return [text(raw[0]),text(raw[1])];
 return [text(raw.home||raw.team1||raw.a),text(raw.away||raw.team2||raw.b)];
}

function normalizeWeek(raw){
 return {week:num(raw.week),matchups:(raw.matchups||raw.games||[]).map(normalizeMatchup),...(raw.forcedWinners?{forcedWinners:raw.forcedWinners}:{})};
}

export function normalizeLeagueSnapshot(input){
 const raw=typeof input==='string'?JSON.parse(input):input;
 if(!raw||typeof raw!=='object'||Array.isArray(raw)) throw new Error('League snapshot must be a JSON object.');
 const source=raw.source||{};
 return {
  schemaVersion:LEAGUE_SNAPSHOT_VERSION,
  source:{provider:text(source.provider||raw.provider||'manual').toLowerCase(),...(source.leagueId||raw.leagueId?{leagueId:text(source.leagueId||raw.leagueId)}:{}),...(source.season||raw.season?{season:num(source.season||raw.season)}:{})},
  teams:(raw.teams||[]).map(normalizeTeam),
  schedule:(raw.schedule||[]).map(normalizeWeek),
  nflGames:raw.nflGames||[],
  playoffSpots:num(raw.playoffSpots,8),
  playoffWeeks:(raw.playoffWeeks||[15,16,17]).map(Number),
  reseed:raw.reseed!==false,
  tiebreaker:text(raw.tiebreaker||'points'),
  ...(raw.simulations!=null?{simulations:num(raw.simulations)}:{}),
  ...(raw.seed!=null?{seed:num(raw.seed)}:{}),
 };
}

export function validateLeagueSnapshot(input){
 let league;try{league=normalizeLeagueSnapshot(input)}catch(error){return {valid:false,errors:[error.message],warnings:[],league:null}}
 const errors=[],warnings=[],ids=new Set();
 if(league.teams.length<2) errors.push('At least two teams are required.');
 for(const team of league.teams){
  if(ids.has(team.id)) errors.push(`Duplicate team id: ${team.id}`);ids.add(team.id);
  if(team.wins<0||team.losses<0||team.ties<0) errors.push(`Team ${team.id} has a negative record value.`);
  const all=[...team.lineup,...Object.values(team.weeklyLineups||{}).flat()];
  if(!team.lineup.length&&!Object.keys(team.weeklyLineups||{}).length) warnings.push(`Team ${team.id} has no lineup data.`);
  for(const p of all){if(!POSITIONS.has(p.position)) errors.push(`Player ${p.id} on ${team.id} has unsupported position '${p.position}'.`);if(p.projection<0) errors.push(`Player ${p.id} on ${team.id} has a negative projection.`)}
 }
 const seenWeeks=new Set();
 for(const week of league.schedule){
  if(!Number.isInteger(week.week)||week.week<1) errors.push(`Invalid schedule week: ${week.week}`);
  if(seenWeeks.has(week.week)) errors.push(`Duplicate schedule week: ${week.week}`);seenWeeks.add(week.week);
  const playing=new Set();
  for(const [a,b] of week.matchups){
   if(!ids.has(a)||!ids.has(b)) errors.push(`Week ${week.week} matchup references unknown team: ${a} vs ${b}.`);
   if(a===b) errors.push(`Week ${week.week} has self-matchup for ${a}.`);
   if(playing.has(a)||playing.has(b)) errors.push(`Week ${week.week} schedules a team more than once.`);playing.add(a);playing.add(b);
  }
 }
 if(!league.schedule.length) errors.push('At least one remaining regular-season schedule week is required.');
 if(league.playoffSpots<2||league.playoffSpots>league.teams.length) errors.push('playoffSpots must be between 2 and the number of teams.');
 if(!league.playoffWeeks.length) errors.push('At least one playoff week is required.');
 return {valid:errors.length===0,errors,warnings,league};
}

export function importLeagueSnapshot(input,{strict=true}={}){
 const result=validateLeagueSnapshot(input);
 if(strict&&!result.valid) throw new Error(`Invalid league snapshot:\n- ${result.errors.join('\n- ')}`);
 return result;
}
