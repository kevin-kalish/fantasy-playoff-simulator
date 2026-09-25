const unique=a=>[...new Set((a||[]).filter(x=>x!=null).map(String))];

function issue(code,message,severity='error',details={}){return {code,severity,message,...details};}
function finite(x){return Number.isFinite(Number(x));}

export function assessRecommendationDataQuality(input,{projectionRows=[],teamId=null,week=null,minimumProjectionMatchRate=.9}={}){
 const errors=[],warnings=[];
 const teams=input?.teams||[],schedule=input?.schedule||[],playoffWeeks=input?.playoffWeeks||[];
 const metadata=input?.metadata||{};
 const coverage=metadata.rosterProjectionCoverage||metadata.projectionCoverage||null;
 const incomplete=metadata.incompleteLineups||[];
 const lineupSlots=metadata.lineupSlots||[];

 if(!teams.length)errors.push(issue('NO_TEAMS','No teams are available.'));
 const teamIds=teams.map(t=>String(t.id));
 if(new Set(teamIds).size!==teamIds.length)errors.push(issue('DUPLICATE_TEAM_IDS','Duplicate team IDs were found.'));
 if(teamId!=null&&!teams.some(t=>String(t.id)===String(teamId)))errors.push(issue('UNKNOWN_TEAM',`Target team ${teamId} is not present in the simulation input.`));
 if(!schedule.length)errors.push(issue('NO_SCHEDULE','No remaining regular-season schedule is available.'));
 if(!playoffWeeks.length)errors.push(issue('NO_PLAYOFF_WEEKS','No playoff weeks are configured.'));
 if(!lineupSlots.length)warnings.push(issue('MISSING_LINEUP_SLOTS','Lineup-slot metadata is missing.','warning'));
 if(incomplete.length)errors.push(issue('INCOMPLETE_LINEUPS',`${incomplete.length} optimized team-week lineup(s) are incomplete.`, 'error',{count:incomplete.length}));
 if(coverage){
  if(!coverage.total)errors.push(issue('NO_PROJECTION_OBSERVATIONS','No roster-week projection observations were evaluated.'));
  else if(!finite(coverage.matchRate)||Number(coverage.matchRate)<minimumProjectionMatchRate)errors.push(issue('LOW_PROJECTION_COVERAGE',`Projection coverage ${(Number(coverage.matchRate||0)*100).toFixed(1)}% is below required ${(minimumProjectionMatchRate*100).toFixed(1)}%.`,'error',{matchRate:Number(coverage.matchRate||0),minimumProjectionMatchRate}));
 }else warnings.push(issue('MISSING_PROJECTION_COVERAGE','Projection-coverage diagnostics are missing.','warning'));

 const rosterOwners=new Map();
 for(const team of teams){
  const seen=new Set();
  for(const p of team.roster||[]){
   if(p?.id==null){errors.push(issue('PLAYER_WITHOUT_ID',`A rostered player on ${team.name||team.id} has no player ID.`));continue;}
   const id=String(p.id);
   if(seen.has(id))errors.push(issue('DUPLICATE_PLAYER_ON_ROSTER',`${p.name||id} appears more than once on ${team.name||team.id}.`,'error',{playerId:id,teamId:team.id}));
   seen.add(id);
   if(!rosterOwners.has(id))rosterOwners.set(id,[]);rosterOwners.get(id).push(String(team.id));
  }
 }
 for(const [playerId,owners] of rosterOwners)if(new Set(owners).size>1)errors.push(issue('PLAYER_ON_MULTIPLE_TEAMS',`Player ${playerId} appears on multiple team rosters.`,'error',{playerId,teamIds:unique(owners)}));

 for(const w of schedule){
  if(!finite(w.week))errors.push(issue('INVALID_SCHEDULE_WEEK','A schedule entry has an invalid week.'));
  for(const matchup of w.matchups||[]){
   if(!Array.isArray(matchup)||matchup.length!==2){errors.push(issue('INVALID_MATCHUP','A schedule matchup is not a two-team pair.'));continue;}
   for(const id of matchup)if(!teamIds.includes(String(id)))errors.push(issue('UNKNOWN_SCHEDULE_TEAM',`Schedule references unknown team ${id}.`));
  }
 }
 if(week!=null&&!schedule.some(w=>Number(w.week)===Number(week))&&!playoffWeeks.some(w=>Number(w)===Number(week)))warnings.push(issue('TARGET_WEEK_NOT_SCHEDULED',`Target week ${week} is not present in the remaining schedule or playoff weeks.`,'warning'));

 const rowKeys=new Set();
 for(const row of projectionRows||[]){
  if(row?.playerId==null||!finite(row.week))continue;
  const key=`${row.playerId}|${row.week}`;
  if(rowKeys.has(key))warnings.push(issue('DUPLICATE_PROJECTION_ROW',`Multiple projection rows exist for player ${row.playerId}, week ${row.week}.`,'warning',{playerId:String(row.playerId),week:Number(row.week)}));
  rowKeys.add(key);
  if(row.projection!=null&&!finite(row.projection))errors.push(issue('INVALID_PROJECTION',`Projection for player ${row.playerId}, week ${row.week} is not numeric.`,'error',{playerId:String(row.playerId),week:Number(row.week)}));
 }

 if(!input?.calibration)warnings.push(issue('NO_CALIBRATION','No empirical calibration parameters are attached; simulator fallbacks will be used.','warning'));
 if(!input?.nflGames?.length)warnings.push(issue('NO_NFL_GAME_CONTEXT','No NFL game context is attached; game-level correlation may be limited.','warning'));

 const blockingCodes=errors.map(x=>x.code);
 return {passed:errors.length===0,status:errors.length?'BLOCKED':warnings.length?'PASS_WITH_WARNINGS':'PASS',errors,warnings,blockingCodes,diagnostics:{teamCount:teams.length,scheduleWeeks:schedule.map(x=>x.week),playoffWeeks:[...playoffWeeks],lineupSlots:[...lineupSlots],projectionCoverage:coverage,projectionRows:(projectionRows||[]).length,targetTeamId:teamId,targetWeek:week}};
}
