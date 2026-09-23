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
- Historical-stat ingestion, variance estimation, player-ID mapping, calibration, and backtesting scaffolding.
- Player availability/injury uncertainty and bye-week handling.
- Correlated game/team/passing-environment outcome framework and increasing future-week uncertainty.
- Shared regular-season/postseason team scoring model.
- Monte Carlo convergence diagnostics and dependency-free validation tests.

## Architecture

The simulation core is provider-independent. External services feed normalized internal objects rather than being embedded in simulation logic. The browser UI is also being kept separate from model and scenario calculations so real Yahoo data can replace demo data without rewriting the application.

### Data providers

- **Yahoo Fantasy Sports** — planned source of truth for league settings, standings, teams, rosters, and fantasy schedule. API approval pending.
- **Projection provider** — FantasyPros adapter exists; access pending. Projection interfaces are interchangeable.
- **Historical NFL data** — used for weekly performance history, volatility calibration, matchup research, and player identity mapping.

### Core modules

- `src/scoring.js` — custom fantasy scoring engine.
- `src/league-config.js` — league configuration.
- `src/lineup.js` — projected legal-lineup optimizer with FLEX support.
- `src/projections.js` — projection-provider interface/adapters.
- `src/variance.js` — historical player volatility with position-prior shrinkage.
- `src/simulator.js` — Monte Carlo engine with availability, correlation, and horizon uncertainty.
- `src/standings.js` — standings/ranking logic.
- `src/playoffs.js` — playoff bracket simulation using the shared team scoring model.
- `src/scenarios.js` — forced-outcome scenario support.
- `src/backtest.js` / `src/calibration.js` — leakage-safe retrospective evaluation and calibration scaffolding.
- `src/model/schema.js` — canonical provider-independent data objects and validation.
- `src/model/availability.js` — injury/status/bye availability model.
- `src/model/correlation.js` — conservative correlation parameters and shared game factors.
- `src/model/convergence.js` — Monte Carlo precision diagnostics.
- `src/ui/state.js` — isolated dashboard interaction state.
- `src/ui/analysis.js` — matchup, schedule, scenario, and rooting-interest calculations.
- `src/ui/renderers.js` — reusable HTML rendering helpers.
- `src/dashboard.js` — thin UI controller/event layer.

## Model philosophy

1. **Projection establishes expected performance.**
2. **Historical player results estimate game-to-game variance**, with shrinkage toward positional priors for small samples.
3. **Availability is stochastic when appropriate** and zero on byes/out designations.
4. **Shared NFL-game factors should create correlated outcomes** rather than treating every player independently. Correct cross-player correlation ultimately requires NFL matchup IDs; fantasy opponents themselves should not automatically share an NFL-game factor.
5. **Distant weeks carry more uncertainty** than the immediate week.
6. **Matchup effects remain modest until backtesting demonstrates predictive value.**
7. **Underlying-stat simulation is the long-term target**, because threshold bonuses make yardage/TD distribution shape important.

Current correlation coefficients and injury play probabilities are development priors, not calibrated estimates.

## Model stages

- **V1 — complete:** projected fantasy points + positional volatility.
- **V2 — implemented/scaffolding:** player-specific historical volatility and shrinkage.
- **V3 — planned:** underlying football-stat simulation for custom scoring and bonuses.
- **V4 — in progress:** injuries, future-week uncertainty, opponent effects, and correctly keyed NFL-game/player correlations.
- **V5 — planned:** calibrated model selection using historical backtests and probability scoring.

## Validation

Run the dependency-free validation suite with:

```bash
npm test
```

Tests cover custom scoring thresholds, kicker/defense scoring, deterministic randomness, schema validation, Monte Carlo precision, standings/tiebreak behavior, player availability/byes, playoff advancement, and deterministic full-season simulation. Correlation and convergence-regression tests remain to be expanded.

## Development roadmap

1. Add NFL game IDs and player-team/opponent mappings so correlations are applied to the correct real-world games.
2. Expand correlation and convergence-regression tests.
3. Calibrate volatility, correlation, injury, and matchup parameters using historical data.
4. Compare projection-only vs. volatility vs. correlation/matchup models with leakage-safe backtests.
5. Add underlying-stat simulation for passing/rushing/receiving and threshold bonuses.
6. Connect Yahoo OAuth/import after approval.
7. Connect live projection provider after approval.
8. Replace synthetic data with real league data while retaining demo mode.

## Important status note

The application is a development prototype. Synthetic demo probabilities are for software testing only. Until live data integration and historical calibration are complete, outputs should not be interpreted as validated fantasy-football forecasts.
