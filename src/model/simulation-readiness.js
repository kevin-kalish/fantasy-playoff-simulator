export function assessSimulationReadiness(prepared,{minimumProjectionMatchRate=.9}={}){
 const coverage=prepared?.diagnostics?.projectionCoverage||{total:0,matched:0,bye:0,missing:0,usable:0,matchRate:0,weeks:[]};
 const incomplete=prepared?.diagnostics?.incompleteLineups||[];
 const input=prepared?.input||{};
 const errors=[],warnings=[];
 const audit=coverage.availabilityAudit||[];
 const currentWeek=Number(prepared?.diagnostics?.currentWeek??input.metadata?.currentWeek);
 const currentUnavailable=audit.filter(x=>Number(x.week)===currentWeek&&!x.uncertain);
 const uncertain=audit.filter(x=>x.uncertain);
 if(currentUnavailable.length)warnings.push(`${currentUnavailable.length} current-week unavailable roster player(s) excluded from lineup optimization.`);
 if(uncertain.length)warnings.push(`${uncertain.length} player-week availability observation(s) require confirmation (questionable/doubtful or unresolved future status).`);
 const starters=(prepared?.league?.teams||[]).flatMap(t=>(t.weeklyLineups?.[currentWeek]||[]).filter(p=>['OUT','O','IR','IR-R','PUP','PUP-R','SUSP','SUSPENDED','NA','INACTIVE','BYE'].includes(String(p.status||'').toUpperCase())).map(p=>`${t.name}: ${p.name} (${p.status})`));
 if(starters.length)warnings.push(`Submitted starters include unavailable players: ${starters.join('; ')}.`);
 if(!input.teams?.length)errors.push('No teams are available for simulation.');
 if(!input.schedule?.length)errors.push('No remaining regular-season schedule is available.');
 if(!coverage.total)errors.push('No roster-week projection observations were evaluated.');
 else if(coverage.matchRate<minimumProjectionMatchRate)errors.push(`Projection coverage ${(coverage.matchRate*100).toFixed(1)}% is below required ${(minimumProjectionMatchRate*100).toFixed(1)}%.`);
 if(incomplete.length)errors.push(`${incomplete.length} optimized team-week lineup(s) are incomplete.`);
 if(!input.calibration)warnings.push('No empirical calibration parameters are attached; simulator fallbacks will be used.');
 if(!input.nflGames?.length)warnings.push('No NFL game context is attached; game-level correlation may be limited.');
 return {ready:errors.length===0,errors,warnings,projectionCoverage:coverage,incompleteLineups:incomplete,lineupSlots:prepared?.diagnostics?.lineupSlots||[],teamCount:input.teams?.length||0,scheduleWeeks:(input.schedule||[]).map(x=>x.week),playoffWeeks:input.playoffWeeks||[],modelVariant:input.modelVariant,simulations:input.simulations,seed:input.seed};
}
