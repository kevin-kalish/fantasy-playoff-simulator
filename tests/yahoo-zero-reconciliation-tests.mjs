import assert from 'node:assert/strict';
import {summarizeYahooZeroReconciliation as summarize} from '../src/data/yahoo-zero-reconciliation.js';
const rows=[
  {season:2026,week:5,playerId:'a',position:'RB',actual:0},
  {season:2026,week:5,playerId:'b',position:'WR',actual:0},
  {season:2026,week:5,playerId:'c',position:'TE',actual:12},
  {season:2026,week:5,playerId:'d',position:'QB',actual:null},
  {season:2026,week:5,playerId:'def',position:'DEF',actual:0}
];
const audit={compared:[{season:2026,week:5,yahooPlayerId:'a'}],
  exceptionAudit:{reviewedMatches:[]},
  participationCoverage:{unresolvedRecords:[{season:2026,week:5,yahooPlayerId:'b'}]}};
const result=summarize(rows,audit,2026,5);
assert.equal(result.explicitZero,2);
assert.equal(result.matchedZero,1);
assert.equal(result.unresolvedZero,1);
assert.equal(result.unclassifiedZero,0);
assert.equal(result.missing,1);
assert.equal(result.classificationComplete,true);
assert.equal(summarize(rows,{...audit,compared:[]},2026,5).classificationComplete,false);
assert.equal(summarize(rows,{...audit,participationCoverage:{unresolvedRecords:[...audit.participationCoverage.unresolvedRecords,{season:2026,week:5,yahooPlayerId:'a'}]}},2026,5).classificationComplete,false);
assert.throws(()=>summarize([...rows,rows[0]],audit,2026,5),/Duplicate/);
console.log('yahoo-zero-reconciliation-tests: all checks passed');
