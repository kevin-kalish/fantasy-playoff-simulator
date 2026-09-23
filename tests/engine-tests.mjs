import assert from 'node:assert/strict';
import {rankStandings} from '../src/standings.js';
import {simulatePlayoffs} from '../src/playoffs.js';
import {playProbability,availableThisWeek} from '../src/model/availability.js';
import {simulateLeague} from '../src/simulator.js';

const teams=[{id:'A',name:'A',lineup:[{projection:20,position:'QB'}]},{id:'B',name:'B',lineup:[{projection:10,position:'QB'}]}];
const state={A:{wins:5,losses:3,points:700},B:{wins:5,losses:3,points:650}};
assert.equal(rankStandings(teams,state)[0].id,'A');
assert.equal(playProbability({status:'OUT'}),0);assert.equal(playProbability({status:'ACTIVE'}),1);
assert.equal(availableThisWeek({status:'ACTIVE',byeWeek:9},9,()=>0),false);
const postseason=simulatePlayoffs({qualifiers:teams,weeks:[15],rng:()=>.5,simulateTeamScore:t=>t.id==='A'?100:90});
assert.equal(postseason.champion.id,'A');
const league={teams:teams.map((t,i)=>({...t,wins:i?0:1,losses:i?1:0,points:0})),schedule:[],playoffSpots:1};
const r1=simulateLeague({...league,simulations:50,seed:77,playoffWeeks:[15]}),r2=simulateLeague({...league,simulations:50,seed:77,playoffWeeks:[15]});
assert.deepEqual(r1,r2);assert.equal(r1.find(x=>x.id==='A').playoffProbability,1);
console.log('engine-tests: all checks passed');
