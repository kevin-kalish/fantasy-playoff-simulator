### Truncated JerryGM season baseline diagnostics

The cached JerryGM season response may include `truncated: true`, `count`, `total`, `generatedAt`, and `dataThroughWeek`. The weekly run now reports `SEASON SOURCE QUALITY` and `SEASON SOURCE POSITIONS` separately from **roster match coverage**. A 100-of-1,868 provider response is a source limit, not proof of 1,768 failed identity matches. Genuine season baselines are retained where matched; other roster players continue using the existing lower-confidence, recency-weighted weekly horizon. No synthetic projections are counted as provider baselines. The cache remains private, and these diagnostics make no additional API calls or change the simulation model.

### Completed Yahoo results and matchup leverage precision

On a successful audited Yahoo refresh, the weekly workflow requests the previous week's Yahoo scoreboard. It adds a **verified** W/L/T to the matching private playoff-history observation, without changing the original probability or timestamp. Ambiguous or missing winner information leaves the result blank; conflicting results are flagged rather than overwritten. No retrospective forecast backfill occurs. This extra Yahoo scoreboard read does not use projection-provider quota. The history remains private under `data/private/`.

Matchup-impact calculations now support a separate conditional simulation budget, default **1,000** per win/loss scenario, while GM recommendation screening remains at its separately configured budget (typically 250). Set `MATCHUP_IMPACT_SIMULATIONS=500` in PowerShell to reduce runtime, or set `MATCHUP_IMPACT_SIMULATIONS=2000` for higher precision. The schedule impact routine caps its own samples at 2,000. Rankings remain provisional when forecasts are derived or when uncertainty intervals overlap.

### Submitted Yahoo lineup versus optimized hypothetical

If a trusted Yahoo weekly run fails readiness because a submitted lineup has empty starter slots, the weekly command now attempts a **private diagnostic what-if comparison**. The normal report stays blocked. A separate `data/private/lineup-scenario-week-<week>.json` contains paired Monte Carlo forecasts using (1) the actual Yahoo starters, including empty slots, and (2) an optimized eligible lineup **only for teams with incomplete submitted lineups**. Other teams retain their submitted current-week starters. The hypothetical is not a roster transaction, a Yahoo lineup update, or a trusted replacement forecast. The comparison is withheld if the optimized scenario fails readiness or unrelated data-quality errors exist. Set `LINEUP_SCENARIO_COMPARE=false` to disable the optional diagnostic. It uses already loaded projections and makes no extra provider requests. Same-seed simulations are reproducible but not guaranteed to be common-random-number paired at the player level.

# Fantasy Playoff Simulator

Monte Carlo fantasy football analytics application for estimating playoff, seed, matchup, and championship probabilities. Current live development targets a 10-team Yahoo Fantasy Football league with 8 playoff spots.

Live development site: https://kevin-kalish.github.io/fantasy-playoff-simulator/

## View the dashboard locally (October 2026)

The current read-only live-report dashboard is available as a **private, offline HTML preview**. It is **not** the same as the public GitHub Pages synthetic demo. No browser server or API keys are needed for the synthetic preview.

### Try it immediately with synthetic data

From the repository root in PowerShell:

```powershell
git pull --ff-only origin dashboard-contract-v1
npm run dashboard:demo
Start-Process .\\data\\private\\synthetic-dashboard-preview.html
```

The **Playoff probability history** tab shows example Week 0–6 changes, including a loss from 80% to 60% followed by a win to 75%. These values are illustrative, not actual historical estimates. The chart labels completed games W/L/T and reveals week, playoff probability, result, and week-over-week percentage-point change when a marker is hovered or focused with the keyboard. The command generates a synthetic 10-team league preview at `data/private/synthetic-dashboard-preview.html`. The fixture includes a playoff race, current matchup, remaining schedule, playoff/championship leverage rankings, GM rejection diagnostics, and provisional postseason estimates. It is **demonstration data, not current Yahoo standings or live recommendations**. Use the section links to navigate, select a team in the playoff race, and switch the remaining schedule between chronological and impact order.

### Refresh Yahoo and the private dashboard together

Run the normal live workflow from the repository root (requires working Yahoo OAuth, a passing live reconciliation audit, and usable projection data):

```powershell
npm run fightin-kali:weekly
Start-Process .\\data\\private\\live-dashboard-preview.html
```

