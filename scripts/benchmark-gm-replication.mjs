import {performance} from 'node:perf_hooks';
import {buildWeeklyGMRecommendations} from '../src/model/gm-recommendation-engine.js';
import {evaluateStartSitChoices} from '../src/model/start-sit-evaluator.js';
import {simulateLeague} from '../src/simulator.js';

// Deterministic, synthetic fixture: no private Yahoo league data.
const simulations=Number(process.argv[2]??300);
if(!Number.isInteger(simulations)||simulations<1||simulations>2000)throw new Error('simulations must be 1..2000');
const player=(id,position,projection,slot)=>({id,name:id,position,projection,...(slot?{lineupSlot:slot}:{})});
const teams=Array.from({length:4},(_,i)=>{
 const id='T'+i,roster=[player(id+'-QB','QB',15+i),player(id+'-RB','RB',10+i),player(id+'-BENCH','RB',20+i),player(id+'-BENCH2','RB',18+i),player(id+'-BENCH3','RB',16+i)];
 return {id,name:id,wins:1,losses:1,points:180+i*10,roster,weeklyLineups:Object.fromEntries([1,2,3].map(w=>[w,[{...roster[0],lineupSlot:'QB'},{...roster[1],lineupSlot:'RB'}]]))};
});
const input={teams,schedule:[{week:1,matchups:[['T0','T1'],['T2','T3']]},{week:2,matchups:[['T0','T2'],['T1','T3']]}],playoffWeeks:[3],playoffSpots:2,lineupSlots:['QB','RB'],modelVariant:'baseline',seed:88,simulations};
const projectionRows=[{week:1,playerId:'T0-RB',projection:10},{week:1,playerId:'T0-BENCH',projection:20},{week:1,playerId:'T0-BENCH2',projection:18},{week:1,playerId:'T0-BENCH3',projection:16}];
const spec={teamId:'T0',week:1,projectionRows,startSit:{slot:'RB'},trades:[],waivers:null};
const measure=fn=>{const start=performance.now(),value=fn();return {ms:Math.round(performance.now()-start),value};};
const base=buildWeeklyGMRecommendations(input,spec,{simulations});
const selected=base.recommendations[0];
if(!selected||selected.type!=='start-sit')throw new Error('Fixture produced no start/sit recommendation');
const alternate={...input,seed:100091};
const full=measure(()=>buildWeeklyGMRecommendations(alternate,spec,{simulations}));
const targeted=measure(()=>{
 const baseline=simulateLeague({...alternate,simulations});
 const d=selected.details;
 return evaluateStartSitChoices(alternate,{teamId:'T0',week:1,projectionRows,choices:[{slot:d.slot,startPlayerId:d.startPlayerId,startPlayerName:d.startPlayerName,sitPlayerId:d.sitPlayerId,sitPlayerName:d.sitPlayerName,projectedPointDelta:d.projectedPointDelta}]},{simulations,baselineResults:baseline})[0];
});
const same=full.value.recommendations.find(r=>r.label===selected.label);
if(!same||!targeted.value)throw new Error('Comparison could not find selected action');
if(Math.abs(same.championshipDelta-targeted.value.championshipDelta)>1e-12)throw new Error('Targeted and full championship deltas differ');
console.log(JSON.stringify({benchmark:'synthetic-gm-targeted-vs-full',simulations,fullRescanMs:full.ms,targetedMs:targeted.ms,ratio:targeted.ms?Number((full.ms/targeted.ms).toFixed(2)):null,championshipDelta:targeted.value.championshipDelta,scope:'Four-player synthetic RB roster, one selected start/sit action and one seed; timings are not generalizable'},null,2));
