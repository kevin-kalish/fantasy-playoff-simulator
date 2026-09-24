import {enrichWeeklyProjections} from '../data/weekly-projection-enrichment.js';
import {buildFutureWeeklyLineups,DEFAULT_SLOTS} from './lineup-optimizer.js';
import {buildLeagueSimulationInput} from './league-simulation-input.js';

export function prepareLeagueSimulation(snapshot,projectionRows,{slots=null,weeks=null,season=snapshot?.source?.season,strictProjections=false,minimumProjectionMatchRate=.9,calibrationReport=null,simulations=50000,seed=20260923,modelVariant='correlated'}={}){
 const activeSlots=slots?.length?slots:(snapshot?.lineupSlots?.length?snapshot.lineupSlots:DEFAULT_SLOTS);
 const enriched=enrichWeeklyProjections(snapshot,projectionRows,{weeks,season,strict:strictProjections});
 const optimized=buildFutureWeeklyLineups(enriched.league,{slots:activeSlots,weeks,useRoster:true});
 const incomplete=[];
 for(const team of optimized.teams||[])for(const [week,d] of Object.entries(team.lineupDiagnostics||{}))if(!d.complete)incomplete.push({teamId:team.id,teamName:team.name,week:Number(week),emptySlots:d.emptySlots,projectedPoints:d.projectedPoints});
 const input=buildLeagueSimulationInput(optimized,{calibrationReport,simulations,seed,modelVariant,minimumProjectionMatchRate});
 input.metadata={...input.metadata,lineupSlots:activeSlots,rosterProjectionCoverage:enriched.coverage,incompleteLineups:incomplete};
 return {league:optimized,input,diagnostics:{lineupSlots:activeSlots,projectionCoverage:enriched.coverage,incompleteLineups:incomplete}};
}