After an audited, readiness-passing weekly simulation writes its private report, the workflow now **automatically rebuilds** `data/private/live-dashboard-preview.html` from that report. It incorporates any compatible archived playoff-probability history. This preview is local/offline, never deployed to GitHub Pages, and does not expose Yahoo OAuth tokens or projection-provider API keys. The preview is withheld if the report is untrusted, the output path is outside `data/private/`, or archived history has a mismatched team/league/season. Set `DASHBOARD_AUTO_PREVIEW=false` to opt out; set `PLAYOFF_HISTORY_CAPTURE=false` separately to opt out of weekly snapshot recording.

If Yahoo credentials or the source audit fail, the live workflow stops rather than using a stale league snapshot. If the projection provider is unavailable or readiness fails, the dashboard is **not** refreshed. The synthetic demo remains available independently via `npm run dashboard:demo`. A successful local test suite alone does not confirm Yahoo connectivity or current projection access.

### Record real week-to-week playoff probability

After each fantasy week is **complete**, save the trusted weekly report's playoff probability to a local archive. Specify the completed week and its result explicitly:

```powershell
npm run dashboard:record-week -- data/private/YOUR-WEEKLY-REPORT.json 1 L
npm run dashboard:record-week -- data/private/NEXT-WEEKLY-REPORT.json 2 W
```

A Week 0 preseason snapshot is optional; record it with `0` and no result. These commands require `readiness.ready=true`, a trusted report, and input under `data/private/`. They do not fetch data. Each completed week can be recorded **once**; the command refuses silent overwrites. The archive is `data/private/playoff-probability-history.json`, which is private and must never be committed. When `dashboard:preview` runs for the same team, it automatically includes these archived snapshots in the history tab. The latest weekly report by itself **cannot reconstruct earlier weeks**. Historical points are recorded forecasts, not retrospective recomputations or observed playoff outcomes. Preserve the original report's generated timestamp and only label a point as a completed week when it truly is post-game.

### Automatic post-week capture (audited Yahoo runs)

A normal `npm run fightin-kali:weekly` run now records the focus team's playoff probability **after the previous week** when Yahoo's current week is at least 2, the Yahoo source audit passes for that week, the simulation report is trusted and readiness-passing, and a private report output path is configured. For example, a trusted run during Yahoo Week 7 records the probability as the **Week 6** snapshot. The result is initially left blank (not guessed). The capture is offline after the report is built, makes no additional provider requests, and never rewrites an existing week. Set `PLAYOFF_HISTORY_CAPTURE=false` to disable this behavior.

Automatic capture stores season and Yahoo league identity in `data/private/playoff-probability-history.json`; if an older manually created archive lacks those fields, capture refuses to append rather than silently mix histories. Keep the legacy file as a backup and resolve its provenance before creating a new season-scoped archive. **Do not retroactively label a current forecast as a prior week's forecast.** Existing records and their timestamps are preserved. The private preview loads the same archive. The history chart is a record of model forecasts, not a reconstruction of historical odds.

### Preview a real, locally generated weekly report

Only after an existing **trusted, readiness-passing** private weekly report is available:

```powershell
npm run dashboard:preview -- data/private/YOUR-WEEKLY-REPORT.json
Start-Process .\\data\\private\\live-dashboard-preview.html
```

Replace `YOUR-WEEKLY-REPORT.json` with the actual private report filename. The preview command expects an input JSON document with `readiness.ready === true` and a trusted schema-v11 report, either directly or under `report`; it fails closed otherwise. It does **not** fetch new Yahoo or projection-provider data. The HTML output is restricted to `data/private/` and must **never** be committed, uploaded to GitHub Pages, or shared publicly. The preview is read-only: GM candidates and rejected near misses are not actionable recommendations.

### Validate

```powershell
npm run test:dashboard
npm test
```

The tests also cover automatic history capture, immutable weekly snapshots, league/season identity, and readiness/trust refusal. The tests cover the export allowlist, escaping/private HTML generation, a synthetic 10-team end-to-end report, provisional championship estimates, missing projection data, and renderer behavior. Deterministic delegated-event tests now cover tab switching, team selection, chronological/impact schedule ordering, keyboard activation, and history hover/focus details. Manual browser acceptance remains necessary for layout, pointer hit targets, and accessibility behavior in real browsers. Projection-provider freshness and historical calibration are separate readiness requirements; passing UI tests does not prove forecast accuracy.

