import {rankWaiverCandidates} from './waiver-ranker.js';
import {evaluateTradeScenario} from './trade-evaluator.js';
import {evaluateStartSitChoices} from './start-sit-evaluator.js';
import {validateRecommendationSet} from './recommendation-validation.js';

const num=x=>Number.isFinite(Number(x))?Number(x):0;
const pct=x=>`${x>=0?'+':''}${(100*x).toFixed(2)}%`;
const wins=x=>`${x>=0?'+':''}${x.toFixed(3)}`;
function strategy(posture='BALANCED'){return posture==='UPSIDE'?{posture,championshipWeight:.55,playoffWeight:.35,winsWeight:.10}:posture==='FLOOR'?{posture,championshipWeight:.25,playoffWeight:.55,winsWeight:.20}:{posture:'BALANCED',championshipWeight:.45,playoffWeight:.45,winsWeight:.10};}
function strategicScore(r,s){return num(r.championshipDelta)*s.championshipWeight+num(r.playoffDelta)*s.playoffWeight+num(r.winsDelta)*.05*s.winsWeight;}
function compare(a,b){return b.strategicScore-a.strategicScore||b.championshipDelta-a.championshipDelta||b.playoffDelta-a.playoffDelta||b.winsDelta-a.winsDelta||String(a.label).localeCompare(String(b.label))}
function tradeLabel(t,result,teamId){const side=String(t.teamAId)===String(teamId)?'A':'B',give=side==='A'?t.teamAGives:t.teamBGives,get=side==='A'?t.teamBGives:t.teamAGives;return `Trade ${give.join(', ')||'nothing'} for ${get.join(', ')||'nothing'}`}
function summary(r){const flag=r.validation?.confidence==='review'?' [REVIEW]':'';return `${r.label}: ${pct(r.playoffDelta)} playoff, ${pct(r.championshipDelta)} championship, ${wins(r.winsDelta)} wins${flag}`;}

export function buildWeeklyGMRecommendations(input,{teamId,week,projectionRows=[],waivers=null,trades=[],startSit=true,limit=10,validation={},leverage=null},options={}){
 const team=input.teams.find(t=>String(t.id)===String(teamId));if(!team)throw new Error(`Unknown team: ${teamId}`);
 const actions=[];
 if(waivers?.candidates?.length){const ranked=rankWaiverCandidates(input,{teamId,candidates:waivers.candidates,dropPlayerIds:waivers.dropPlayerIds??[null],projectionRows,weeks:waivers.weeks,lineupSlots:waivers.lineupSlots},options);for(const r of ranked)actions.push({type:'waiver',label:`Add ${r.addPlayerName}${r.dropPlayerName?` / Drop ${r.dropPlayerName}`:''}`,playoffDelta:num(r.playoffDelta),championshipDelta:num(r.championshipDelta),winsDelta:num(r.winsDelta),details:r});}
 if(startSit){const spec=typeof startSit==='object'?startSit:{};try{const ranked=evaluateStartSitChoices(input,{teamId,week,projectionRows,...spec},options);for(const r of ranked)actions.push({type:'start-sit',label:`Start ${r.startPlayerName} / Sit ${r.sitPlayerName}`,playoffDelta:num(r.playoffDelta),championshipDelta:num(r.championshipDelta),winsDelta:num(r.winsDelta),projectedPointDelta:num(r.projectedPointDelta),details:r});}catch(error){if(options.throwOnInvalid)throw error}}
 for(const trade of trades){try{const r=evaluateTradeScenario(input,{...trade,projectionRows:trade.projectionRows??projectionRows},options),focus=String(trade.teamAId)===String(teamId)?r.teams.A:String(trade.teamBId)===String(teamId)?r.teams.B:null;if(!focus)continue;actions.push({type:'trade',label:trade.label??tradeLabel(trade,r,teamId),playoffDelta:num(focus.playoffDelta),championshipDelta:num(focus.championshipDelta),winsDelta:num(focus.winsDelta),details:r});}catch(error){if(options.throwOnInvalid)throw error}}
 const checked=validateRecommendationSet(actions,{simulations:input.simulations,...validation}),weights=strategy(leverage?.posture);
 const ranked=checked.map(r=>({...r,strategicScore:strategicScore(r,weights),strategyPosture:weights.posture})).sort(compare).map((r,i)=>({...r,rank:i+1,summary:summary(r)}));
 const reviewCount=ranked.filter(r=>r.validation?.confidence==='review').length,lowConfidenceCount=ranked.filter(r=>r.validation?.confidence==='low').length;
 return {teamId:team.id,teamName:team.name,week:Number(week),simulations:input.simulations,seed:input.seed,actionCount:ranked.length,strategy:{...weights,urgency:leverage?.urgency??null,reason:leverage?.reason??null},validation:{reviewCount,lowConfidenceCount},recommendations:ranked.slice(0,limit)};
}
