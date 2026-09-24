import {compareSimulationInputs} from './scenario-engine.js';

const clone=x=>structuredClone(x);
const pid=p=>String(p?.id??p?.playerId??'');
const eligible=(p,slot)=>{const m={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],K:['K'],DEF:['DEF'],FLEX:['RB','WR','TE'],'RB/WR':['RB','WR'],'WR/TE':['WR','TE'],'RB/WR/TE':['RB','WR','TE'],SUPERFLEX:['QB','RB','WR','TE']};return (m[String(slot).toUpperCase()]||[String(slot).toUpperCase()]).includes(String(p.position||'').toUpperCase())};
const rowFor=(rows,p,w)=>(rows||[]).find(r=>Number(r.week)===Number(w)&&(String(r.playerId??r.id??'')===pid(p)||(!pid(p)&&r.name===p.name)));
const projected=(rows,p,w)=>{const r=rowFor(rows,p,w);return r?Number(r.projection):Number(p.projection??0)};
function teamResult(cmp,id){const d=cmp.deltas.find(x=>String(x.id)===String(id));return {teamId:d.id,teamName:d.name,playoffDelta:d.playoffProbabilityDelta,championshipDelta:d.championshipProbabilityDelta,winsDelta:d.averageWinsDelta};}

export function enumerateStartSitChoices(input,{teamId,week,projectionRows=[],slot=null}){
 const team=input.teams.find(t=>String(t.id)===String(teamId));if(!team)throw new Error(`Unknown team: ${teamId}`);
 const current=team.weeklyLineups?.[week];if(!current)throw new Error(`No lineup for team ${teamId} week ${week}`);
 const roster=team.roster||[];const starters=new Set(current.filter(p=>p.status!=='EMPTY').map(pid));const choices=[];
 for(let i=0;i<current.length;i++){const starter=current[i],lineupSlot=starter.lineupSlot||starter.position;if(slot&&String(lineupSlot)!==String(slot))continue;
  for(const bench of roster){if(starters.has(pid(bench))||!eligible(bench,lineupSlot))continue;choices.push({slot:lineupSlot,startPlayerId:pid(bench),startPlayerName:bench.name,sitPlayerId:pid(starter),sitPlayerName:starter.name,projectedPointDelta:projected(projectionRows,bench,week)-projected(projectionRows,starter,week)});}
 }
 return choices;
}
export function applyStartSitChoice(input,{teamId,week,startPlayerId,sitPlayerId,projectionRows=[]}){
 const out=clone(input),team=out.teams.find(t=>String(t.id)===String(teamId));if(!team)throw new Error(`Unknown team: ${teamId}`);const lineup=team.weeklyLineups?.[week];if(!lineup)throw new Error(`No lineup for team ${teamId} week ${week}`);
 const i=lineup.findIndex(p=>pid(p)===String(sitPlayerId)),bench=(team.roster||[]).find(p=>pid(p)===String(startPlayerId));if(i<0)throw new Error(`Sit player ${sitPlayerId} is not starting`);if(!bench)throw new Error(`Start player ${startPlayerId} is not on roster`);
 const slot=lineup[i].lineupSlot||lineup[i].position;if(!eligible(bench,slot))throw new Error(`${bench.name} is not eligible for ${slot}`);const r=rowFor(projectionRows,bench,week);lineup[i]={...bench,projection:r?Number(r.projection):Number(bench.projection??0),lineupSlot:slot};return out;
}
export function evaluateStartSitChoices(input,spec,options={}){
 const choices=spec.choices||enumerateStartSitChoices(input,spec);const results=choices.map(choice=>{const scenario=applyStartSitChoice(input,{...spec,...choice}),cmp=compareSimulationInputs(input,scenario,options),impact=teamResult(cmp,spec.teamId);return {...choice,...impact,simulations:cmp.simulations,seed:cmp.seed};});
 return results.sort((a,b)=>b.championshipDelta-a.championshipDelta||b.playoffDelta-a.playoffDelta||b.projectedPointDelta-a.projectedPointDelta).map((x,i)=>({...x,rank:i+1}));
}