## Current status

The project has a working weekly intelligence pipeline for **The Fightin' Kali** with live Yahoo Fantasy Sports integration. Yahoo OAuth/API access is now operational and the weekly workflow refreshes league standings, remaining schedule, rosters, and current lineups before analysis. Yahoo is also the live waiver source. JerryGM supplies weekly player projections.

The live Yahoo reconciliation audit validates league structure, dynamic standings/state, playoff settings, historical points reconciliation, roster population, current lineups, and week-specific lineups before the data is trusted for production analysis. The Week 5 live audit passes all reconciliation and roster-completeness checks.

Projection horizon is intentionally explicit:

- **Direct horizon** — JerryGM week-specific projections for the available three-week window.
- **Derived regular-season horizon** — later weeks use a recency-weighted player-strength estimate derived from the direct JerryGM window, with known bye weeks respected and transient weekly injury designations not projected indefinitely.
- **Derived postseason horizon** — playoff-week projections currently use the same long-range method. Championship probabilities are therefore marked **PROVISIONAL** until dedicated playoff-week projections are available.
- Completed weeks are represented by actual standings and are not simulated again. Structural validation verifies the remaining schedule before Monte Carlo begins.

## Current capabilities

- Live Yahoo OAuth/API integration for league discovery, settings, standings, schedule, rosters, current/week-specific lineups, and waiver candidates.
- Yahoo reference reconciliation/audit gate before live league state is trusted.
- Custom Yahoo scoring, including half-PPR and passing/rushing/receiving yardage bonuses.
- Seeded, reproducible Monte Carlo season simulation with player volatility, availability, NFL-game correlation, and horizon uncertainty.
- Full remaining regular-season simulation, standings, seed distributions, playoff qualification, playoff bracket/reseeding, and championship probability.
- Weekly matchup win probability, playoff leverage/urgency, start-sit and GM recommendation infrastructure, and scenario analysis.
- Automated waiver and trade candidate discovery with broad scenario screening followed by higher-simulation confirmation of promising actions. Trade discovery uses league-wide, waiver-aware replacement levels, normalized VORP, position-relative roster needs, bilateral roster fit, package/consolidation costs, and a deterministic value prefilter before Monte Carlo evaluation.
- Weekly league-intelligence report with current record/seed, projection trust, direct-vs-derived projection horizon, remaining-game counts, playoff/title probabilities, and league-wide Monte Carlo outlook.
- JerryGM live weekly projection adapter with targeted player batching for Free-tier limits.
- Interactive synthetic 10-team dashboard with team/week drill-down.
- Single-game and multi-game what-if scenarios, rooting interests, and remaining-schedule-strength analysis.
- Historical-stat ingestion, player-ID reconciliation, dataset manifests/readiness gates, and leakage-safe rolling-season backtesting.
- CSV/JSON historical-data adapters plus nflverse actual-stat and FantasyPros projection adapters.
- Historical data-source governance so technically accessible data is not automatically treated as approved for calibration/redistribution.
- Point-forecast metrics plus predictive-distribution coverage/tail calibration, Brier/log loss/ECE, and Monte Carlo convergence diagnostics.
- Precompiled deterministic scoring inputs for substantially faster Monte Carlo execution.
- Dependency-free automated validation suite.

## Architecture

The simulation core is provider-independent. External services feed normalized internal objects rather than being embedded in simulation logic. Provider-specific historical datasets pass through adapters into one canonical observation contract. The browser UI is separate from model/scenario calculations so live league data can replace demo data without rewriting the model.

### Data providers

- **Yahoo Fantasy Sports** — live source of truth for league settings, standings, teams, rosters, fantasy schedule, lineups, and waiver availability. OAuth refresh-token authentication and league discovery are operational. Live responses are normalized and checked by the Yahoo audit/reconciliation layer before use.
- **JerryGM Projections API** — current primary live projection source. The Free API tier returns only the top 100 players for an untargeted all-active request, but supports up to 25 specifically named players per request. The adapter therefore batches targeted roster requests in groups of 25. Weekly refresh now passes league roster and waiver names into JerryGM and prioritizes this live targeted retrieval over an existing cached top-100 projection file; the cache remains a fallback when live retrieval is unavailable. JerryGM also exposes season projections when `week` is omitted; evaluating that season-level output remains a projection-quality task.
- **FantasyPros** — projection adapter exists; access is not currently the primary live path. Historical weekly projection pages remain a research candidate, not an approved stored calibration dataset.
- **nflverse** — primary historical actual-stat source and NFL data foundation. Target-league fantasy points are calculated locally from underlying stats.
- **Ranking archives** — identity/ranking context only; rankings are never substituted for point projections.

