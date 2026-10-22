const aliases={JAC:'JAX',WSH:'WAS',OAK:'LV',SD:'LAC',STL:'LA',LAR:'LA'};
const team=v=>aliases[String(v??'').trim().toUpperCase()]??String(v??'').trim().toUpperCase();
const key=r=>[Number(r.season),Number(r.week),team(r.nflTeam??r.team)].join('|');
export function reconcileYahooDstScores(yahooRows,dstRows,{tolerance=0.02,verifiedByeWeeks=[]}={}){const byeKeys = new Set(
  verifiedByeWeeks.map(({ season, week, team: nflTeam }) =>
    [Number(season), Number(week), team(nflTeam)].join('|')
  )
);
const verifiedByes = [];
 const yahoo=yahooRows.filter(r=>String(r.position).toUpperCase()==='DEF');
 const index=new Map();
 for(const r of dstRows){const k=key(r);if(!index.has(k))index.set(k,[]);index.get(k).push(r);}
 const compared=[],unmatched=[],ambiguous=[];
 const seen=new Set();
 for(const y of yahoo){
  const k=key(y),matches=index.get(k)??[];
  if(seen.has(k)){ambiguous.push({key:k,reason:'duplicate-yahoo-team-week'});continue;}
  seen.add(k);
  if(matches.length>1){ambiguous.push({key:k,reason:'duplicate-dst-team-week',count:matches.length});continue;}

if (matches.length === 0) {
  if (byeKeys.has(k) && Number(y.actual) === 0) {
    verifiedByes.push({
      key: k,
      yahooPlayerId: y.playerId,
      reason: 'verified-bye'
    });
  } else {
    unmatched.push({
      key: k,
      reason: 'no-dst-team-week',
      yahooPlayerId: y.playerId
    });
  }
  continue;
}

  const n=matches[0],yv=Number(y.actual),nv=Number(n.actual);
  if(y.actual==null||n.actual==null||!Number.isFinite(yv)||!Number.isFinite(nv)){unmatched.push({key:k,reason:'invalid-score'});continue;}
  const difference=nv-yv;
  compared.push({season:Number(y.season),week:Number(y.week),team:team(y.nflTeam),yahooPlayerId:y.playerId,yahoo:yv,model:nv,difference,withinTolerance:Math.abs(difference)<=tolerance,pointsAllowed:n.pointsAllowed});
 }
 const mismatches=compared.filter(r=>!r.withinTolerance);
 return {schemaVersion:1,source:'Yahoo roster DEF scores vs nflverse hybrid DST reconstruction',tolerance,summary:{yahooDefenses:yahoo.length,modelTeamWeeks:dstRows.length,compared:compared.length,mismatches:mismatches.length,unmatched:unmatched.length,ambiguous:ambiguous.length},compared,mismatches,unmatched,ambiguous,verifiedByes,pass:compared.length>0&&mismatches.length===0&&unmatched.length===0&&ambiguous.length===0,calibrationEligible:false,note:'Direct DST fantasy-score comparison; even a passing result does not independently certify the complete calibration gate.'};
}

