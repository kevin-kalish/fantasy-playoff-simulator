/** Team-level source coverage and derived forecast dependence; diagnostic only. */
export function assessTeamProjectionQuality(league,{directWeeks=[],derivedWeeks=[],playoffWeeks=[]}={}){
 return (league?.teams??[]).map(team=>{
  const roster=team.roster??[];
  const rosterIds=new Set(roster.map(p=>String(p.id??p.playerId??'')));
  const byPosition={};
  const baselineSeen=new Map();
  let derivedPlayers=0,derivedWithSeason=0,derivedHorizonOnly=0,derivedMissing=0,confidenceSum=0,confidenceCount=0;
  for(const week of derivedWeeks){
   for(const p of team.weeklyRosters?.[week]??[]){
    const id=String(p.id??p.playerId??'');
    if(!rosterIds.has(id))continue;
    const pos=String(p.position??p.pos??'UNKNOWN').toUpperCase();
    const record=byPosition[pos]??={eligible:0,matched:0};
    if(!baselineSeen.has(id)){baselineSeen.set(id,Number.isFinite(Number(p.seasonBaseline))&&p.seasonBaseline!==null);record.eligible++;if(baselineSeen.get(id))record.matched++;}
    derivedPlayers++;
    const source=p.projectionSource;
    if(source==='season-horizon-blend'||source==='season-baseline')derivedWithSeason++;
    else if(source==='recency-weighted-horizon')derivedHorizonOnly++;
    else derivedMissing++;
    if(Number.isFinite(Number(p.projectionConfidence))){confidenceSum+=Number(p.projectionConfidence);confidenceCount++;}
   }
  }
  // No derived weeks: do not claim baseline coverage from absent data.
  const matched=[...baselineSeen.values()].filter(Boolean).length;
  const eligible=baselineSeen.size;
  const projectedPointsByWeek=Object.fromEntries([...new Set([...directWeeks,...derivedWeeks])].map(w=>{
   const lineup=team.weeklyLineups?.[w];
   const points=Array.isArray(lineup)&&lineup.length&&lineup.every(p=>p.projection!==null&&p.projection!==undefined&&Number.isFinite(Number(p.projection)))?lineup.reduce((sum,p)=>sum+Number(p.projection),0):null;
   return [w,points??team.lineupDiagnostics?.[w]?.projectedPoints??null];
  }));
  const scores=weeks=>weeks.map(w=>projectedPointsByWeek[w]).filter(Number.isFinite);
  const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
  const directScoring=mean(scores(directWeeks)),derivedScoring=mean(scores(derivedWeeks));
  const playoffSet=new Set(playoffWeeks.map(Number));
  const regularDerivedWeeks=derivedWeeks.filter(w=>!playoffSet.has(Number(w)));
  const regularDerivedMean=mean(scores(regularDerivedWeeks));
  const playoffMean=mean(scores(playoffWeeks));
  return {teamId:team.id,teamName:team.name,rosterCount:roster.length,baseline:{eligible,matched,coverage:eligible?matched/eligible:null,byPosition},derived:{samples:derivedPlayers,withSeason:derivedWithSeason,horizonOnly:derivedHorizonOnly,missing:derivedMissing,seasonShare:derivedPlayers?derivedWithSeason/derivedPlayers:null,meanConfidence:confidenceCount?confidenceSum/confidenceCount:null},projectedPointsByWeek,scoring:{directMean:directScoring,derivedMean:derivedScoring,derivedWeekCount:scores(derivedWeeks).length,regularDerivedMean,playoffMean,playoffWeekCount:scores(playoffWeeks).length,playoffVsRegularDelta:playoffMean===null||regularDerivedMean===null?null:playoffMean-regularDerivedMean}};
 }).sort((a,b)=>String(a.teamName).localeCompare(String(b.teamName)));
}