See `docs/DATA_SOURCES.md` for source status/governance and `docs/HISTORICAL_DATA.md` for the historical-data contract.

### Core modules

- `src/scoring.js` — custom fantasy scoring engine.
- `src/league-config.js` — league configuration.
- `src/lineup.js` and `src/model/lineup-optimizer.js` — projected legal-lineup optimization with FLEX support.
- `src/projections.js` — projection-provider interface/adapters.
- `src/data/yahoo-client.js`, `src/data/yahoo-auth-session.js`, and `src/data/yahoo-league.js` — Yahoo authentication, league discovery, and live-state normalization.
- `src/data/yahoo-live-audit.js` — live Yahoo reconciliation and roster/lineup completeness gate.
- `src/data/yahoo-waivers.js` — live waiver pool and add/drop prescreening.
- `src/data/jerrygm.js` — JerryGM API client, normalization, and targeted batching.
- `src/model/league-preparation.js` — direct projection enrichment, recency-weighted long-range projection construction, lineup preparation, and simulation input assembly.
- `src/simulator.js` — optimized Monte Carlo engine with structural validation and selectable model variants.
- `src/standings.js` / `src/playoffs.js` / `src/scenarios.js` — standings, postseason, and scenario logic.
- `src/model/league-intelligence-report.js` / `src/model/weekly-intelligence-format.js` — weekly decision report and trust/projection-horizon diagnostics.
- `src/variance.js` / `src/calibration.js` — historical volatility and leakage-safe rolling features.
- `src/data/*` — historical contracts, provider adapters, ID mapping, manifests, readiness, and source governance.
- `src/model/experiment.js` / `src/model/season-backtest.js` — point-model experiments and rolling evaluation.
- `src/model/distribution-backtest.js` — predictive interval coverage/tail calibration for stochastic model variants.
- `src/model/nfl-games.js` / `src/model/correlation.js` — NFL-game identity and shared stochastic factors.
- `src/model/availability.js` / `src/model/convergence.js` — availability and simulation precision.
- `src/ui/*` — isolated UI state, analysis, and renderers.

## Weekly workflow

From the repository root:

```bash
npm test
npm run audit:yahoo
npm run fightin-kali:weekly
```

The Yahoo audit is the explicit reconciliation gate. The weekly command does not require an existing local snapshot: with valid OAuth credentials it discovers the current fantasy week from Yahoo league metadata and bootstraps the private snapshot from Yahoo. Set `WEEK` or pass a week argument only to deliberately override the API week. If Yahoo authentication, API refresh, or reconciliation fails, the weekly command stops rather than silently simulating stale data. The weekly command then refreshes live Yahoo standings, remaining schedule, rosters, and lineups; persists the refreshed working snapshot; obtains the live waiver pool and configured projection source; builds direct and derived weekly lineups; applies readiness/trust gates; runs Monte Carlo and scenario analyses; and writes the weekly intelligence report under `data/private/`.

The recommendation pipeline uses a two-stage simulation strategy: broad candidate scenarios are screened cheaply, while promising actions are rerun at higher simulation counts before being surfaced as recommendations. Trade discovery currently values players from league-wide replacement levels and VORP, incorporates the live waiver pool when setting replacement baselines, and scores marginal positional need against league positional medians. The current Week 5 live benchmark evaluates 24 prefiltered trade scenarios inside an approximately 19-second end-to-end weekly run. No trade is published without clearing the final recommendation/confirmation gates.

Environment credentials are intentionally kept outside source control. Current local development uses `JERRYGM_API_KEY` plus Yahoo OAuth configuration/token material. Secrets and access/refresh tokens must remain outside the repository.

## Historical data contract

