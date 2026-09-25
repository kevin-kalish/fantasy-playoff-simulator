import assert from 'node:assert/strict';
import {classifyRecommendationTrust,finalizeRecommendationTrust} from '../src/model/recommendation-trust.js';

const base={type:'waiver',details:{addPlayerId:'FA1',dropPlayerId:'P1'},validation:{confidence:'review',warnings:[{code:'LOW_SIMULATION_COUNT',message:'preview'},{code:'LARGE_CHAMPIONSHIP_DELTA',message:'large'}]},confirmation:{simulationsPerSeed:20000,seeds:[101,202,303],samples:[{seed:101},{seed:202},{seed:303}],stability:{confidence:'high',min:.271,max:.277,spread:.006},directionConsistent:true}};
const trust=classifyRecommendationTrust(base);
assert.equal(trust.status,'CONFIRMED_HIGH');
assert.equal(trust.simulationConfidence,'high');
assert.equal(trust.inputSanity,'review');
assert.equal(trust.sanityWarnings.length,1);
const final=finalizeRecommendationTrust(base,{input:{simulations:5000,seed:9,modelVariant:'correlated',metadata:{source:{provider:'fixture'}}},spec:{teamId:'T2',week:11,waivers:{weeks:[11,12,13]}}});
assert.deepEqual(final.provenance.affectedPlayerIds,['FA1','P1']);
assert.equal(final.provenance.preview.simulations,5000);
assert.equal(final.provenance.confirmation.totalSimulations,60000);
assert.equal(final.provenance.projectionSource,'fixture');
const mixed=classifyRecommendationTrust({...base,confirmation:{...base.confirmation,directionConsistent:false}});
assert.equal(mixed.status,'LOW_CONFIDENCE');
console.log('recommendation-trust-tests: all checks passed');
