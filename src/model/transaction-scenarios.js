import {optimizeLineup} from './lineup-optimizer.js';
import {compareSimulationInputs} from './scenario-engine.js';

const clone=x=>structuredClone(x);
const pid=p=>String(p?.id??p?.playerId??'');
const points=lineup=>(lineup||[]).reduce((sum,p)=>sum+Number(p?.projection??0),0);
const normName=x=>String(x??'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');

function team(input,teamId){const t=input.teams.find(x=>String(x.id)===String(teamId));if(!t)throw new Error(`Unknown team: ${teamId}`);return t}
function weeksFor(input){return [...new Set([...(input.schedule||[]).map(x=>Number(x.week)),...(input.playoffWeeks||[]).map(Number)])].filter(Number.isFinite).sort((a,b)=>a-b)}
function projectionFor(player,week,projectionRows){
 const id=pid(player),name=normName(player?.name),rows=(projectionRows||[]).filter(r=>Number(r.week)===Number(week));
 const byId=id?rows.find(r=>String(r.playerId??r.id??'')===id):null;
 const byName=name?rows.find(r=>normName(r.name??r.playerName)===name):null;
 const row=byId??byName;
 return row?Number(row.projection):Number(player.projection??0);
}
function projectedPlayer(player,week,projectionRows){return {...player,projection:projectionFor(player,week,projectionRows)}}
function optimizedPoints(t,week,projectionRows,slots){const roster=(t.roster||[]).map(p=>projectedPlayer(p,week,projectionRows));const optimized=optimizeLineup(roster,slots);return points(optimized.lineup??optimized.players??optimized);}

export function applyAddDropScenario(input,{teamId,addPlayer,dropPlayerId=null,projectionRows=[],weeks=null,lineupSlots=null}){
 if(!addPlayer)throw new Error('addPlayer is required');
 const out=clone(input),t=team(out,teamId),targetWeeks=weeks?.map(Number)??weeksFor(out),slots=lineupSlots??out.lineupSlots;
 if(!Array.isArray(slots)||!slots.length)throw new Error('lineupSlots are required for transaction scenarios');
 const baseRoster=clone(t.roster||[]);
 if(dropPlayerId&&!baseRoster.some(p=>pid(p)===String(dropPlayerId)))throw new Error(`Drop player not found on team ${teamId}: ${dropPlayerId}`);
 t.roster=baseRoster.filter(p=>pid(p)!==String(dropPlayerId));
 if(t.roster.some(p=>pid(p)===pid(addPlayer)))throw new Error(`Player already rostered: ${pid(addPlayer)||addPlayer.name}`);
 t.roster.push(clone(addPlayer));t.weeklyLineups=t.weeklyLineups||{};
 for(const week of targetWeeks){const roster=t.roster.map(p=>projectedPlayer(p,week,projectionRows));const optimized=optimizeLineup(roster,slots);t.weeklyLineups[week]=optimized.lineup??optimized.players??optimized;}
 return out;
}

export function evaluateAddDropScenario(input,scenario,options={}){
 const scenarioInput=applyAddDropScenario(input,scenario);
 const comparison=compareSimulationInputs(input,scenarioInput,{teamId:scenario.teamId,...options});
 const targetWeeks=scenario.weeks?.map(Number)??weeksFor(input);
 const focusWeek=Number(scenario.week??targetWeeks[0]);
 const slots=scenario.lineupSlots??input.lineupSlots;
 const beforeTeam=team(input,scenario.teamId),afterTeam=team(scenarioInput,scenario.teamId);
 // Re-project and optimize both sides from the same projectionRows. The stored baseline
 // lineup can contain stale projections, so comparing it directly to the newly optimized
 // scenario lineup can overstate the transaction's immediate point impact.
 const beforePoints=optimizedPoints(beforeTeam,focusWeek,scenario.projectionRows??[],slots);
 const afterPoints=points(afterTeam.weeklyLineups?.[focusWeek]);
 const projectedPointDelta=afterPoints-beforePoints;
 if(comparison.focus)comparison.focus.projectedPointDelta=projectedPointDelta;
 return {...comparison,projectedPointDelta,focusWeek,transaction:{type:'add-drop',teamId:scenario.teamId,addPlayerId:pid(scenario.addPlayer),dropPlayerId:scenario.dropPlayerId??null}};
}
