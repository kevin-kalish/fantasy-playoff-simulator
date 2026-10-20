import assert from 'node:assert/strict';
import { aggregateNflversePbpDST } from '../src/data/nflverse-pbp-dst.js';
import { reconcileYahooDstScores } from '../src/data/yahoo-dst-score-reconciliation.js';

const play = {
  season: 2026, week: 3, season_type: 'REG',
  home_team: 'JAX', away_team: 'NE',
  posteam: 'NE', defteam: 'JAX'
};

const official = {
  season: 2026, week: 3, team: 'JAX',
  def_sacks: 0, def_fumbles: 99,
  fumble_recovery_opp: 2
};

const dst = aggregateNflversePbpDST(
  [{ ...play, sack: 1 }],
  { teamStats: [official] }
);

const jax = dst.find(row => row.team === 'JAX');

assert.ok(jax);
assert.equal(jax.sacks, 1);
assert.equal(jax.componentSource.sacks, 'pbp');
assert.equal(jax.fumbleRecoveries, 2);
assert.equal(jax.componentSource.fumbleRecoveries, 'official-team');

const yahoo = (team, week, actual, overrides = {}) => ({
  season: 2026,
  week,
  position: 'DEF',
  nflTeam: team,
  actual,
  ...overrides
});

const base = yahoo('JAX', 3, jax.actual);
const bye = yahoo('KC', 5, 0);

const options = {
  verifiedByeWeeks: [{ season: 2026, week: 5, team: 'KC' }]
};

const matched = reconcileYahooDstScores(
  [base, bye], dst, options
);

assert.equal(matched.pass, true);
assert.equal(matched.summary.compared, 1);
assert.equal(matched.summary.unmatched, 0);
assert.equal(matched.summary.mismatches, 0);
assert.equal(matched.calibrationEligible, false);
assert.equal(matched.verifiedByes?.length, 1);

const unverified = reconcileYahooDstScores([base, bye], dst);
assert.equal(unverified.pass, false);
assert.equal(unverified.summary.unmatched, 1);

const nonzeroBye = reconcileYahooDstScores(
  [base, yahoo('KC', 5, 1)], dst, options
);
assert.equal(nonzeroBye.pass, false);
assert.equal(nonzeroBye.summary.unmatched, 1);

const duplicateYahoo = reconcileYahooDstScores([base, base], dst);
assert.equal(duplicateYahoo.pass, false);
assert.equal(duplicateYahoo.summary.ambiguous, 1);
assert.equal(
  duplicateYahoo.ambiguous[0].reason,
  'duplicate-yahoo-team-week'
);

const duplicateDst = reconcileYahooDstScores(
  [base], [...dst, jax]
);
assert.equal(duplicateDst.pass, false);
assert.equal(duplicateDst.summary.ambiguous, 1);
assert.equal(
  duplicateDst.ambiguous[0].reason,
  'duplicate-dst-team-week'
);

const invalid = reconcileYahooDstScores(
  [yahoo('JAX', 3, 'not-a-number')], dst
);
assert.equal(invalid.pass, false);
assert.equal(invalid.unmatched[0].reason, 'invalid-score');

const mismatch = reconcileYahooDstScores(
  [yahoo('JAX', 3, jax.actual + 1)], dst
);
assert.equal(mismatch.pass, false);
assert.equal(mismatch.summary.mismatches, 1);

const byeOnly = reconcileYahooDstScores([bye], [], options);
assert.equal(byeOnly.pass, false);

console.log('yahoo-dst-regression-tests: all checks passed');