const close=(a,b,t=.005)=>Math.abs(Number(a)-Number(b))<=t;
const sum=(a,f)=>a.reduce((n,x)=>n+Number(x[f]||0),0);
const sameArray=(a,b)=>JSON.stringify(a||[])===JSON.stringify(b||[]);

export function auditYahooReference(reference,actual){
 const checks=[];
 const check=(code,pass,expected,observed)=>checks.push({code,pass:Boolean(pass),expected,observed});
 check('TEAM_COUNT',Number(actual.teamCount)===Number(reference.teamCount),reference.teamCount,actual.teamCount);
 const rr=reference.referenceTeam||{},ar=actual.referenceTeam||{};
 for(const f of ['wins','losses','ties','rank','waiverPriority','moves'])check(`REFERENCE_${f.toUpperCase()}`,Number(ar[f])===Number(rr[f]),rr[f],ar[f]);
 check('REFERENCE_POINTS_FOR',close(ar.pointsFor,rr.pointsFor),rr.pointsFor,ar.pointsFor);
 check('REFERENCE_POINTS_AGAINST',close(ar.pointsAgainst,rr.pointsAgainst),rr.pointsAgainst,ar.pointsAgainst);
 for(const [slot,count] of Object.entries(reference.roster||{}))check(`ROSTER_${slot.replaceAll('/','_')}`,Number(actual.roster?.[slot])===Number(count),count,actual.roster?.[slot]);
 check('PLAYOFF_SPOTS',Number(actual.playoffs?.spots)===Number(reference.playoffs?.spots),reference.playoffs?.spots,actual.playoffs?.spots);
 check('PLAYOFF_WEEKS',sameArray(actual.playoffs?.weeks,reference.playoffs?.weeks),reference.playoffs?.weeks,actual.playoffs?.weeks);
 check('PLAYOFF_RESEED',actual.playoffs?.reseed===reference.playoffs?.reseed,reference.playoffs?.reseed,actual.playoffs?.reseed);
 check('PLAYOFF_TIEBREAKER',actual.playoffs?.tieBreaker===reference.playoffs?.tieBreaker,reference.playoffs?.tieBreaker,actual.playoffs?.tieBreaker);
 const games=reference.completedGames||[];
 check('HISTORICAL_PF_RECONCILES',close(sum(games,'teamScore'),rr.pointsFor),rr.pointsFor,sum(games,'teamScore'));
 check('HISTORICAL_PA_RECONCILES',close(sum(games,'opponentScore'),rr.pointsAgainst),rr.pointsAgainst,sum(games,'opponentScore'));
 return {passed:checks.every(x=>x.pass),checks,failures:checks.filter(x=>!x.pass)};
}

export function scoreReferenceOffense(stats,scoring){
 const threshold=(value,bonuses=[])=>bonuses.reduce((n,b)=>n+(Number(value)>=Number(b.yards)?Number(b.points):0),0);
 const p=scoring.passing||{},r=scoring.rushing||{},c=scoring.receiving||{},m=scoring.misc||{};
 return Number(stats.passYards||0)/p.yardsPerPoint+Number(stats.passTD||0)*p.touchdown+Number(stats.interceptions||0)*p.interception+threshold(stats.passYards,p.bonuses)
  +Number(stats.rushYards||0)/r.yardsPerPoint+Number(stats.rushTD||0)*r.touchdown+threshold(stats.rushYards,r.bonuses)
  +Number(stats.receptions||0)*c.reception+Number(stats.recYards||0)/c.yardsPerPoint+Number(stats.recTD||0)*c.touchdown+threshold(stats.recYards,c.bonuses)
  +Number(stats.returnTD||0)*m.returnTouchdown+Number(stats.twoPoint||0)*m.twoPointConversion+Number(stats.fumblesLost||0)*m.fumbleLost+Number(stats.offensiveFumbleReturnTD||0)*m.offensiveFumbleReturnTouchdown;
}
