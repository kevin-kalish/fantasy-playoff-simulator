const key=(season,week,id)=>[Number(season),Number(week),String(id)].join('|');
export function summarizeYahooParticipationCoverage(nfl,yahoo,audit){
 const individuals=yahoo.filter(r=>String(r.position).toUpperCase()!=='DEF');
 const matched=new Set([...audit.compared,...audit.exceptionAudit.reviewedMatches].map(r=>key(r.season,r.week,r.yahooPlayerId)));
 const nflIdentity=new Map();
 const norm=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/(?:[\s.,]+)(?:jr|sr|ii|iii|iv|v)\.?$/i,'').replace(/[^a-z0-9]/g,'');
 for(const r of nfl){const k=norm(r.name)+'|'+String(r.position).toUpperCase();if(!nflIdentity.has(k))nflIdentity.set(k,[]);nflIdentity.get(k).push(r);}
 const unresolved=individuals.filter(r=>!matched.has(key(r.season,r.week,r.playerId))).map(r=>{
  const peers=nflIdentity.get(norm(r.name)+'|'+String(r.position).toUpperCase())??[];
  const sameWeek=peers.filter(n=>Number(n.season)===Number(r.season)&&Number(n.week)===Number(r.week));
  const category=sameWeek.length?'same-week-identity-unresolved':peers.length?'known-player-no-same-week-record':'identity-not-in-actuals';
  return {season:r.season,week:r.week,yahooPlayerId:r.playerId,name:r.name,position:r.position,nflTeam:r.nflTeam,yahooActual:Number(r.actual),category,participation:'unverified'};
 });
 const categories={};for(const r of unresolved)categories[r.category]=(categories[r.category]??0)+1;
 const nonzero=unresolved.filter(r=>!Number.isFinite(r.yahooActual)||r.yahooActual!==0).length;
 const scoreMismatches=audit.summary.mismatches+audit.summary.reviewedScoreMismatches;
 const invalidOverrides=audit.exceptionAudit.rejected.length;
 const scoringParityPass=audit.summary.totalMatched>0&&scoreMismatches===0&&nonzero===0&&audit.ambiguous.length===0&&invalidOverrides===0;
 return {schemaVersion:1,summary:{individuals:individuals.length,matched:audit.summary.totalMatched,unresolved:unresolved.length,unresolvedNonzero:nonzero,scoreMismatches,invalidOverrides,excludedDefenses:audit.summary.excludedDefenses,categories,scoringParityPass,participationCoverageComplete:unresolved.length===0},unresolved,note:'Scoring parity is separate from participation coverage. Zero-point records are not inferred to be inactive or verified; defense scores are excluded. No calibration eligibility implied.'};
}
