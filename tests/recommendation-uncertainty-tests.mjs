import assert from 'node:assert/strict';
import {assessRecommendationSignal} from '../src/model/recommendation-uncertainty.js';
for(const [n,d,expected] of [[10000,.08,'POSITIVE_SIGNAL'],[10000,-.08,'NEGATIVE_SIGNAL'],[1000,.01,'INCONCLUSIVE'],[0,.5,'UNAVAILABLE']]) assert.equal(assessRecommendationSignal({simulations:n,championshipDelta:d}).status,expected);
console.log('recommendation-uncertainty-tests: all checks passed');
