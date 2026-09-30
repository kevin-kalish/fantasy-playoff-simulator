import {rankWaiverCandidates} from './waiver-ranker.js';
import {evaluateTradeScenario} from './trade-evaluator.js';
import {enumerateStartSitChoices,evaluateStartSitChoices} from './start-sit-evaluator.js';
import {validateRecommendationSet} from './recommendation-validation.js';

const num=x=>Number.isFinite(Number(x))?Number(x):0;
const pct=x=>`${x>=0?'+':''}${(100*x).toFixed(2)}%`;
const wins=x=>`${x>=0?'+':''}${x.toFixed(3)}`;
const points=x=>`${x>=0?'+':''}${num(x).toFixed(1)}`;
function strategy(posture='BALANCED'){return posture==='UPSIDE'?{posture,championshipWeight:.55,playoffWeight:.35,winsWeight:.10}:posture==='FLOOR'?{posture,championshipWeight:.25,playoffWeight:.55,winsWeight:.20}:{posture:'BALANCED',championshipWeight:.45,playoffWeight:.45,winsWeight:.10};}
function strategicScore(r,s){return num(r.championshipDelta)*s.championshipWeight+num(r.playoffDelta)*s.playoffWeight+num(r.winsDelta)*.05*s.winsWeight;}
function compare(a,b){return b.strategicScore-a.strategicScore||b.championshipDelta-a.championshipDelta||b.playoffDelta-a.playoffDelta||b.winsDelta-a.winsDelta||String(a.label).localeCompare(String(b.label))}
function tradeLabel(t,result,teamId){const side=String(t.teamAId)===String(teamId)?'A':'B',give=side==='A'?t.teamAGives:t.teamBGives,get=side==='A'?t.teamBGives:t.teamAGives;return `Trade ${give.join(', ')||'nothing'} for ${get.join(', ')||'nothing'}`}
function impact(r){const parts=[];if(r.type==='start-sit'||Math.abs(num(r.projectedPointDelta))>.0001)parts.push(`${points(r.projectedPointDelta)} projected pts`);parts.push(`${pct(r.playoffDelta)} playoff`,`${pct(r.championshipDelta)} championship`,`${wins(r.winsDelta)} wins`);return parts.join(', ');}
function summary(r){const flag=r.validation?.confidence==='review'?' [REVIEW]':'';return `${r.label}: ${impact(r)}${flag}`;}
function beneficial(r){return num(r.strategicScore)>0&&[r.playoffDelta,r.championshipDelta,r.winsDelta,r.projectedPointDelta].some(x=>num(x)>0);}
function rejectionReason(r){
 if(r.validation?.confidence==='low')return 'low-confidence';
 if(num(r.strategicScore)<=0)return 'non-positive-strategic-score';
 return 'no-positive-impact';
}
function explanation(r,reason=null){
 const why=reason==='low-confidence'?'model confidence is too low':reason==='non-positive-strategic-score'?'modeled strategic impact is not positive':reason==='no-positive-impact'?'no modeled outcome improves':null;
 return `${impact(r)}${why?`; ${why}`:''}`;
}
function nearMiss(r){const reason=rejectionReason(r);return {type:r.type,label:r.label,strategicScore:r.strategicScore,playoffDelta:r.playoffDelta,championshipDelta:r.championshipDelta,winsDelta:r.winsDelta,projectedPointDelta:num(r.projectedPointDelta),confidence:r.validation?.confidence??null,reason,explanation:explanation(r,reason)};}
function shortlistStartSit(input,spec,maxScenarios){
 const choices=spec.choices||enumerateStartSitChoices(input,spec);
 const max=Math.max(1,Number(maxScenarios??6));
 if(choices.length<=max)return {choices,total:choices.length,evaluated:choices.length};
 const ranked=[...choices].sort((a,b)=>num(b.projectedPointDelta)-num(a.projectedPointDelta)||String(a.slot).localeCompare(String(b.slot))||String(a.startPlayerName).localeCompare(String(b.startPlayerName)));
 return {choices:ranked.slice(0,max),total:choices.length,evaluated:max};
}

