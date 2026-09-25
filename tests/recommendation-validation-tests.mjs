import assert from 'node:assert/strict';
import {monteCarloStandardError,summarizeStability,validateRecommendation,validateRecommendationSet} from '../src/model/recommendation-validation.js';

assert.ok(Math.abs(monteCarloStandardError(.5,10000)-.005)<1e-12);
const preview=validateRecommendation({championshipDelta:.04,playoffDelta:.03,winsDelta:.1},{simulations:10000});
assert.equal(preview.confidence,'preview');assert.ok(preview.warnings.some(x=>x.code==='LOW_SIMULATION_COUNT'));
const normal=validateRecommendation({championshipDelta:.04,playoffDelta:.03,winsDelta:.1},{simulations:20000});
assert.equal(normal.confidence,'normal');assert.equal(normal.warnings.length,0);
const large=validateRecommendation({championshipDelta:.2792,playoffDelta:.1046,winsDelta:.46},{simulations:5000});
assert.equal(large.confidence,'review');assert.ok(large.warnings.some(x=>x.code==='LARGE_CHAMPIONSHIP_DELTA'));
const rows=validateRecommendationSet([{championshipDelta:.30,playoffDelta:.21,winsDelta:.5}],{simulations:5000});
assert.equal(rows.length,1);assert.equal(rows[0].validation.confidence,'review');assert.ok(rows[0].validation.warnings.length>=2);
const stable=summarizeStability([.031,.034,.036,.033,.035]);assert.equal(stable.confidence,'high');assert.ok(stable.spread<=.01);
const moderate=summarizeStability([.03,.041,.049,.038,.045]);assert.equal(moderate.confidence,'moderate');
const unstable=summarizeStability([.01,.025,.05,.04,.015]);assert.equal(unstable.confidence,'low');
console.log('recommendation-validation-tests: all checks passed');
