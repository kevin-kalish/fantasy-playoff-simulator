import assert from 'node:assert/strict';
import {assessRecommendationSignal,assessReplicatedRecommendationSignal} from '../src/model/recommendation-uncertainty.js';
for(const [n,d,expected] of [[10000,.08,'POSITIVE_SIGNAL'],[10000,-.08,'NEGATIVE_SIGNAL'],[1000,.01,'INCONCLUSIVE'],[0,.5,'UNAVAILABLE']]) assert.equal(assessRecommendationSignal({simulations:n,championshipDelta:d}).status,expected);
assert.equal(assessReplicatedRecommendationSignal([{simulations:10000,championshipDelta:.08},{simulations:10000,championshipDelta:.09}]).status,'CONSISTENT_POSITIVE');
assert.equal(assessReplicatedRecommendationSignal([{simulations:10000,championshipDelta:.08},{simulations:10000,championshipDelta:.001}]).status,'MIXED_OR_INCONCLUSIVE');
assert.equal(assessReplicatedRecommendationSignal([{simulations:10000,championshipDelta:.08}]).status,'INSUFFICIENT_REPLICATIONS');
console.log('recommendation-uncertainty-tests: all checks passed');