Minimum required fields are `season`, `week`, `playerId`, `position`, `projection`, and `actual`. NFL team, opponent, status, name, CV, and source are optional but strongly preferred. Historical projections must be genuine pre-game values. The evaluation pipeline separates earlier seasons from each test season to prevent future information from leaking into calibration.

## Model philosophy

1. **Projection establishes expected performance.**
2. **Historical results estimate uncertainty**, with player estimates shrunk toward position priors when samples are small.
3. **Distribution quality matters separately from mean accuracy.** Adding volatility does not inherently improve a projection's mean; it must improve interval coverage, tails, matchup probabilities, or downstream playoff calibration.
4. **Availability is stochastic when appropriate** and zero on known byes; transient current-week injury labels are not assumed to persist for the rest of the season.
5. **Shared NFL-game factors create correlated outcomes** rather than correlating fantasy opponents simply because they face each other.
6. **Distant weeks carry more uncertainty** than the immediate week.
7. **Direct provider projections and derived long-range projections are tracked separately.** Long-range estimates should be replaced by direct weekly information as it becomes available.
8. **Matchup effects remain modest until backtesting demonstrates predictive value.**
9. **Underlying-stat simulation is the long-term target**, because threshold bonuses make yardage/TD distribution shape important.

Current correlation coefficients, injury play probabilities, and long-range recency decay are development priors, not fully calibrated estimates.

## Validation

Run:

```bash
npm test
npm run audit:yahoo
```

The automated suite covers scoring, seeded randomness, schemas, standings/tiebreaks, availability/byes, playoff advancement, deterministic season simulation, NFL-game identity, forecast metrics, model variants, predictive-distribution calibration, historical ingestion/folds, rolling backtests, CSV/JSON imports, provider adapters, dataset readiness, source governance, current-state capture, weekly projection enrichment, lineup optimization, simulation readiness/trust, scenario analysis, recommendation screening/confirmation, Yahoo normalization, Yahoo waiver parsing, and GM recommendation logic.

The live Yahoo audit separately verifies reference/dynamic league state, playoff configuration, historical point reconciliation, roster population, and current/week-specific lineups. The simulator also validates season structure before running: team IDs must be unique, scheduled teams must exist, self-matchups and duplicate same-week appearances are rejected, playoff-team counts must be valid, and remaining games are counted explicitly.

## Current trade-model work

The current `league-replacement-vorp` branch is the active trade-discovery hardening pass. Completed work includes league-wide replacement levels, waiver-aware replacement baselines, normalized cross-position VORP, full-roster need calculation before candidate truncation, position-relative league need benchmarks, duplicate-position package-need protection, bilateral roster-fit scoring, value-gap prefiltering, and diagnostic decomposition of value/need/surplus components. The Week 5 benchmark now surfaces substantially more plausible candidates and no longer promotes obviously imbalanced QB-for-elite-WR examples into the top diagnostic set.

Trade-model hardening for this phase is complete. Net roster need is calculated from the complete post-trade roster, so incoming positional gains are offset by strength lost with outgoing players. Deterministic regressions cover league replacement/scarcity, waiver-aware replacement, net roster need, and replacement-level QB versus elite-WR valuation. The Week 5 acceptance benchmark generated 382 trade scenarios, evaluated 24 after the value prefilter, removed the earlier replacement-QB-for-elite-WR pathology, and completed the full weekly run in about 19 seconds. Further coefficient calibration should be driven by broader historical/live validation rather than tuning against one weekly snapshot.

## Front-end readiness

The public GitHub Pages browser UI remains a synthetic/demo dashboard. Separately, a private read-only live-report dashboard now supports a stable schema-v1 export, local offline HTML preview, 10-team synthetic acceptance coverage, section navigation, schedule ordering, team detail, matchup and leverage analysis, and GM diagnostics subject to the publication gate. The private localhost server now exposes the refreshed Yahoo/weekly report through a browser-facing contract and supports browser-initiated refresh with safe failure recovery. Remaining UI acceptance is a manual trust-label and live team/week drill-down audit; this is not an internet-hosted production service.

## October 16, 2026 handoff — Milestone A to Milestone B

**Milestone A: provisionally accepted for single-user, localhost-only Yahoo private beta.** The user confirmed browser refresh, dashboard opening, and all four provider-free browser failure/retry checks. Following the security logging fix (commit `c759c85`), the local Windows run of `npm test` completed successfully through `production-readiness-review-tests` (110 suites), including private-dashboard server and refresh tests. `git ls-files data/private` and `git ls-files .env` returned no tracked files. The public GitHub Pages experience remains synthetic only.

