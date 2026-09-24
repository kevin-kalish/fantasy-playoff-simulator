import {optimizeLineup} from './lineup-optimizer.js';
import {compareSimulationInputs} from './scenario-engine.js';

const clone=x=>structuredClone(x);
const pid=p=>String(p?.id??p?.playerId??'');
const findTeam=(input,id)=>{const t=input.teams.find(x=>String(x.id)===String(id));if(!t)throw new Error(`Unknown team: ${id}`);return t};
const weeksFor=input=>[...new Set([...(input.schedule||[]).map(x=>Number(x.week)),...(input.playoffWeeks||[]).map(Number)])].filter(Number.isFinite).sort((a,b)=>a-b);
const projectionFor=(p,w,rows)=>{const id=pid(p),r=(rows||[]).find(x=>Number(x.week)===Number(w)&&(String(x.playerId??x.id??'')===id||(!id&&x.name===p.name)));return r?Number(r.projection):Number(p.projection??0)};
function reoptimize(t,weeks,slots,rows){t.weeklyLineups=t.weeklyLineups||{};for(const w of weeks){const roster=(t.roster||[]).map(p=>({...p,projection:projectionFor(p,w,rows)}));const o=optimizeLineup(roster,slots);t.weeklyLineups[w]=o.lineup??o.players??o;}}
function takePlayers(t,ids){const wanted=new Set(ids.map(String)),found=(t.roster||[]).filter(p=>wanted.has(pid(p)));if(found.length!==wanted.size){const have=new Set(found.map(pid));throw new Error(`Trade player(s) not found on team ${t.id}: ${[...wanted].filter(x=>!have.has(x)).join(', ')}`);}return found.map(clone)}

export function applyTradeScenario(input,{teamAId,teamBId,teamAGives=[],teamBGives=[],projectionRows=[],weeks=null,lineupSlots=null}){
 if(String(teamAId)===String(teamBId))throw new Error('Trade teams must be different');
 if(!teamAGives.length&&!teamBGives.length)throw new Error('Trade must include at least one player');
 const out=clone(input),a=findTeam(out,teamAId),b=findTeam(out,teamBId),slots=lineupSlots??out.lineupSlots,targetWeeks=weeks?.map(Number)??weeksFor(out);
 if(!Array.isArray(slots)||!slots.length)throw new Error('lineupSlots are required for trade scenarios');
 const aOut=takePlayers(a,teamAGives),bOut=takePlayers(b,teamBGives),aIds=new Set(teamAGives.map(String)),bIds=new Set(teamBGives.map(String));
 a.roster=(a.roster||[]).filter(p=>!aIds.has(pid(p))).concat(bOut);b.roster=(b.roster||[]).filter(p=>!bIds.has(pid(p))).concat(aOut);
 reoptimize(a,targetWeeks,slots,projectionRows);reoptimize(b,targetWeeks,slots,projectionRows);return out;
}

export function evaluateTradeScenario(input,trade,options={}){
 const scenarioInput=applyTradeScenario(input,trade),comparison=compareSimulationInputs(input,scenarioInput,options);
 const teamA=comparison.deltas.find(x=>String(x.id)===String(trade.teamAId)),teamB=comparison.deltas.find(x=>String(x.id)===String(trade.teamBId));
 const summarize=x=>({teamId:x.id,teamName:x.name,playoffDelta:x.playoffProbabilityDelta,championshipDelta:x.championshipProbabilityDelta,winsDelta:x.averageWinsDelta});
 return {...comparison,trade:{type:'trade',teamAId:trade.teamAId,teamBId:trade.teamBId,teamAGives:trade.teamAGives.map(String),teamBGives:trade.teamBGives.map(String)},teams:{A:summarize(teamA),B:summarize(teamB)}};
}
