import {enrichWeeklyProjections} from '../data/weekly-projection-enrichment.js';
import {buildFutureWeeklyLineups,DEFAULT_SLOTS} from './lineup-optimizer.js';
import {buildLeagueSimulationInput} from './league-simulation-input.js';

const playerId=p=>String(p?.id??p?.playerId??'');
const usableProjection=p=>p?.projectionStatus!=='missing'&&String(p?.status||'ACTIVE').toUpperCase()!=='BYE'&&Number.isFinite(Number(p?.projection));

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
    const samples=directWeeks.map(w=>(weeklyRosters[w]||[]).find(p=>playerId(p)===pid)).filter(usableProjection).map(p=>Number(p.projection));
    const projection=samples.length?samples.reduce((a,b)=>a+b,0)/samples.length:null;
    const byeWeek=Number(player.byeWeek);
    const bye=Number.isInteger(byeWeek)&&byeWeek===week;
    return {...player,projection:bye?0:projection,status:bye?'BYE':String(player.status||'ACTIVE').toUpperCase()==='BYE'?'ACTIVE':player.status,projectionStatus:bye?'bye':projection===null?'missing':'long-range',projectionSource:'horizon-average'};
   });
  }
  return {...team,weeklyRosters};
 });
 return {...league,teams,longRangeProjectionWeeks:derivedWeeks,directProjectionWeeks:[...direct].sort((a,b)=>a-b)};
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
 input.metadata={...input.metadata,currentWeek,directProjectionWeeks:directWeeks,longRangeProjectionWeeks:modeled.longRangeProjectionWeeks,lineupSlots:activeSlots,rosterProjectionCoverage:enriched.coverage,incompleteLineups:incomplete};
 return {league:optimized,input,diagnostics:{currentWeek,directProjectionWeeks:directWeeks,longRangeProjectionWeeks:modeled.longRangeProjectionWeeks,lineupSlots:activeSlots,projectionCoverage:enriched.coverage,incompleteLineups:incomplete}};
}
