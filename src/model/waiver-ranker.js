import {evaluateAddDropScenario} from './transaction-scenarios.js';

const pid=p=>String(p?.id??p?.playerId??'');
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const pct=x=>`${x>=0?'+':''}${(100*x).toFixed(2)}%`;
const wins=x=>`${x>=0?'+':''}${x.toFixed(3)}`;

function focusDelta(result,key){
 const focus=result?.focus;
 if(!focus)return 0;
 if(key==='playoffProbability')return num(focus.playoffProbabilityDelta);
 if(key==='championshipProbability')return num(focus.championshipProbabilityDelta);
 if(key==='averageWins')return num(focus.averageWinsDelta);
 return 0;
}
function compareRows(a,b){return b.championshipDelta-a.championshipDelta||b.playoffDelta-a.playoffDelta||b.winsDelta-a.winsDelta||a.addPlayerName.localeCompare(b.addPlayerName)}
function summary(row){return `Add ${row.addPlayerName}${row.dropPlayerName?` / Drop ${row.dropPlayerName}`:row.dropPlayerId?` / Drop ${row.dropPlayerId}`:''}: ${pct(row.playoffDelta)} playoff, ${pct(row.championshipDelta)} championship, ${wins(row.winsDelta)} wins`;}

export function rankWaiverCandidates(input,{teamId,candidates,dropPlayerIds=[null],dropMap=null,projectionRows=[],weeks=null,lineupSlots=null},options={}){
 if(!Array.isArray(candidates)||!candidates.length)throw new Error('candidates are required');
 if(!Array.isArray(dropPlayerIds)||!dropPlayerIds.length)dropPlayerIds=[null];
 const team=input.teams.find(t=>String(t.id)===String(teamId));if(!team)throw new Error(`Unknown team: ${teamId}`);
 const nameById=new Map((team.roster||[]).map(p=>[pid(p),p.name??pid(p)]));
 const rows=[];let evaluatedScenarioCount=0,invalidScenarioCount=0;
 for(const addPlayer of candidates){
  let best=null;
  const mapped=dropMap?.[pid(addPlayer)];
  const candidateDrops=Array.isArray(mapped)&&mapped.length?mapped:dropPlayerIds;
  for(const dropPlayerId of candidateDrops){
   try{
    evaluatedScenarioCount++;
    const result=evaluateAddDropScenario(input,{teamId,addPlayer,dropPlayerId,projectionRows,weeks,lineupSlots},options);
    const row={addPlayerId:pid(addPlayer),addPlayerName:addPlayer.name??pid(addPlayer),dropPlayerId:dropPlayerId??null,dropPlayerName:dropPlayerId?nameById.get(String(dropPlayerId))??String(dropPlayerId):null,playoffDelta:focusDelta(result,'playoffProbability'),championshipDelta:focusDelta(result,'championshipProbability'),winsDelta:focusDelta(result,'averageWins'),result};
    if(!best||compareRows(row,best)<0)best=row;
   }catch(error){invalidScenarioCount++;if(options.throwOnInvalid)throw error}
  }
  if(best)rows.push(best);
 }
 const ranked=rows.sort(compareRows).map((r,i)=>({...r,rank:i+1,summary:summary(r)}));
 Object.defineProperty(ranked,'diagnostics',{value:{candidateCount:candidates.length,evaluatedScenarioCount,invalidScenarioCount,candidateSpecificDrops:Boolean(dropMap)},enumerable:false});
 return ranked;
}

export function compactWaiverRanking(ranked,{limit=10}={}){
 return ranked.slice(0,limit).map(({rank,addPlayerId,addPlayerName,dropPlayerId,dropPlayerName,playoffDelta,championshipDelta,winsDelta,summary})=>({rank,addPlayerId,addPlayerName,dropPlayerId,dropPlayerName,playoffDelta,championshipDelta,winsDelta,summary}));
}
