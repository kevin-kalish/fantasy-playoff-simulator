const normalize=s=>String(s??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const team=s=>({JAC:'JAX',WSH:'WAS',OAK:'LV',SD:'LAC',STL:'LA',LAR:'LA'}[String(s??'').toUpperCase()]??String(s??'').toUpperCase());
const sameWeek=(a,b)=>Number(a.season)===Number(b.season)&&Number(a.week)===Number(b.week);
export function diagnoseUnmatchedYahooPlayers(nflRows,yahooRows){
 const nflByWeek=new Map();
 for(const n of nflRows){const k=[Number(n.season),Number(n.week)].join('|');if(!nflByWeek.has(k))nflByWeek.set(k,[]);nflByWeek.get(k).push(n);}
 const details=[],reasons={};
 for(const y of yahooRows){
  const week=nflByWeek.get([Number(y.season),Number(y.week)].join('|'))??[];
  const sameName=week.filter(n=>normalize(n.name)===normalize(y.name));
  const exact=sameName.filter(n=>String(n.position).toUpperCase()===String(y.position).toUpperCase()&&team(n.nflTeam)===team(y.nflTeam));
  if(exact.length===1)continue;
  let reason,candidates=[];
  if(exact.length>1){reason='ambiguous-exact-identity';candidates=exact;}
  else if(sameName.length>1){reason='ambiguous-name';candidates=sameName;}
  else if(sameName.length===1){
   const n=sameName[0];candidates=sameName;
   reason=String(n.position).toUpperCase()!==String(y.position).toUpperCase()?'position-disagreement':'team-disagreement';
  }else{
   const sameTeamPosition=week.filter(n=>team(n.nflTeam)===team(y.nflTeam)&&String(n.position).toUpperCase()===String(y.position).toUpperCase());
   if(!week.length)reason='no-nflverse-week';
   else if(!sameTeamPosition.length)reason='no-same-team-position-candidate';
   else{reason='name-or-roster-coverage';candidates=sameTeamPosition;}
  }
  reasons[reason]=(reasons[reason]??0)+1;
  details.push({season:y.season,week:y.week,yahooPlayerId:y.playerId,name:y.name,position:y.position,nflTeam:y.nflTeam,yahooActual:y.actual,reason,candidateCount:candidates.length,candidates:candidates.slice(0,8).map(n=>({playerId:n.playerId,name:n.name,position:n.position,nflTeam:n.nflTeam,actual:n.actual}))});
 }
 return {schemaVersion:1,mode:'offline-unmatched-identity-diagnostics',yahooRows:yahooRows.length,nflverseRows:nflRows.length,unmatched:details.length,reasons:Object.fromEntries(Object.entries(reasons).sort((a,b)=>b[1]-a[1])),details,note:'Candidates are for manual investigation only. No inferred matches, score-based identity matching, or calibration changes.'};
}
