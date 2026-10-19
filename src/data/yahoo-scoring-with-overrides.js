import {reconcileYahooNflverseScores} from './yahoo-nflverse-score-audit.js';
import {auditIdentityExceptions} from './yahoo-identity-exceptions.js';
const key=(season,week,id)=>[Number(season),Number(week),String(id)].join('|');
export function auditYahooScoresWithOverrides(nfl,yahoo,{overrides=[]}={}){
 const individuals=yahoo.filter(r=>String(r.position).toUpperCase()!=='DEF');
 const base=reconcileYahooNflverseScores(nfl,individuals);
 const exceptions=auditIdentityExceptions(nfl,yahoo,{overrides});
 const baseYahoo=new Set(base.compared.map(r=>key(r.season,r.week,r.yahooPlayerId)));
 const baseNfl=new Set(base.compared.map(r=>key(r.season,r.week,r.nflversePlayerId)));
 const usedYahoo=new Set(),usedNfl=new Set(),approved=[],rejected=[...exceptions.rejected];
 for(const m of exceptions.reviewedMatches){
  const y=key(m.season,m.week,m.yahooPlayerId),n=key(m.season,m.week,m.nflversePlayerId);
  const reason=baseYahoo.has(y)?'already-matched-yahoo-player':baseNfl.has(n)?'already-matched-nflverse-player':usedYahoo.has(y)?'duplicate-yahoo-override':usedNfl.has(n)?'duplicate-nflverse-override':!Number.isFinite(m.scoreDifference)?'invalid-score':null;
  if(reason){rejected.push({override:m,reason});continue;}
  usedYahoo.add(y);usedNfl.add(n);
  approved.push({...m,withinTolerance:Math.abs(m.scoreDifference)<=base.tolerance});
 }
 const totalMatched=base.compared.length+approved.length;
 const unmatchedIndividuals=individuals.length-totalMatched;
 const mismatchCount=base.mismatches.length+approved.filter(m=>!m.withinTolerance).length;
 return {...base,exceptionAudit:{excludedDefenses:exceptions.excludedDefenses,individualRows:exceptions.individualRows,reviewedMatches:approved,rejected},summary:{...base.summary,excludedDefenses:exceptions.excludedDefenses,reviewedMatches:approved.length,reviewedScoreMismatches:approved.filter(m=>!m.withinTolerance).length,totalMatched,unmatchedIndividuals},pass:totalMatched>0&&unmatchedIndividuals===0&&mismatchCount===0&&base.ambiguous.length===0&&rejected.length===0,note:'Individual-player identity matches remain provisional. Defense scoring is separate; no calibration parameters modified.'};
}
