import {buildWeeklyGMRecommendations} from './gm-recommendation-engine.js';
import {summarizeStability} from './recommendation-validation.js';
import {finalizeRecommendationTrust} from './recommendation-trust.js';
import {assessRecommendationDataQuality} from './data-quality-gate.js';

const num=x=>Number.isFinite(Number(x))?Number(x):0;
const key=r=>`${r.type}|${r.label}`;

export function confirmTopRecommendations(input,spec,{top=3,seeds=[101,202,303],simulations=20000,stability={},dataQuality={}}={}){
 const quality=assessRecommendationDataQuality(input,{projectionRows:spec.projectionRows||[],teamId:spec.teamId,week:spec.week,...dataQuality});
 const preview=buildWeeklyGMRecommendations(input,spec);
 if(!quality.passed){
  const recommendations=preview.recommendations.map(r=>({...finalizeRecommendationTrust(r,{input,spec,confirmationOptions:{top,seeds,simulations}}),trust:{status:'INPUT_BLOCKED',simulationConfidence:'preview',inputSanity:'blocked',sanityWarnings:[...quality.errors,...quality.warnings]}}));
  return {...preview,dataQuality:quality,confirmation:{top:0,seeds:[],simulationsPerSeed:0,blocked:true},recommendations};
 }
 const targets=preview.recommendations.slice(0,top),targetKeys=new Set(targets.map(key)),samples=Object.fromEntries(targets.map(r=>[key(r),[]]));
 for(const seed of seeds){
  const runInput={...input,seed,simulations};
  const report=buildWeeklyGMRecommendations(runInput,{...spec,limit:Math.max(spec.limit??10,preview.actionCount)});
  for(const r of report.recommendations){const k=key(r);if(targetKeys.has(k))samples[k].push({seed,playoffDelta:num(r.playoffDelta),championshipDelta:num(r.championshipDelta),winsDelta:num(r.winsDelta)});}
 }
 const confirmed=targets.map(r=>{const s=samples[key(r)],championship=summarizeStability(s,stability),mean=f=>s.length?s.reduce((a,x)=>a+x[f],0)/s.length:null;return {...r,confirmation:{simulationsPerSeed:simulations,seeds:[...seeds],samples:s,stability:championship,meanPlayoffDelta:mean('playoffDelta'),meanChampionshipDelta:mean('championshipDelta'),meanWinsDelta:mean('winsDelta'),directionConsistent:s.length===seeds.length&&s.every(x=>Math.sign(x.championshipDelta)===Math.sign(r.championshipDelta)||x.championshipDelta===0&&r.championshipDelta===0)}}});
 const recommendations=preview.recommendations.map(r=>{const finalized=finalizeRecommendationTrust(confirmed.find(c=>key(c)===key(r))??r,{input,spec,confirmationOptions:{top,seeds,simulations}});return quality.warnings.length?{...finalized,trust:{...finalized.trust,inputSanity:finalized.trust.inputSanity==='review'?'review':'warning',sanityWarnings:[...(finalized.trust.sanityWarnings||[]),...quality.warnings]}}:finalized;});
 return {...preview,dataQuality:quality,confirmation:{top,seeds:[...seeds],simulationsPerSeed:simulations,blocked:false},recommendations};
}
