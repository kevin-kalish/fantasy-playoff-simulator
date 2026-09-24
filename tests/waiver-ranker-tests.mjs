import assert from 'node:assert/strict';
import {rankWaiverCandidates} from '../src/model/waiver-ranker.js';
const p=(id,position,projection)=>({id,name:id,position,nflTeam:'BUF',projection});
const base={lineupSlots:['QB','RB'],teams:[{id:'A',name:'A',wins:1,losses:0,points:100,roster:[p('A-QB','QB',20),p('A-RB','RB',8),p('A-BENCH','RB',6)],weeklyLineups:{2:[p('A-QB','QB',20),p('A-RB','RB',8)],3:[p('A-QB','QB',20),p('A-RB','RB',8)]}},{id:'B',name:'B',wins:0,losses:1,points:90,roster:[p('B-QB','QB',15),p('B-RB','RB',7)],weeklyLineups:{2:[p('B-QB','QB',15),p('B-RB','RB',7)],3:[p('B-QB','QB',15),p('B-RB','RB',7)]}}],schedule:[{week:2,matchups:[['A','B']]}],playoffSpots:1,playoffWeeks:[3],simulations:2000,seed:42,modelVariant:'baseline',nflGames:[]};
const candidates=[p('RB-GOOD','RB',0),p('RB-OK','RB',0)];
const rows=[{week:2,playerId:'A-QB',projection:20},{week:3,playerId:'A-QB',projection:20},{week:2,playerId:'A-BENCH',projection:6},{week:3,playerId:'A-BENCH',projection:6},{week:2,playerId:'RB-GOOD',projection:18},{week:3,playerId:'RB-GOOD',projection:18},{week:2,playerId:'RB-OK',projection:10},{week:3,playerId:'RB-OK',projection:10}];
const ranked=rankWaiverCandidates(base,{teamId:'A',candidates,dropPlayerIds:['A-RB','A-BENCH'],projectionRows:rows});
assert.equal(ranked.length,2);assert.equal(ranked[0].rank,1);assert.equal(ranked[0].addPlayerId,'RB-GOOD');assert.ok(ranked[0].playoffDelta>=ranked[1].playoffDelta);assert.ok(['A-RB','A-BENCH'].includes(ranked[0].dropPlayerId));
console.log('waiver-ranker-tests: all checks passed');