export function buildWeeklyGMRecommendations(input,{teamId,week,projectionRows=[],waivers=null,trades=[],startSit=true,limit=10,validation={},leverage=null},options={}){
 const team=input.teams.find(t=>String(t.id)===String(teamId));if(!team)throw new Error(`Unknown team: ${teamId}`);
 const actions=[];let startSitDiagnostics={totalChoices:0,evaluatedChoices:0,shortlisted:false};
 if(waivers?.candidates?.length){const ranked=rankWaiverCandidates(input,{teamId,candidates:waivers.candidates,dropPlayerIds:waivers.dropPlayerIds??[null],projectionRows,weeks:waivers.weeks,lineupSlots:waivers.lineupSlots},options);for(const r of ranked)actions.push({type:'waiver',label:`Add ${r.addPlayerName}${r.dropPlayerName?` / Drop ${r.dropPlayerName}`:''}`,playoffDelta:num(r.playoffDelta),championshipDelta:num(r.championshipDelta),winsDelta:num(r.winsDelta),projectedPointDelta:num(r.projectedPointDelta),details:r});}
 if(startSit){const spec=typeof startSit==='object'?startSit:{};try{const baseSpec={teamId,week,projectionRows,...spec},short=shortlistStartSit(input,baseSpec,options.maxStartSitScenarios);startSitDiagnostics={totalChoices:short.total,evaluatedChoices:short.evaluated,shortlisted:short.evaluated<short.total};const ranked=evaluateStartSitChoices(input,{...baseSpec,choices:short.choices},options);for(const r of ranked)actions.push({type:'start-sit',label:`Start ${r.startPlayerName} / Sit ${r.sitPlayerName}`,playoffDelta:num(r.playoffDelta),championshipDelta:num(r.championshipDelta),winsDelta:num(r.winsDelta),projectedPointDelta:num(r.projectedPointDelta),details:r});}catch(error){if(options.throwOnInvalid)throw error}}
 for(const trade of trades){try{const r=evaluateTradeScenario(input,{...trade,projectionRows:trade.projectionRows??projectionRows},options),focus=String(trade.teamAId)===String(teamId)?r.teams.A:String(trade.teamBId)===String(teamId)?r.teams.B:null;if(!focus)continue;actions.push({type:'trade',label:trade.label??tradeLabel(trade,r,teamId),playoffDelta:num(focus.playoffDelta),championshipDelta:num(focus.championshipDelta),winsDelta:num(focus.winsDelta),projectedPointDelta:num(focus.projectedPointDelta),details:r});}catch(error){if(options.throwOnInvalid)throw error}}
 const checked=validateRecommendationSet(actions,{simulations:input.simulations,...validation}),weights=strategy(leverage?.posture);
 const scored=checked.map(r=>({...r,strategicScore:strategicScore(r,weights),strategyPosture:weights.posture})).sort(compare);
 const rejected=scored.filter(r=>!beneficial(r));
 const ranked=scored.filter(beneficial).map((r,i)=>({...r,rank:i+1,summary:summary(r),explanation:explanation(r)}));
 const reviewCount=ranked.filter(r=>r.validation?.confidence==='review').length,lowConfidenceCount=ranked.filter(r=>r.validation?.confidence==='low').length;
 const rejectionCounts=rejected.reduce((out,r)=>{const reason=rejectionReason(r);out[reason]=(out[reason]??0)+1;return out;},{});
 return {teamId:team.id,teamName:team.name,week:Number(week),simulations:input.simulations,seed:input.seed,actionCount:ranked.length,strategy:{...weights,urgency:leverage?.urgency??null,reason:leverage?.reason??null},validation:{reviewCount,lowConfidenceCount},diagnostics:{evaluatedActionCount:scored.length,beneficialActionCount:ranked.length,rejectedActionCount:rejected.length,rejectionCounts,nearMisses:rejected.slice(0,3).map(nearMiss),startSit:startSitDiagnostics},recommendations:ranked.slice(0,limit)};
}
