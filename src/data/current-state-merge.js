const clone=value=>JSON.parse(JSON.stringify(value));
const byIdOrName=(items,key)=>items.find(x=>String(x.id)===String(key)||String(x.name).toLowerCase()===String(key).toLowerCase());

export function mergeCurrentState(base,patch={}){
 const out=clone(base);
 const teamPatches=patch.teams??[];
 for(const change of teamPatches){
  const team=byIdOrName(out.teams??[],change.id??change.name);
  if(!team) throw new Error(`Current-state patch references unknown team '${change.id??change.name}'.`);
  for(const field of ['wins','losses','ties','points','pointsAgainst','rank','waiverPriority','moves']) if(change[field]!=null) team[field]=change[field];
  if(change.lineup) team.lineup=clone(change.lineup);
  if(change.roster) team.roster=clone(change.roster);
 }
 if(patch.schedule) out.schedule=clone(patch.schedule);
 if(patch.nflGames) out.nflGames=clone(patch.nflGames);
 out.source={...(out.source??{}),provider:patch.provider??out.source?.provider??'manual',...(patch.capturedAt?{capturedAt:patch.capturedAt}:{})};
 return out;
}

export function summarizeCurrentStatePatch(patch={}){
 return {teamsUpdated:(patch.teams??[]).length,scheduleReplaced:Array.isArray(patch.schedule),nflGamesReplaced:Array.isArray(patch.nflGames),capturedAt:patch.capturedAt??null};
}
