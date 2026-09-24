import {optimizeLineup} from './lineup-optimizer.js';
import {compareSimulationInputs} from './scenario-engine.js';

const clone=x=>structuredClone(x);
const pid=p=>String(p?.id??p?.playerId??'');

function team(input,teamId){const t=input.teams.find(x=>String(x.id)===String(teamId));if(!t)throw new Error(`Unknown team: ${teamId}`);return t}
function weeksFor(input){return [...new Set([...(input.schedule||[]).map(x=>Number(x.week)),...(input.playoffWeeks||[]).map(Number)])].filter(Number.isFinite).sort((a,b)=>a-b)}
function projectionFor(player,week,projectionRows){const id=pid(player);const row=(projectionRows||[]).find(r=>Number(r.week)===Number(week)&&(String(r.playerId??r.id??'')===id||(!id&&r.name===player.name)));return row?Number(row.projection):Number(player.projection??0)}
function projectedPlayer(player,week,projectionRows){return {...player,projection:projectionFor(player,week,projectionRows)}}

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
 return {...compareSimulationInputs(input,scenarioInput,{teamId:scenario.teamId,...options}),transaction:{type:'add-drop',teamId:scenario.teamId,addPlayerId:pid(scenario.addPlayer),dropPlayerId:scenario.dropPlayerId??null}};
}
