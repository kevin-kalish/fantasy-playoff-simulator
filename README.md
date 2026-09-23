# Fantasy Playoff Simulator

Monte Carlo fantasy football analytics application for estimating playoff, seed, matchup, and championship probabilities. Initial development targets a 10-team Yahoo Fantasy Football league with 8 playoff spots.

Live development site: https://kevin-kalish.github.io/fantasy-playoff-simulator/

## Current capabilities

- Custom Yahoo scoring, including half-PPR and passing/rushing/receiving yardage bonuses.
- Seeded, reproducible Monte Carlo season simulation.
- Regular-season standings, seed distributions, playoff qualification, playoff bracket, reseeding, and championship probability.
- Interactive synthetic 10-team dashboard with team/week drill-down.
- Single-game and multi-game what-if scenarios and weekly rooting interests.
- Remaining-schedule-strength analysis.
- Historical-stat ingestion, variance estimation, player-ID mapping, calibration, and leakage-safe rolling-season backtesting.
- CSV and JSON historical-data adapters with automatic column alias mapping, explicit mapping support, validation, and rejected-row reporting.
- Player availability/injury uncertainty and bye-week handling.
- Correctly keyed NFL-game correlation framework and increasing future-week uncertainty.
- Executable projection-only, volatility, availability, and correlated model variants.
- MAE, RMSE, Brier score, log loss, calibration bins, ECE, and Monte Carlo convergence diagnostics.
- Dependency-free automated validation suite.

## Architecture

The simulation core is provider-independent. External services feed normalized internal objects rather than being embedded in simulation logic. Provider-specific historical datasets likewise pass through import adapters into one canonical observation contract. The browser UI is separate from model/scenario calculations so real Yahoo data can replace demo data without rewriting the application.

### Data providers

- **Yahoo Fantasy Sports** — planned source of truth for league settings, standings, teams, rosters, and fantasy schedule. API approval pending.
- **Projection provider** — FantasyPros adapter exists; access pending. Projection interfaces are interchangeable.
- **Historical NFL/fantasy data** — used for weekly results, volatility calibration, matchup/correlation research, and player identity mapping. CSV/JSON adapters are ready; source selection remains open.

### Core modules

- `src/scoring.js` — custom fantasy scoring engine.
- `src/league-config.js` — league configuration.
- `src/lineup.js` — projected legal-lineup optimizer with FLEX support.
- `src/projections.js` — projection-provider interface/adapters.
- `src/variance.js` — historical player volatility with position-prior shrinkage.
- `src/simulator.js` — Monte Carlo engine with selectable model variants.
- `src/standings.js` — standings/ranking logic.
- `src/playoffs.js` — playoff bracket simulation using the shared team scoring model.
- `src/scenarios.js` — forced-outcome scenario support.
- `src/backtest.js` — forecast accuracy/calibration metrics.
- `src/data/historical.js` — canonical historical observations, validation, and chronological folds.
- `src/data/importers.js` — CSV/JSON parsing, alias inference, mapping, and ingestion.
- `src/model/season-backtest.js` — rolling out-of-sample season evaluation and aggregation.
- `src/model/experiment.js` / `src/model/model-variants.js` — comparable model experiments.
- `src/model/nfl-games.js` / `src/model/correlation.js` — NFL-game identity and shared stochastic factors.
- `src/model/availability.js` — injury/status/bye availability model.
- `src/model/convergence.js` — Monte Carlo precision diagnostics.
- `src/ui/*` — isolated UI state, analysis, and renderers.

See `docs/HISTORICAL_DATA.md` for the exact historical-data contract and examples.

## Historical data contract

Minimum required fields are `season`, `week`, `playerId`, `position`, `projection`, and `actual`. NFL team, opponent, status, name, CV, and source are optional but strongly preferred. Common source headers such as `year`, `wk`, `player_id`, `player`, `pos`, `team`, `opp`, `proj`, `projected_points`, `fantasy_points`, and `fpts` are mapped automatically.

Historical projections must be genuine pre-game values. The evaluation pipeline intentionally separates earlier seasons from each test season to prevent future information from leaking into calibration.

## Model philosophy

1. **Projection establishes expected performance.**
2. **Historical player results estimate game-to-game variance**, with shrinkage toward positional priors for small samples.
3. **Availability is stochastic when appropriate** and zero on byes/out designations.
4. **Shared NFL-game factors create correlated outcomes** rather than correlating fantasy opponents simply because they face each other.
5. **Distant weeks carry more uncertainty** than the immediate week.
6. **Matchup effects remain modest until backtesting demonstrates predictive value.**
7. **Underlying-stat simulation is the long-term target**, because threshold bonuses make yardage/TD distribution shape important.

Current correlation coefficients and injury play probabilities are development priors, not calibrated estimates.

## Validation

Run:

```bash
npm test
```

The suite covers scoring, seeded randomness, schemas, standings/tiebreaks, availability/byes, playoff advancement, deterministic season simulation, NFL-game identity, forecast metrics, model variants, historical ingestion/folds, rolling backtests, and CSV/JSON import behavior.

## Development roadmap

1. Select and connect historical projection/results sources using the completed data contract.
2. Calibrate volatility, correlation, injury, and matchup parameters using leakage-safe historical data.
3. Compare projection-only vs. increasingly sophisticated models and retain complexity only when it improves out-of-sample performance.
4. Add underlying-stat simulation for passing/rushing/receiving and threshold bonuses.
5. Connect Yahoo OAuth/import after approval.
6. Connect live projection provider after approval.
7. Replace synthetic data with real league data while retaining demo mode.

## Important status note

The application is a development prototype. Synthetic demo probabilities are for software testing only. Until live data integration and historical calibration are complete, outputs should not be interpreted as validated fantasy-football forecasts.
