const key=r=>[Number(r.season),Number(r.week),String(r.playerId??'').trim()].join('|');
export function compareYahooActualScores(actuals,yahooRows,{tolerance=0.02}={}){
 const byId=new Map(),duplicateYahooIds=new Set(),comparisons=[],unmatched=[];
 for(const row of yahooRows){
  const k=key(row);
  if(byId.has(k))duplicateYahooIds.add(k);
  else byId.set(k,row);
 }
 for(const actual of actuals){
  const k=key(actual),yahoo=byId.get(k);
  if(!yahoo){unmatched.push({season:actual.season,week:actual.week,playerId:actual.playerId,reason:'no-yahoo-id-match'});continue;}
  if(duplicateYahooIds.has(k)){unmatched.push({season:actual.season,week:actual.week,playerId:actual.playerId,reason:'duplicate-yahoo-id'});continue;}
  const observed=Number(yahoo.actual),derived=Number(actual.actual);
  if(yahoo.actual===null||yahoo.actual===undefined||yahoo.actual===''||!Number.isFinite(observed)||!Number.isFinite(derived)){
   unmatched.push({season:actual.season,week:actual.week,playerId:actual.playerId,reason:'invalid-score'});continue;
  }
  const difference=derived-observed;
  comparisons.push({season:actual.season,week:actual.week,playerId:actual.playerId,position:actual.position,nflverse:derived,yahoo:observed,difference,withinTolerance:Math.abs(difference)<=tolerance});
 }
 const mismatches=comparisons.filter(r=>!r.withinTolerance);
 const summary={compared:comparisons.length,withinTolerance:comparisons.length-mismatches.length,mismatches:mismatches.length,unmatched:unmatched.length,mae:comparisons.length?comparisons.reduce((s,r)=>s+Math.abs(r.difference),0)/comparisons.length:null};
 return {schemaVersion:1,identityMethod:'exact-shared-player-id',tolerance,summary,mismatches,unmatched,pass:comparisons.length>0&&mismatches.length===0&&unmatched.length===0,note:'Only exact shared player IDs are compared; Yahoo player IDs generally differ from nflverse IDs. Zero comparisons is not a scoring pass.'};
}
