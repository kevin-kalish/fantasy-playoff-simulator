const clone=value=>JSON.parse(JSON.stringify(value));
const normalizeTeamKey=value=>String(value??'').normalize('NFKD').replace(/[‘’]/g,"'").replace(/[^a-z0-9]+/gi,' ').trim().toLowerCase();
const byIdOrName=(items,key)=>{
 const wanted=normalizeTeamKey(key);
 return items.find(x=>String(x.id)===String(key)||normalizeTeamKey(x.id)===wanted||normalizeTeamKey(x.name)===wanted);
};
const resolveSchedule=(schedule,teams)=>(schedule??[]).map(week=>({
 ...clone(week),
 matchups:(week.matchups??week.games??[]).map(raw=>{
  const pair=Array.isArray(raw)?raw:[raw.home??raw.team1??raw.a,raw.away??raw.team2??raw.b];
  return pair.map(key=>byIdOrName(teams,key)?.id??key);
 })
}));

export function mergeCurrentState(base,patch={}){
 const out=clone(base);
 const teamPatches=patch.teams??[];
 for(const change of teamPatches){
  const team=byIdOrName(out.teams??[],change.id??change.name);
  if(!team) throw new Error(`Current-state patch references unknown team '${change.id??change.name}'.`);
  for(const field of ['wins','losses','ties','points','pointsAgainst','rank','waiverPriority','moves']) if(change[field]!=null) team[field]=change[field];
  if(change.lineup) team.lineup=clone(change.lineup);
  if(change.roster) team.roster=clone(change.roster);
  if(change.weeklyLineups) team.weeklyLineups=clone(change.weeklyLineups);
 }
 if(patch.schedule) out.schedule=resolveSchedule(patch.schedule,out.teams??[]);
 if(patch.nflGames) out.nflGames=clone(patch.nflGames);
 if(patch.currentWeek!=null) out.currentWeek=patch.currentWeek;
 out.source={...(out.source??{}),provider:patch.provider??out.source?.provider??'manual',...(patch.capturedAt?{capturedAt:patch.capturedAt}:{}),...(patch.currentWeek!=null?{currentWeek:patch.currentWeek}:{})};
 return out;
}

export function summarizeCurrentStatePatch(patch={}){
 return {teamsUpdated:(patch.teams??[]).length,scheduleReplaced:Array.isArray(patch.schedule),nflGamesReplaced:Array.isArray(patch.nflGames),capturedAt:patch.capturedAt??null};
}
