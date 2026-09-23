# Fantasy Playoff Simulator

Monte Carlo fantasy football analytics application. Initial development targets a 10-team Yahoo Fantasy Football league with 8 playoff spots.

## Current modules

- `src/scoring.js` — custom Yahoo scoring engine, including half-PPR and yardage bonuses.
- `src/league-config.js` — league structure and roster configuration.
- `src/lineup.js` — weekly projected-lineup optimizer with FLEX support.
- `src/projections.js` — provider interface plus manual and FantasyPros adapters.
- `src/variance.js` — player volatility estimation with position-prior shrinkage.
- `src/simulator.js` — Monte Carlo weekly matchup / regular-season simulation and playoff-seed probabilities.

## Data architecture

Yahoo (pending API approval) is the source of truth for league settings, standings, rosters, and fantasy schedule. Projection data is kept behind a provider interface so the application is not locked to one vendor. Historical NFL data will be used to estimate player-specific volatility and, later, matchup effects and correlations.

## Model stages

1. **V1:** projected fantasy points + position volatility.
2. **V2:** player-specific volatility derived from historical weekly scores.
3. **V3:** simulate underlying football statistics so custom scoring bonuses arise naturally.
4. **V4:** opponent adjustments, injuries, and correlated outcomes (QB/receiver, game environment, etc.).

The current model is a prototype and should not be treated as calibrated until backtesting is added.

## Near-term roadmap

- Yahoo OAuth and league import after API approval.
- Historical weekly-stat ingestion and player-ID mapping.
- Projection ingestion.
- Backtesting/calibration of outcome distributions.
- Scenario engine (force win/loss, trade, lineup changes).
- Playoff bracket simulation through Weeks 15–17.
- Interactive web dashboard.