**Explicitly not yet signed off:** manual restart/session-token rotation, browser Network inspection for third-party requests, complete visual audit of provisional forecast/trust labels, and final operational release rehearsal. These are documented in [Milestone A acceptance](docs/PRIVATE_BETA_MILESTONE_A.md); do not treat provisional acceptance as unrestricted production security approval.

**How to resume locally:** checkout/pull `dashboard-contract-v1`, run `npm test`, then `npm run dashboard:private`. Open only the generated localhost session URL; never share the token or publish `data/private/`. The separate provider-free failure harness is `node scripts/accept-private-dashboard-failure.mjs`. A real browser refresh may contact Yahoo and the projection provider; the failure harness does not.

**Milestone B (next work session, October 17 or 19): Projection quality and calibration.** Start by auditing current direct JerryGM versus derived long-range coverage, observation-time/freshness provenance, historical pregame data eligibility, and championship forecast limitations. Define measurable calibration/validation baselines and acceptance criteria before changing model coefficients. Then prioritize long-range mean forecasts, horizon-dependent uncertainty, and playoff-probability calibration. Preserve trust/publication gates, read-only Yahoo behavior, and synthetic-only public demo. Do not assume missing historical projection archives can be reconstructed without leakage.

## Milestone B — active (October 19, 2026)

Projection quality and calibration work has begun with a **baseline/evidence audit**, not a parameter change. See [Milestone B plan and acceptance criteria](docs/MILESTONE_B_PROJECTION_CALIBRATION.md). Next deliverable: a read-only local diagnostic for eligible pregame archives, forecast accuracy, source freshness, and long-range coverage. Existing private-beta security and publication gates remain in force.

## Development roadmap

1. **Harden end-to-end live-state integration.** Add deterministic tests proving that Yahoo standings/roster/lineup changes propagate through weekly preparation and GM recommendations, including a tested fallback path when Yahoo is unavailable.
2. **Improve the long-range projection model.** Evaluate JerryGM's season-level projection output and richer response fields before adding additional home-grown adjustments. Separate underlying player strength from week-specific matchup/opportunity effects where available data supports it.
3. **Validate identifiers and live provider coverage.** Prefer stable player IDs over name matching, retain targeted JerryGM batching where Free-tier limits require it, and surface unresolved identities as explicit data-quality failures rather than silently degrading recommendations.
4. **Calibrate long-range uncertainty.** Make confidence degradation with forecast horizon explicit and test whether stochastic widening is calibrated historically.
5. **Expand historical validation.** Join approved historical projections to nflverse actuals and evaluate volatility, availability, correlation, matchup effects, and downstream playoff probabilities.
6. **Add underlying-stat simulation** for passing/rushing/receiving and threshold bonuses where it materially improves calibration.
7. **Productionize weekly operation.** Reduce manual environment/setup steps, improve diagnostics, and make one-command weekly refresh/audit/report generation reliable while preserving explicit safety gates.

## Important status note

The application is a development prototype. The live league pipeline now uses Yahoo API data for current league state and Yahoo waiver availability plus live JerryGM projections. Long-range and postseason forecasts still contain derived model inputs. Playoff probabilities should be treated as developmental forecasts, and championship probabilities remain explicitly provisional until dedicated playoff-week projections are available and the broader model is historically calibrated.


### Optional GM seed-stability diagnostic

`buildWeeklyGMRecommendations(input, spec, {replicateTopRecommendationSeeds: 1})` checks the top eligible action with one additional independent random seed (maximum two additional seeds). Each repeat simulates a fresh baseline and **only the selected start/sit, waiver, or trade scenario**, rather than rescanning the whole GM candidate set. The option is disabled by default. The returned top recommendation includes `seedStability` with `status`, `replications`, `requestedReplications`, and `missingReplications`; `diagnostics.timing.seedReplicationSeconds` measures extra wall-clock time. A missing replication does not count as evidence of agreement. These results are independent-seed sensitivity checks, **not** calibrated confidence intervals or a substitute for projection quality and trade feasibility review. The private intelligence panel may display the result; it is not exported to the public live dashboard.

