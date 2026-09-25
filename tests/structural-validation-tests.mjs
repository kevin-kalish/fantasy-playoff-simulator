import assert from 'node:assert/strict';
import {applyAddDropScenario} from '../src/model/transaction-scenarios.js';
import {applyRosterProjectionScenario,compareSimulationInputs} from '../src/model/scenario-engine.js';

const p=(id,projection)=>({id,name:id,position:'RB',nflTeam:'BUF',projection});
const qb=(id,projection)=>({id,name:id,position:'QB',nflTeam:'BUF',projection});
const base={simulations:12000,seed:20260923,modelVariant:'baseline',lineupSlots:['QB','RB'],playoffSpots:2,playoffWeeks:[3],teams:[
 {id:'A',name:'A',wins:1,losses:1,points:200,roster:[qb('AQ',18),p('AR',10),p('AB',8)],weeklyLineups:{1:[qb('AQ',18),p('AR',10)],2:[qb('AQ',18),p('AR',10)],3:[qb('AQ',18),p('AR',10)]}},
 {id:'B',name:'B',wins:1,losses:1,points:195,roster:[qb('BQ',17),p('BR',10)],weeklyLineups:{1:[qb('BQ',17),p('BR',10)],2:[qb('BQ',17),p('BR',10)],3:[qb('BQ',17),p('BR',10)]}},
 {id:'C',name:'C',wins:0,losses:2,points:180,roster:[qb('CQ',16),p('CR',9)],weeklyLineups:{1:[qb('CQ',16),p('CR',9)],2:[qb('CQ',16),p('CR',9)],3:[qb('CQ',16),p('CR',9)]}}
],schedule:[{week:1,matchups:[['A','B']]},{week:2,matchups:[['A','C']]}]};

// Identity: comparing an input to an exact clone must be exactly zero under paired seeds.
const identity=compareSimulationInputs(base,structuredClone(base),{teamId:'A'}).focus;
assert.equal(identity.playoffProbabilityDelta,0);assert.equal(identity.championshipProbabilityDelta,0);assert.equal(identity.averageWinsDelta,0);

// Transaction isolation: only the target team's roster/lineups may change.
const rows=[1,2,3].flatMap(week=>[{week,playerId:'AQ',projection:18},{week,playerId:'AB',projection:8},{week,playerId:'AX',projection:12}]);
const changed=applyAddDropScenario(base,{teamId:'A',addPlayer:p('AX',12),dropPlayerId:'AR',projectionRows:rows});
assert.deepEqual(changed.teams.slice(1),base.teams.slice(1));
assert.deepEqual(base.teams[0].roster.map(x=>x.id),['AQ','AR','AB']);
assert.deepEqual(changed.teams[0].roster.map(x=>x.id),['AQ','AB','AX']);

// Monotonic sanity: a larger projection improvement should not produce a worse paired outcome than a smaller one.
const small=applyRosterProjectionScenario(base,{teamId:'A',playerId:'AR',projectionDelta:.1});
const strong=applyRosterProjectionScenario(base,{teamId:'A',playerId:'AR',projectionDelta:5});
const dSmall=compareSimulationInputs(base,small,{teamId:'A'}).focus;
const dStrong=compareSimulationInputs(base,strong,{teamId:'A'}).focus;
assert.ok(dSmall.averageWinsDelta>=-1e-12);assert.ok(dStrong.averageWinsDelta>=dSmall.averageWinsDelta-1e-12);
assert.ok(dStrong.playoffProbabilityDelta>=dSmall.playoffProbabilityDelta-1e-12);
assert.ok(dStrong.championshipProbabilityDelta>=dSmall.championshipProbabilityDelta-1e-12);

console.log('structural-validation-tests: all checks passed');
