import {evaluateAddDropScenario} from './transaction-scenarios.js';

const pid=p=>String(p?.id??p?.playerId??'');
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const deltaOf=(result,key)=>num(result?.delta?.[key]??result?.deltas?.[key]??result?.[key]);

export function rankWaiverCandidates(input,{teamId,candidates,dropPlayerIds=[null],projectionRows=[],weeks=null,lineupSlots=null},options={}){
 if(!Array.isArray(candidates)||!candidates.length)throw new Error('candidates are required');
 if(!Array.isArray(dropPlayerIds)||!dropPlayerIds.length)dropPlayerIds=[null];
 const rows=[];
 for(const addPlayer of candidates){
  let best=null;
  for(const dropPlayerId of dropPlayerIds){
   try{
    const result=evaluateAddDropScenario(input,{teamId,addPlayer,dropPlayerId,projectionRows,weeks,lineupSlots},options);
    const row={addPlayerId:pid(addPlayer),addPlayerName:addPlayer.name??pid(addPlayer),dropPlayerId:dropPlayerId??null,playoffDelta:deltaOf(result,'playoffProbability'),championshipDelta:deltaOf(result,'championshipProbability'),winsDelta:deltaOf(result,'averageWins'),result};
    if(!best||compareRows(row,best)<0)best=row;
   }catch(error){if(options.throwOnInvalid)throw error}
  }
  if(best)rows.push(best);
 }
 return rows.sort(compareRows).map((r,i)=>({...r,rank:i+1}));
}

function compareRows(a,b){return b.championshipDelta-a.championshipDelta||b.playoffDelta-a.playoffDelta||b.winsDelta-a.winsDelta||a.addPlayerName.localeCompare(b.addPlayerName)}