The synthetic GM performance comparison can be run with `npm run benchmark:gm -- 1000 3` (1000 simulations, three repeated timing comparisons). GitHub Actions checks both 100- and 1000-simulation variants. Timings are diagnostics rather than pass/fail speedup targets; the comparison does require equal selected-action championship deltas and complete integrated seed replication. Automatic verification remains opt-in while runtime and nonzero-impact fixtures are evaluated.

### Yahoo unmatched diagnostics: individual versus DEF (October 2026)

Run `npm run calibration:unmatched` with private Yahoo and nflverse actuals and a verified kickoff schedule. The private JSON report retains the existing `unmatched`, `reasons`, and `details` fields, and additionally reports `individualUnmatched`, `defenseUnmatched`, `defenseNonzero`, and `individualReasons`. Position `DEF` is separated from individual-player identity diagnostics; the original total remains unchanged. A missing, empty, or invalid DEF score is not counted as nonzero and remains in the unmatched details for review. This is a diagnostic breakdown only: it does not validate DST scoring, reconcile identities, relax participation/scoring gates, or establish calibration eligibility. The separate cross-provider scoring audit continues to exclude defenses from its individual comparison and requires independent DST verification.

### Private cross-provider participation audit

`npm run calibration:cross-provider-scores` writes
`data/private/yahoo-nflverse-score-audit.json`.

The `participationCoverage` object retains its summary fields and
adds `unresolvedRecords`, containing individual player-week
classifications and accepted participation evidence.

This is private diagnostic output, not proof of scoring parity or
calibration eligibility. Unmatched nonzero records continue blocking
scoring parity, and DST scoring requires independent verification.


### Verified schedule-backed Yahoo bye classification

The private cross-provider audit optionally reads `data/private/nfl-kickoffs.csv` and week-specific `data/private/kickoff-verification-week-<week>.json` evidence. It checks the independently compared nflverse reference, exact local file SHA-256, season/week, game counts, distinct teams and complete 32-team season universe before classifying unmatched zero-point players from absent teams as `scheduled-bye`. Missing, conflicting or altered evidence fails closed to `unverified`. Historical schedule verification does not use the 48-hour *live kickoff* freshness limit; live readiness checks are unchanged. Preserve the existing default Week 6 verification file. Bye classification is explanatory only: it does not establish statistical matches, scoring parity, participation coverage completeness or calibration eligibility. All private schedules and evidence remain under `data/private/` and must not be committed.


### Provisional completed-actuals reporting

The private cross-provider scoring audit now includes `actualsReadiness.weeks` with schedule-based statuses: `provisional-five-day-buffer` while any scheduled kickoff is less than five days old, `provisional-source-incomplete` when the buffer has elapsed but scheduled teams are missing from nflverse actuals, `unverified-schedule` if schedule coverage cannot be established, and `team-coverage-ready` only after all scheduled teams are represented. These are diagnostic labels, not independent verification of player completeness. The existing scoring-parity and participation gates remain unchanged, and unresolved nonzero Yahoo rows are never removed. The audit does not refresh or overwrite private actuals or historical forecasts. `calibration:fetch-actuals` rewrites its private output; back up and review before invoking it.


### Complete-dashboard acceptance gate

`npm run review:readiness -- data/private/<report>.json` now fails complete-dashboard acceptance when the intelligence report has no valid `remainingSchedule` entries, and warns when any scheduled game lacks finite conditional playoff leverage (`playoffImpact.swing`). This is intentionally stricter than simulation readiness: an older trusted report may be useful for probabilities but is not a complete schedule/leverage demo. It does not synthesize schedule or impact data, change historical archives, or weaken existing trust checks. A warning alone does not constitute live browser acceptance.


### Provider-neutral league contract checkpoint (October 2026)

Run `node tests/league-snapshot-tests.mjs` to exercise the shared V1 normalization boundary for both `yahoo` and `espn` provider labels, including team identity, lineup slots, playoff fields, and rejection of missing, unknown-team, self-opponent, or duplicate-participation schedules. These tests use constructed data, **not an ESPN adapter or live ESPN evidence**. The normalization layer still defaults missing playoff settings and projections; any future ESPN adapter must verify provider scoring, schedule coverage, roster identity, lineup assignments, and settings independently before passing readiness. The October 27 ESPN decision remains conditional on source-backed adapter and scoring parity evidence. Yahoo remains the private-beta priority.


