import assert from 'node:assert/strict';
import {monteCarloStandardError,validateRecommendation,validateRecommendationSet} from '../src/model/recommendation-validation.js';

assert.ok(Math.abs(monteCarloStandardError(.5,10000)-.005)<1e-12);
const normal=validateRecommendation({championshipDelta:.04,playoffDelta:.03,winsDelta:.1},{simulations:10000});
assert.equal(normal.confidence,'normal');assert.equal(normal.warnings.length,0);
const large=validateRecommendation({championshipDelta:.2792,playoffDelta:.1046,winsDelta:.46},{simulations:5000});
assert.equal(large.confidence,'review');assert.ok(large.warnings.some(x=>x.code==='LARGE_CHAMPIONSHIP_DELTA'));
const rows=validateRecommendationSet([{championshipDelta:.30,playoffDelta:.21,winsDelta:.5}],{simulations:5000});
assert.equal(rows.length,1);assert.equal(rows[0].validation.confidence,'review');assert.equal(rows[0].validation.warnings.length,2);
console.log('recommendation-validation-tests: all checks passed');
