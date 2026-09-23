# Fantasy Playoff Simulator

Monte Carlo fantasy football analytics application for estimating playoff, seed, matchup, and championship probabilities. Initial development targets a 10-team Yahoo Fantasy Football league with 8 playoff spots.

Live development site: https://kevin-kalish.github.io/fantasy-playoff-simulator/

## Current capabilities

- Custom Yahoo scoring, including half-PPR and passing/rushing/receiving yardage bonuses.
- Seeded, reproducible Monte Carlo season simulation.
- Regular-season standings, seed distributions, playoff qualification, playoff bracket, reseeding, and championship probability.
- Interactive synthetic 10-team dashboard with team/week drill-down.
- Single-game and multi-game what-if scenarios, rooting interests, and remaining-schedule-strength analysis.
- Historical-stat ingestion, player-ID reconciliation, dataset manifests/readiness gates, and leakage-safe rolling-season backtesting.
- CSV/JSON historical-data adapters plus nflverse actual-stat and FantasyPros projection adapters.
- Historical data-source governance so technically accessible data is not automatically treated as approved for calibration/redistribution.
- Player availability/injury uncertainty, bye handling, NFL-game correlation, and increasing future-week uncertainty.
- Executable projection-only, volatility, availability, and correlated model variants.
- Point-forecast metrics plus predictive-distribution coverage/tail calibration, Brier/log loss/ECE, and Monte Carlo convergence diagnostics.
- Dependency-free automated validation suite.

## Architecture

The simulation core is provider-independent. External services feed normalized internal objects rather than being embedded in simulation logic. Provider-specific historical datasets pass through adapters into one canonical observation contract. The browser UI is separate from model/scenario calculations so real league data can replace demo data without rewriting the model.

### Data providers

- **Yahoo Fantasy Sports** — planned source of truth for league settings, standings, teams, rosters, and fantasy schedule. API approval pending.
- **FantasyPros** — live projection adapter exists; access pending. Historical weekly projection pages are a research candidate, not yet an approved stored calibration dataset.
- **nflverse** — primary historical actual-stat source. Target-league fantasy points are calculated locally from underlying stats.
- **Ranking archives** — identity/ranking context only; rankings are never substituted for point projections.

See `docs/DATA_SOURCES.md` for source status/governance and `docs/HISTORICAL_DATA.md` for the historical-data contract.

### Core modules

- `src/scoring.js` — custom fantasy scoring engine.
- `src/league-config.js` — league configuration.
- `src/lineup.js` — projected legal-lineup optimizer with FLEX support.
- `src/projections.js` — projection-provider interface/adapters.
- `src/variance.js` / `src/calibration.js` — historical volatility and leakage-safe rolling features.
- `src/simulator.js` — Monte Carlo engine with selectable model variants.
- `src/standings.js` / `src/playoffs.js` / `src/scenarios.js` — standings, postseason, and scenario logic.
- `src/data/*` — historical contracts, provider adapters, ID mapping, manifests, readiness, and source governance.
- `src/model/experiment.js` / `src/model/season-backtest.js` — point-model experiments and rolling evaluation.
- `src/model/distribution-backtest.js` — predictive interval coverage/tail calibration for stochastic model variants.
- `src/model/nfl-games.js` / `src/model/correlation.js` — NFL-game identity and shared stochastic factors.
- `src/model/availability.js` / `src/model/convergence.js` — availability and simulation precision.
- `src/ui/*` — isolated UI state, analysis, and renderers.

## Historical data contract

Minimum required fields are `season`, `week`, `playerId`, `position`, `projection`, and `actual`. NFL team, opponent, status, name, CV, and source are optional but strongly preferred. Historical projections must be genuine pre-game values. The evaluation pipeline separates earlier seasons from each test season to prevent future information from leaking into calibration.

## Model philosophy

1. **Projection establishes expected performance.**
2. **Historical results estimate uncertainty**, with player estimates shrunk toward position priors when samples are small.
3. **Distribution quality matters separately from mean accuracy.** Adding volatility does not inherently improve a projection's mean; it must improve interval coverage, tails, matchup probabilities, or downstream playoff calibration.
4. **Availability is stochastic when appropriate** and zero on byes/out designations.
5. **Shared NFL-game factors create correlated outcomes** rather than correlating fantasy opponents simply because they face each other.
6. **Distant weeks carry more uncertainty** than the immediate week.
7. **Matchup effects remain modest until backtesting demonstrates predictive value.**
8. **Underlying-stat simulation is the long-term target**, because threshold bonuses make yardage/TD distribution shape important.

Current correlation coefficients and injury play probabilities are development priors, not calibrated estimates.

## Validation

Run:

```bash
npm test
```

The suite covers scoring, seeded randomness, schemas, standings/tiebreaks, availability/byes, playoff advancement, deterministic season simulation, NFL-game identity, forecast metrics, model variants, predictive-distribution calibration, historical ingestion/folds, rolling backtests, CSV/JSON imports, provider adapters, dataset readiness, and source governance.

## Development roadmap

1. Verify historical FantasyPros weekly projection coverage and terms; acquire only metadata/data that is permitted for the project.
2. Join approved historical projections to nflverse actuals and run the readiness gate.
3. Calibrate volatility and availability with predictive-distribution metrics, not RMSE alone.
4. Estimate correlation/matchup parameters from historical NFL-game data and validate downstream matchup probabilities.
5. Add underlying-stat simulation for passing/rushing/receiving and threshold bonuses.
6. Connect Yahoo OAuth/import and live projections after approvals.
7. Replace synthetic data with real league data while retaining demo mode.

## Important status note

The application is a development prototype. Synthetic demo probabilities are for software testing only. Until live data integration and historical calibration are complete, outputs should not be interpreted as validated fantasy-football forecasts.
