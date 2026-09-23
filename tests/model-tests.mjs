import assert from 'node:assert/strict';
import {scoreOffense,scoreKicker,scoreDefense} from '../src/scoring.js';
import {createSeededRng} from '../src/random.js';
import {validateLeague} from '../src/model/schema.js';
import {probabilitySE,recommendedSimulations} from '../src/model/convergence.js';

assert.equal(scoreOffense({passYds:300,passTD:2}),25); // 12 yards + 8 TD + 5 bonus
assert.equal(scoreOffense({rushYds:100,rushTD:1}),21); // 10 + 6 + 5 bonus
assert.equal(scoreOffense({receptions:8,recYds:100,recTD:1}),25); // 4 + 10 + 6 + 5
assert.equal(scoreKicker({fg40_49:1,fg50plus:1,xpMade:2}),11);
assert.equal(scoreDefense({pointsAllowed:0}),10);
assert.equal(scoreDefense({pointsAllowed:35}),-4);
const a=createSeededRng(123),b=createSeededRng(123);for(let i=0;i<20;i++)assert.equal(a(),b());
assert.equal(validateLeague({teams:[{id:1},{id:2}],schedule:[],playoffSpots:1}).valid,true);
assert.ok(probabilitySE(.5,10000)<.006);
assert.ok(recommendedSimulations({targetMargin:.01})>=9000);
console.log('model-tests: all checks passed');
