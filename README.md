# Fantasy Playoff Simulator

Monte Carlo fantasy football analytics application for estimating playoff, seed, matchup, and championship probabilities. Initial development targets a 10-team Yahoo Fantasy Football league with 8 playoff spots.

Live development site: https://kevin-kalish.github.io/fantasy-playoff-simulator/

## Current capabilities

- Custom Yahoo scoring, including half-PPR and passing/rushing/receiving yardage bonuses.
- Seeded, reproducible Monte Carlo season simulation.
- Regular-season standings, seed distributions, playoff qualification, playoff bracket, reseeding, and championship probability.
- Interactive synthetic 10-team dashboard.
- Team drill-down, remaining schedule, weekly matchup analysis, and starting-lineup projections.
- Single-game and multi-game what-if scenarios.
- Weekly rooting-interest analysis.
- Remaining-schedule-strength view.
- Historical-stat ingestion, variance estimation, player-ID mapping, calibration, and backtesting scaffolding.
- Player availability/injury uncertainty and bye-week handling.
- Correlated game/team/passing-environment outcome framework.
- Increasing uncertainty for projections farther into the future.
- Monte Carlo convergence diagnostics.
- Dependency-free model validation tests.

## Architecture

The simulation core is intentionally provider-independent. External services are adapters feeding normalized internal objects rather than being embedded in simulation logic.

### Data providers

- **Yahoo Fantasy Sports** — planned source of truth for league settings, standings, teams, rosters, and fantasy schedule. API approval pending.
- **Projection provider** — FantasyPros adapter exists; access pending. Projection interfaces are interchangeable so the model is not locked to one vendor.
- **Historical NFL data** — used for weekly performance history, volatility calibration, matchup research, and cross-provider player identity mapping.

### Core modules

- `src/scoring.js` — custom fantasy scoring engine.
- `src/league-config.js` — initial league configuration.
- `src/lineup.js` — projected legal-lineup optimizer with FLEX support.
- `src/projections.js` — projection-provider interface/adapters.
- `src/variance.js` — historical player volatility with position-prior shrinkage.
- `src/simulator.js` — regular-season Monte Carlo engine with correlated game outcomes, availability, and horizon uncertainty.
- `src/standings.js` — standings/ranking logic.
- `src/playoffs.js` — playoff bracket simulation and reseeding.
- `src/scenarios.js` — forced-outcome scenario support.
- `src/backtest.js` / `src/calibration.js` — leakage-safe retrospective evaluation and calibration scaffolding.
- `src/model/schema.js` — canonical provider-independent data objects and validation.
- `src/model/availability.js` — injury/status/bye availability model.
- `src/model/correlation.js` — conservative correlation parameters and shared game factors.
- `src/model/convergence.js` — Monte Carlo precision diagnostics.
- `src/dashboard.js` — current prototype UI controller/rendering layer.

## Model philosophy

1. **Projection establishes expected performance.**
2. **Historical player results estimate game-to-game variance**, with shrinkage toward positional priors for small samples.
3. **Availability is stochastic when appropriate** and zero on byes/out designations.
4. **Shared game factors create correlated outcomes** instead of treating every player as independent.
5. **Distant weeks carry more uncertainty** than the immediate week.
6. **Matchup effects should remain modest until backtesting demonstrates predictive value.**
7. **Underlying-stat simulation is the long-term target**, because this league's threshold bonuses make the shape of yardage/TD distributions important.

Current correlation coefficients and injury play probabilities are development priors. They are not considered calibrated estimates and will be tuned against historical data.

## Model stages

- **V1 — complete:** projected fantasy points + positional volatility.
- **V2 — implemented/scaffolding:** player-specific historical volatility and shrinkage.
- **V3 — planned:** simulate underlying football statistics so custom scoring and yardage bonuses arise naturally.
- **V4 — in progress:** injuries, future-week uncertainty, opponent effects, and correlated QB/pass-catcher/game outcomes.
- **V5 — planned:** calibrated model selection using historical backtests and probability scoring.

## Validation

Run the dependency-free validation suite with:

```bash
npm test
```

Current tests cover custom scoring thresholds, kicker/defense scoring, deterministic seeded randomness, league-schema validation, and Monte Carlo precision helpers. Additional tests will cover standings/tiebreaks, playoff brackets, forced scenarios, availability, correlations, and convergence across simulation counts.

## Development roadmap

1. Expand automated tests for standings, playoff bracket, scenarios, injuries, and correlated outcomes.
2. Refactor the prototype `dashboard.js` into separate UI state, analysis, and rendering modules.
3. Calibrate volatility, correlation, injury, and matchup parameters using historical data.
4. Compare projection-only vs. volatility vs. correlation/matchup models with leakage-safe backtests.
5. Add underlying-stat simulation for passing/rushing/receiving and threshold bonuses.
6. Connect Yahoo OAuth/import after approval.
7. Connect live projection provider after approval.
8. Replace synthetic development data with real league data while retaining demo mode.

## Important status note

The application is a development prototype. Synthetic demo probabilities are for software testing only. Until live data integration and historical calibration are complete, outputs should not be interpreted as validated fantasy-football forecasts.
