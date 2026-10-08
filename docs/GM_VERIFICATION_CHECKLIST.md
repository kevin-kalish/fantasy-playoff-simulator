# GM recommendation verification checklist

## Automated checks
- Run `npm test` and `npm run test:dashboard`.
- Run `npm run benchmark:gm -- 1000 3`. The benchmark compares the same selected action's championship, playoff and expected-win deltas across full and targeted simulation.
- Confirm a nonzero-effect start/sit fixture changes at least one simulated outcome; check reproducibility at a fixed seed.
- Confirm exact waiver add/drop identity and both trade sides and exchanged player IDs in independent-seed evaluations.
- Review seedStability.requestedReplications and missingReplications: incomplete replication is not corroboration.
- Review whether trade confirmation and counterparty feasibility prevent unsafe recommendations; rejected trades must not be described as actionable.

## Private live-league acceptance test (not safe to run from public CI)
1. Import the current authorized Yahoo league snapshot into a private workspace. Do not commit roster, matchup, or transaction exports.
2. Verify league ID, scoring categories, team count, playoff slots, playoff weeks, tiebreakers, matchup schedule and lineup slot eligibility against Yahoo.
3. Verify every roster's player IDs, current team assignment, injury/bye status and available free agents; flag stale timestamps and duplicate players.
4. Check projection coverage and sources for every remaining week, especially the postseason. Derived long-range projections must keep championship odds labeled PROVISIONAL.
5. Run the league at 50,000 simulations with a fixed seed; repeat with independent seeds and compare championship/playoff odds and the top GM recommendation.
6. Record runtime, scenario counts, missing seed replications, validation warnings and any disagreements. Do not automatically act on trades or waivers.
7. Verify the public dashboard export contains only sanitized fields; no league secrets, OAuth tokens, personal rosters or private source snapshots.

## Release gate
Keep automatic seed replication opt-in until a nonzero-impact realistic fixture, complete trade/waiver targeted integration tests, and a private live-league acceptance run have passed. The synthetic CI benchmark alone cannot establish projection calibration or live-data correctness.
