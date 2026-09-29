import {enrichWeeklyProjections} from '../data/weekly-projection-enrichment.js';
import {buildFutureWeeklyLineups,DEFAULT_SLOTS} from './lineup-optimizer.js';
import {buildLeagueSimulationInput} from './league-simulation-input.js';

const playerId=p=>String(p?.id??p?.playerId??'');
const usableProjection=p=>p?.projectionStatus!=='missing'&&String(p?.status||'ACTIVE').toUpperCase()!=='BYE'&&Number.isFinite(Number(p?.projection));
const LONG_RANGE_RECENCY_DECAY=.8;
const TRANSIENT_STATUSES=new Set(['PROBABLE','QUESTIONABLE','DOUBTFUL','OUT','BYE']);

function weightedProjection(samples){
 if(!samples.length)return null;
 const newest=Math.max(...samples.map(x=>x.week));
 let total=0,weight=0;
 for(const sample of samples){const w=Math.pow(LONG_RANGE_RECENCY_DECAY,newest-sample.week);total+=sample.projection*w;weight+=w;}
 return weight?total/weight:null;
}
function longRangeStatus(player,week){
 const byeWeek=Number(player.byeWeek);if(Number.isInteger(byeWeek)&&byeWeek===week)return 'BYE';
 const status=String(player.status||'ACTIVE').toUpperCase();
 // Short-term weekly injury designations should not be projected indefinitely.
 // Persistent designations remain persistent until the source roster changes.
 return TRANSIENT_STATUSES.has(status)?'ACTIVE':status;
}
function addLongRangeProjections(league,directWeeks){
 const currentWeek=Math.min(...directWeeks);
 const regularWeeks=(league.schedule||[]).map(x=>Number(x.week)).filter(w=>Number.isInteger(w)&&w>=currentWeek);
 const playoffWeeks=(league.playoffWeeks||[]).map(Number).filter(Number.isInteger);
 const allFuture=[...new Set([...regularWeeks,...playoffWeeks])].sort((a,b)=>a-b);
 const direct=new Set(directWeeks.map(Number));
 const derivedWeeks=allFuture.filter(w=>!direct.has(w));
 const teams=(league.teams||[]).map(team=>{
  const weeklyRosters={...(team.weeklyRosters||{})};
  const roster=team.roster?.length?team.roster:team.lineup||[];
  for(const week of derivedWeeks){
   weeklyRosters[week]=roster.map(player=>{
    const pid=playerId(player);
    const samples=directWeeks.map(w=>({week:w,player:(weeklyRosters[w]||[]).find(p=>playerId(p)===pid)})).filter(x=>usableProjection(x.player)).map(x=>({week:x.week,projection:Number(x.player.projection)}));
    const projection=weightedProjection(samples);
    const status=longRangeStatus(player,week),bye=status==='BYE';
    return {...player,projection:bye?0:projection,status,projectionStatus:bye?'bye':projection===null?'missing':'long-range',projectionSource:'recency-weighted-horizon',projectionSampleCount:samples.length};
   });
  }
  return {...team,weeklyRosters};
 });
 return {...league,teams,longRangeProjectionWeeks:derivedWeeks,directProjectionWeeks:[...direct].sort((a,b)=>a-b),longRangeProjectionMethod:'recency-weighted-horizon',longRangeRecencyDecay:LONG_RANGE_RECENCY_DECAY};
}

export function prepareLeagueSimulation(snapshot,projectionRows,{slots=null,weeks=null,season=snapshot?.source?.season,strictProjections=false,minimumProjectionMatchRate=.9,calibrationReport=null,simulations=50000,seed=20260923,modelVariant='correlated'}={}){
 const activeSlots=slots?.length?slots:(snapshot?.lineupSlots?.length?snapshot.lineupSlots:DEFAULT_SLOTS);
 const directWeeks=(weeks?.length?weeks:[...new Set((projectionRows||[]).map(r=>Number(r.week)).filter(Number.isInteger))]).sort((a,b)=>a-b);
 if(!directWeeks.length)throw new Error('League preparation requires at least one directly projected week.');
 const currentWeek=Math.min(...directWeeks);
 const enriched=enrichWeeklyProjections(snapshot,projectionRows,{weeks:directWeeks,season,strict:strictProjections});
 const modeled=addLongRangeProjections(enriched.league,directWeeks);
 const futureWeeks=[...new Set([...(modeled.schedule||[]).map(x=>Number(x.week)).filter(w=>Number.isInteger(w)&&w>=currentWeek),...(modeled.playoffWeeks||[]).map(Number).filter(Number.isInteger)])].sort((a,b)=>a-b);
 const optimized=buildFutureWeeklyLineups(modeled,{slots:activeSlots,weeks:futureWeeks,useRoster:true});
 optimized.schedule=(optimized.schedule||[]).filter(row=>Number(row.week)>=currentWeek);
 const incomplete=[];
 for(const team of optimized.teams||[])for(const [week,d] of Object.entries(team.lineupDiagnostics||{}))if(!d.complete)incomplete.push({teamId:team.id,teamName:team.name,week:Number(week),emptySlots:d.emptySlots,projectedPoints:d.projectedPoints});
 const input=buildLeagueSimulationInput(optimized,{calibrationReport,simulations,seed,modelVariant,minimumProjectionMatchRate});
 input.metadata={...input.metadata,currentWeek,directProjectionWeeks:directWeeks,longRangeProjectionWeeks:modeled.longRangeProjectionWeeks,longRangeProjectionMethod:modeled.longRangeProjectionMethod,longRangeRecencyDecay:modeled.longRangeRecencyDecay,lineupSlots:activeSlots,rosterProjectionCoverage:enriched.coverage,incompleteLineups:incomplete};
 return {league:optimized,input,diagnostics:{currentWeek,directProjectionWeeks:directWeeks,longRangeProjectionWeeks:modeled.longRangeProjectionWeeks,longRangeProjectionMethod:modeled.longRangeProjectionMethod,longRangeRecencyDecay:modeled.longRangeRecencyDecay,lineupSlots:activeSlots,projectionCoverage:enriched.coverage,incompleteLineups:incomplete}};
}
