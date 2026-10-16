import {optimizeLineup} from './lineup-optimizer.js';
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const points=a=>Array.isArray(a)?a.reduce((x,p)=>x+(Number.isFinite(Number(p.projection))?Number(p.projection):0),0):null;
const id=p=>String(p.id??p.playerId??'');
/** Diagnostics only: explain direct-to-derived jump without altering simulations. */
export function assessLongRangeJump(league,{directWeeks=[],derivedWeeks=[],slots=[]}={}){
 return (league?.teams??[]).map(team=>{
  const direct=[],optimizedDirect=[],derived=[];
  for(const w of directWeeks){
   const submitted=team.weeklyLineups?.[w]??[];
   const roster=team.weeklyRosters?.[w]??[];
   if(submitted.length)direct.push(points(submitted));
   if(roster.length)optimizedDirect.push(optimizeLineup(roster,{week:w,slots}).projectedPoints);
  }
  for(const w of derivedWeeks){const lineup=team.weeklyLineups?.[w];if(lineup?.length)derived.push(points(lineup));}
  const submittedMean=mean(direct),optimizedMean=mean(optimizedDirect),derivedMean=mean(derived);
  const contributors=[];
  for(const p of team.roster??[]){
   const pid=id(p),samples=directWeeks.map(w=>(team.weeklyRosters?.[w]??[]).find(x=>id(x)===pid)).filter(x=>x&&Number.isFinite(Number(x.projection)));
   const derivedSamples=derivedWeeks.map(w=>(team.weeklyRosters?.[w]??[]).find(x=>id(x)===pid)).filter(x=>x&&Number.isFinite(Number(x.projection)));
   const directPlayer=mean(samples.map(x=>Number(x.projection))),derivedPlayer=mean(derivedSamples.map(x=>Number(x.projection)));
   if(directPlayer===null||derivedPlayer===null)continue;
   const directStarts=directWeeks.filter(w=>(team.weeklyLineups?.[w]??[]).some(x=>id(x)===pid)).length;
   const derivedStarts=derivedWeeks.filter(w=>(team.weeklyLineups?.[w]??[]).some(x=>id(x)===pid)).length;
   contributors.push({name:p.name??pid,position:p.position??p.pos,directPlayer,derivedPlayer,playerDelta:derivedPlayer-directPlayer,directStarts,derivedStarts,source:derivedSamples[0]?.projectionSource??'unknown',seasonBaseline:derivedSamples[0]?.seasonBaseline??null});
  }
  contributors.sort((a,b)=>Math.abs(b.playerDelta)-Math.abs(a.playerDelta));
  return {teamId:team.id,teamName:team.name,directSubmittedMean:submittedMean,directOptimizedMean:optimizedMean,derivedMean,optimizationGap:submittedMean===null||optimizedMean===null?null:optimizedMean-submittedMean,postOptimizationGap:optimizedMean===null||derivedMean===null?null:derivedMean-optimizedMean,topContributors:contributors.slice(0,5)};
 }).sort((a,b)=>String(a.teamName).localeCompare(String(b.teamName)));
}