### Historical dashboard schedule compatibility

The live-dashboard exporter now labels a missing `report.remainingSchedule` as `scheduleDataStatus: unavailable-in-report`. The renderer explicitly says historical schedule and conditional leverage were unavailable instead of implying there are no future games. Reports containing `remainingSchedule` retain their existing schedule and leverage rendering. This is display-only compatibility; it does **not** reconstruct historical forecasts, infer leverage from top-level strategy fields, or relax the complete-dashboard readiness gate. A fresh source-backed report with conditional matchup estimates is still required for full private-beta acceptance.

### Provider-free schedule and leverage integration regression

`node tests/league-intelligence-report-tests.mjs` includes a synthetic eight-week (weeks 7–14) report-to-dashboard integration scenario. It checks that the report builder emits one conditional matchup impact per remaining week, that the dashboard exporter preserves all eight, and that the renderer displays the schedule and leverage panels with provisional championship labeling. The fixture is **not** evidence of Yahoo/ESPN scoring parity, live projection quality, or a historical pregame forecast. It performs no provider requests and does not write to `data/private/`.

### Yahoo scoring evidence: yardage bonus confirmation

`npm run calibration:review-scoring` no longer claims `bonusConfirmed: true` without independent evidence. The evidence review reports `yardage-bonus-not-confirmed` until an explicit verified source and corresponding review workflow are implemented. This is a conservative diagnostic correction only: it does not alter league scoring, player actuals, identity matching, the capture gate, or historical forecasts. Scoring parity and participation remain separate unresolved acceptance requirements.

### Week-level Yahoo reconciliation diagnostics

`npm run calibration:cross-provider-scores` now prints `UNRESOLVED BY WEEK` and writes `participationCoverage.unresolvedByWeek` to the existing private `data/private/yahoo-nflverse-score-audit.json`. Each row includes source readiness, unmatched nonzero/zero counts, and unverified participation counts. Provisional weeks remain included in all overall failure totals; this breakdown is **diagnostic only**, not a waiver, verified participation record, scoring parity approval, or calibration gate. The command may exit 2 while unresolved records remain.

### Private Yahoo zero-point participation triage

After `npm run calibration:cross-provider-scores`, run `npm run calibration:participation-queue` to create `data/private/yahoo-participation-review-queue.json`. The queue selects only unverified zero-point Yahoo individual records from 2026 weeks 1–5 and labels whether the player's team appears in the local kickoff schedule, alongside the week-level actuals readiness. This schedule classification **does not** prove individual participation or establish a verified bye; no scoring, identity override, evidence, or immutable archive is changed. Keep this private JSON out of public commits. `node tests/yahoo-participation-review-queue-tests.mjs` checks filtering, ordering, and conservative classifications.

The private queue uses the same established NFL team-code aliases as Yahoo unmatched diagnostics (including Yahoo `LAR` versus nflverse schedule `LA`). This corrects schedule classification only: a scheduled team is **not** proof that a player participated, and every unresolved player remains unverified until supported by independent evidence.

The queue now includes `reviewPriority` (`first` for Week 5 WR/RB, `second` for Week 4 WR/RB, otherwise `later`), `evidenceChecklist`, and aggregate `summary.priorityCounts`. These are workflow aids, not new accepted evidence. The reviewer must independently confirm the player, season/week, documented participation status, source HTTPS URL, and review date before using the existing validated evidence process. Never commit the private queue or infer player activity from team schedule presence.

### Private Week 5 Yahoo zero-score reconciliation

Run `npm run calibration:review-zeros` after `calibration:cross-provider-scores`. It reads existing private Yahoo actuals and audit JSON and prints only aggregate counts: explicit zero, missing, matched-zero, unresolved-zero, unclassified-zero and overlap. It exits nonzero on missing scores or incomplete classification; it does not write files or change evidence, identity, scores, calibration, or historical forecasts. `node tests/yahoo-zero-reconciliation-tests.mjs` uses synthetic rows. An audit match is not independent proof of participation or live scoring accuracy.

The private participation queue is sorted by review priority first (`first`, `second`, `later`), then descending week and stable position/player ID. Regenerate it with `npm run calibration:participation-queue` after pulling. This changes review presentation only, not participation evidence or scoring gates.
