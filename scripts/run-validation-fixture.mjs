import {compareSimulationInputs,applyRosterProjectionScenario} from '../src/model/scenario-engine.js';

const p=(id,pos,projection)=>({id,name:id,position:pos,nflTeam:'BUF',projection});
const makeBase=(simulations,seed)=>({simulations,seed,modelVariant:'baseline',lineupSlots:['QB','RB'],playoffSpots:2,playoffWeeks:[3],teams:[
 {id:'A',name:'Alpha',wins:1,losses:1,points:200,weeklyLineups:{1:[p('AQ','QB',18),p('AR','RB',10)],2:[p('AQ','QB',18),p('AR','RB',10)],3:[p('AQ','QB',18),p('AR','RB',10)]}},
 {id:'B',name:'Bravo',wins:1,losses:1,points:195,weeklyLineups:{1:[p('BQ','QB',17),p('BR','RB',10)],2:[p('BQ','QB',17),p('BR','RB',10)],3:[p('BQ','QB',17),p('BR','RB',10)]}},
 {id:'C',name:'Charlie',wins:0,losses:2,points:180,weeklyLineups:{1:[p('CQ','QB',16),p('CR','RB',9)],2:[p('CQ','QB',16),p('CR','RB',9)],3:[p('CQ','QB',16),p('CR','RB',9)]}}
],schedule:[{week:1,matchups:[['A','B']]},{week:2,matchups:[['A','C']]}]});

const seeds=[101,202,303,404,505],counts=[5000,20000],rows=[];
for(const simulations of counts)for(const seed of seeds){const base=makeBase(simulations,seed),scenario=applyRosterProjectionScenario(base,{teamId:'A',playerId:'AR',projectionDelta:2}),focus=compareSimulationInputs(base,scenario,{teamId:'A'}).focus;rows.push({simulations,seed,playoffDelta:focus.playoffProbabilityDelta,championshipDelta:focus.championshipProbabilityDelta,winsDelta:focus.averageWinsDelta});}
const mean=(xs,k)=>xs.reduce((s,x)=>s+x[k],0)/xs.length;
console.log('VALIDATION FIXTURE: paired +2 point player improvement across seeds/sample sizes');
for(const simulations of counts){const group=rows.filter(x=>x.simulations===simulations);console.log(`${simulations} sims: mean playoff ${(100*mean(group,'playoffDelta')).toFixed(2)}%, championship ${(100*mean(group,'championshipDelta')).toFixed(2)}%, wins ${mean(group,'winsDelta').toFixed(3)}`);for(const r of group)console.log(`  seed ${r.seed}: playoff ${(100*r.playoffDelta).toFixed(2)}%, championship ${(100*r.championshipDelta).toFixed(2)}%, wins ${r.winsDelta.toFixed(3)}`)}
console.log(JSON.stringify(rows,null,2));
