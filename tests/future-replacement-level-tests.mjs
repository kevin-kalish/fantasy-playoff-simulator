import assert from 'node:assert/strict';
import {estimateFutureReplacementLevels,diagnoseFutureReplacementExclusions} from '../src/model/future-replacement-level.js';
const candidates=Array.from({length:6},(_,i)=>({id:String(i+1),name:'Kicker '+(i+1),position:'K',nflTeam:'JAX',byeWeek:10}));
const rows=candidates.map((p,i)=>({name:p.name,position:'K',nflTeam:'JAC',season:2026,week:14,projection:10-i}));
const gaps=[{teamId:'a',teamName:'Alpha',week:14,slots:[{slot:'K'}]}];
const result=estimateFutureReplacementLevels(gaps,candidates,rows,{season:2026,currentWeek:11});
assert.equal(result.length,1);
assert.equal(result[0].method,'direct-week-ranks-3-to-5');
assert.equal(result[0].points,7);
assert.equal(result[0].provisional,true);
assert.equal(result[0].verifiedFutureAvailability,false);
assert.equal(result[0].verifiedProjection,false);
assert.equal(estimateFutureReplacementLevels(gaps,candidates,rows,{season:2026,currentWeek:14})[0].points,null);
assert.equal(estimateFutureReplacementLevels(gaps,candidates,[],{season:2026,currentWeek:11,baselines:{K:6.5}})[0].method,'assumed-position-baseline');
assert.equal(estimateFutureReplacementLevels(gaps,candidates,[],{season:2026,currentWeek:11})[0].points,null);
assert.equal(estimateFutureReplacementLevels(gaps,candidates.slice(0,4),rows,{season:2026,currentWeek:11})[0].points,null);
assert.equal(estimateFutureReplacementLevels(gaps,candidates.map(p=>({...p,byeWeek:14})),rows,{season:2026,currentWeek:11})[0].points,null);
assert.equal(estimateFutureReplacementLevels(gaps,candidates,rows.map(r=>({...r,season:2025})),{season:2026,currentWeek:11})[0].points,null);
const week15=rows.map(r=>({...r,week:15}));
const repeated=estimateFutureReplacementLevels([{teamId:'a',week:14,slots:[{slot:'K'}]},{teamId:'a',week:15,slots:[{slot:'K'}]}],candidates,[...rows,...week15],{season:2026,currentWeek:11});
assert.equal(repeated[0].points,7);
assert.equal(repeated[1].points,7);
const excluded=diagnoseFutureReplacementExclusions([{week:14,slots:[{slot:'K'}]}],[
 {id:'a',name:'Missing Bye',position:'K',nflTeam:'JAX'},
 {id:'b',name:'On Bye',position:'K',nflTeam:'JAX',byeWeek:14},
 {id:'c',name:'Out Now',position:'K',nflTeam:'JAX',byeWeek:12,status:'OUT'},
 {id:'d',name:'No Projection',position:'K',nflTeam:'JAX',byeWeek:12},
 {id:'e',name:'Duplicate',position:'K',nflTeam:'JAX',byeWeek:12},
 {id:'f',name:'Unique',position:'K',nflTeam:'JAX',byeWeek:12},
 {id:'g',position:'K',nflTeam:'JAX',byeWeek:12}
],[
 {season:2026,week:14,name:'Duplicate',position:'K',nflTeam:'JAX',projection:8},
 {season:2026,week:14,name:'Duplicate',position:'K',nflTeam:'JAX',projection:9},
 {season:2026,week:14,name:'Unique',position:'K',nflTeam:'JAX',projection:7}
],{season:2026,currentWeek:11})[0];
assert.equal(excluded.positionCandidates,7);
for(const field of ['missingIdentity','missingBye','onBye','currentUnavailable','noWeeklyProjection','ambiguousWeeklyProjection','uniqueWeeklyProjection'])assert.equal(excluded[field],1,field);
assert.equal(['missingIdentity','missingBye','onBye','currentUnavailable','noWeeklyProjection','ambiguousWeeklyProjection','uniqueWeeklyProjection'].reduce((n,k)=>n+excluded[k],0),excluded.positionCandidates);
const defenseCandidates=Array.from({length:5},(_,i)=>({id:'dst'+i,name:'Yahoo Defense '+i,position:'DEF',nflTeam:['JAX','NE','WAS','LAR','BUF'][i],byeWeek:10}));
const defenseRows=defenseCandidates.map((p,i)=>({season:2026,week:14,name:'Different provider defense name',position:'DST',nflTeam:['JAC','NWE','WSH','LA','BUF'][i],projection:10-i}));
const defenseGap=[{week:14,slots:[{slot:'DEF'}]}];
assert.equal(estimateFutureReplacementLevels(defenseGap,defenseCandidates,defenseRows,{season:2026,currentWeek:11})[0].points,7);
assert.equal(diagnoseFutureReplacementExclusions(defenseGap,defenseCandidates,defenseRows,{season:2026,currentWeek:11})[0].uniqueWeeklyProjection,5);
const ambiguousDefense=[...defenseRows, {...defenseRows[0],projection:99}];
assert.equal(diagnoseFutureReplacementExclusions(defenseGap,defenseCandidates,ambiguousDefense,{season:2026,currentWeek:11})[0].ambiguousWeeklyProjection,1);
const missingPosition=diagnoseFutureReplacementExclusions(defenseGap,defenseCandidates,[],{season:2026,currentWeek:11})[0];
assert.equal(missingPosition.noPositionProjectionRows,5);
const mismatchedPosition=diagnoseFutureReplacementExclusions(defenseGap,defenseCandidates,[{...defenseRows[0],nflTeam:'CHI'}],{season:2026,currentWeek:11})[0];
assert.equal(mismatchedPosition.identityMismatch,5);
console.log('future-replacement-level-tests: all checks passed');
