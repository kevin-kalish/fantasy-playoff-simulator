import assert from 'node:assert/strict';
import {discoverTradeCandidates} from '../src/model/trade-candidate-source.js';
const p=(id,name,position,projection)=>({id,name,position,projection});
const input={teams:[{id:'A',name:'Alpha',roster:[p('a1','Alpha RB','RB',15),p('a2','Alpha WR','WR',10),p('ak','Alpha K','K',20)]},{id:'B',name:'Bravo',roster:[p('b1','Bravo WR','WR',16),p('b2','Bravo RB','RB',9)]},{id:'C',name:'Charlie',roster:[p('c1','Charlie RB','RB',14)]}],schedule:[{week:4},{week:5}]};
const rows=[];for(const week of [4,5])for(const t of input.teams)for(const x of t.roster)rows.push({week,playerId:x.id,projection:x.projection});
const out=discoverTradeCandidates(input,{teamId:'A',projectionRows:rows,weeks:[4,5],maxScenarios:10,valueTolerance:.2});
assert.ok(out.scenarios.length>0);assert.ok(out.scenarios.some(x=>x.teamBId==='B'));assert.ok(out.scenarios.some(x=>x.teamBId==='C'));assert.equal(out.scenarios.some(x=>x.teamAGives.includes('ak')),false);assert.ok(out.scenarios.every(x=>x.discovery.valueGap<=.2));assert.equal(out.diagnostics.partnerCount,2);
assert.throws(()=>discoverTradeCandidates(input,{teamId:'NOPE'}),/Unknown team/);
console.log('trade-candidate-source-tests: all checks passed');
