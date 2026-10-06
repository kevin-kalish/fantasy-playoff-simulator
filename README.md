# Fantasy Playoff Simulator

Monte Carlo fantasy football analytics application for estimating playoff, seed, matchup, and championship probabilities. Current live development targets a 10-team Yahoo Fantasy Football league with 8 playoff spots.

Live development site: https://kevin-kalish.github.io/fantasy-playoff-simulator/

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
- Automated waiver and trade candidate discovery with broad scenario screening followed by higher-simulation confirmation of promising actions.
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
- **JerryGM Projections API** — current primary live projection source. The Free API tier returns only the top 100 players for an untargeted all-active request, but supports up to 25 specifically named players per request. The adapter therefore batches targeted roster requests in groups of 25. JerryGM also exposes season projections when `week` is omitted; evaluating that season-level output remains a projection-quality task.
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

The Yahoo audit is the explicit reconciliation gate. The weekly command then refreshes live Yahoo standings, remaining schedule, rosters, and lineups; persists the refreshed working snapshot; obtains the live waiver pool and configured projection source; builds direct and derived weekly lineups; applies readiness/trust gates; runs Monte Carlo and scenario analyses; and writes the weekly intelligence report under `data/private/`.

The recommendation pipeline uses a two-stage simulation strategy: broad candidate scenarios are screened cheaply, while promising actions are rerun at higher simulation counts before being surfaced as recommendations.

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
