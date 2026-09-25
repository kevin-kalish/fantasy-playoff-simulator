import {buildWeeklyGMRecommendations} from './gm-recommendation-engine.js';
import {summarizeStability} from './recommendation-validation.js';

const num=x=>Number.isFinite(Number(x))?Number(x):0;
const key=r=>`${r.type}|${r.label}`;

export function confirmTopRecommendations(input,spec,{top=3,seeds=[101,202,303],simulations=20000,stability={}}={}){
 const preview=buildWeeklyGMRecommendations(input,spec);
 const targets=preview.recommendations.slice(0,top),targetKeys=new Set(targets.map(key)),samples=Object.fromEntries(targets.map(r=>[key(r),[]]));
 for(const seed of seeds){
  const runInput={...input,seed,simulations};
  const report=buildWeeklyGMRecommendations(runInput,{...spec,limit:Math.max(spec.limit??10,preview.actionCount)});
  for(const r of report.recommendations){const k=key(r);if(targetKeys.has(k))samples[k].push({seed,playoffDelta:num(r.playoffDelta),championshipDelta:num(r.championshipDelta),winsDelta:num(r.winsDelta)});}
 }
 const confirmed=targets.map(r=>{const s=samples[key(r)],championship=summarizeStability(s,stability),mean=f=>s.length?s.reduce((a,x)=>a+x[f],0)/s.length:null;return {...r,confirmation:{simulationsPerSeed:simulations,seeds:[...seeds],samples:s,stability:championship,meanPlayoffDelta:mean('playoffDelta'),meanChampionshipDelta:mean('championshipDelta'),meanWinsDelta:mean('winsDelta'),directionConsistent:s.length===seeds.length&&s.every(x=>Math.sign(x.championshipDelta)===Math.sign(r.championshipDelta)||x.championshipDelta===0&&r.championshipDelta===0)}}});
 return {...preview,confirmation:{top,seeds:[...seeds],simulationsPerSeed:simulations},recommendations:preview.recommendations.map(r=>confirmed.find(c=>key(c)===key(r))??r)};
}
