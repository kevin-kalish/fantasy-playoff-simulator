import assert from 'node:assert/strict';
import {compareSimulationInputs,applyLineupScenario,applyRosterProjectionScenario} from '../src/model/scenario-engine.js';
const player=(id,position,projection)=>({id,name:id,position,projection,nflTeam:'BUF'});
const base={teams:[{id:'A',name:'A',wins:1,losses:0,points:100,weeklyLineups:{2:[player('A-QB','QB',20)],3:[player('A-QB','QB',20)]}},{id:'B',name:'B',wins:0,losses:1,points:90,weeklyLineups:{2:[player('B-QB','QB',15)],3:[player('B-QB','QB',15)]}}],schedule:[{week:2,matchups:[['A','B']]}],playoffSpots:1,playoffWeeks:[3],simulations:2000,seed:42,modelVariant:'fixed',nflGames:[]};
const stronger=applyRosterProjectionScenario(base,{teamId:'B',playerId:'B-QB',projectionDelta:20});assert.equal(base.teams[1].weeklyLineups[2][0].projection,15);assert.equal(stronger.teams[1].weeklyLineups[2][0].projection,35);
const comparison=compareSimulationInputs(base,stronger,{teamId:'B'});assert.equal(comparison.seed,42);assert.equal(comparison.simulations,2000);assert.equal(comparison.focus.id,'B');assert.ok(comparison.focus.playoffProbabilityDelta>0);
const swapped=applyLineupScenario(base,{teamId:'A',week:2,removePlayerId:'A-QB',addPlayer:player('NEW','QB',30)});assert.equal(swapped.teams[0].weeklyLineups[2][0].id,'NEW');assert.equal(base.teams[0].weeklyLineups[2][0].id,'A-QB');
assert.throws(()=>applyLineupScenario(base,{teamId:'X',week:2,addPlayer:player('N','QB',10)}),/Unknown team/);
console.log('scenario-engine-tests: all checks passed');
