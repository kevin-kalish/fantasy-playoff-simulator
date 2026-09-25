import {compareSimulationInputs,applyRosterProjectionScenario} from '../src/model/scenario-engine.js';

const p=(id,pos,projection)=>({id,name:id,position:pos,nflTeam:id[0]==='A'?'BUF':id[0]==='B'?'MIA':'NYJ',projection,stdev:pos==='QB'?5:4,availability:1});
const lineup=(prefix,qb,rb)=>[p(`${prefix}Q`,'QB',qb),p(`${prefix}R`,'RB',rb)];
const makeBase=(simulations,seed)=>({simulations,seed,modelVariant:'volatility',lineupSlots:['QB','RB'],playoffSpots:2,playoffWeeks:[3],teams:[
 {id:'A',name:'Alpha',wins:1,losses:1,points:200,weeklyLineups:{3:lineup('A',17,10),4:lineup('A',17,10),5:lineup('A',17,10)}},
 {id:'B',name:'Bravo',wins:1,losses:1,points:199,weeklyLineups:{3:lineup('B',17,10),4:lineup('B',17,10),5:lineup('B',17,10)}},
 {id:'C',name:'Charlie',wins:1,losses:1,points:198,weeklyLineups:{3:lineup('C',17,10),4:lineup('C',17,10),5:lineup('C',17,10)}}
],schedule:[{week:3,matchups:[['A','B']]},{week:4,matchups:[['A','C'],['B','C']]}]});

const seeds=[101,202,303,404,505],counts=[5000,20000],rows=[];
for(const simulations of counts)for(const seed of seeds){
 const base=makeBase(simulations,seed),scenario=applyRosterProjectionScenario(base,{teamId:'A',playerId:'AR',projectionDelta:2}),focus=compareSimulationInputs(base,scenario,{teamId:'A'}).focus;
 rows.push({simulations,seed,playoffDelta:focus.playoffProbabilityDelta,championshipDelta:focus.championshipProbabilityDelta,winsDelta:focus.averageWinsDelta});
}
const mean=(xs,k)=>xs.reduce((s,x)=>s+x[k],0)/xs.length;
const spread=(xs,k)=>Math.max(...xs.map(x=>x[k]))-Math.min(...xs.map(x=>x[k]));
console.log('VALIDATION FIXTURE: paired +2 point starter improvement across competitive volatile league');
for(const simulations of counts){
 const group=rows.filter(x=>x.simulations===simulations);
 console.log(`${simulations} sims: mean playoff ${(100*mean(group,'playoffDelta')).toFixed(2)}%, championship ${(100*mean(group,'championshipDelta')).toFixed(2)}%, wins ${mean(group,'winsDelta').toFixed(3)}`);
 console.log(`  seed spread: playoff ${(100*spread(group,'playoffDelta')).toFixed(2)}pp, championship ${(100*spread(group,'championshipDelta')).toFixed(2)}pp, wins ${spread(group,'winsDelta').toFixed(3)}`);
 for(const r of group)console.log(`  seed ${r.seed}: playoff ${(100*r.playoffDelta).toFixed(2)}%, championship ${(100*r.championshipDelta).toFixed(2)}%, wins ${r.winsDelta.toFixed(3)}`);
}
if(rows.every(r=>r.playoffDelta===0&&r.championshipDelta===0&&r.winsDelta===0))throw new Error('Validation fixture is insensitive: all scenario deltas are zero');
console.log(JSON.stringify(rows,null,2));
