# Milestone A: Yahoo private beta

## Release goal
A secure, usable, read-only private Yahoo league application. The forecasting model may remain provisional; full historical calibration and ESPN support are explicitly deferred.

## Acceptance gates
- [ ] Yahoo OAuth connection and token refresh work without exposing credentials in browser bundles, public Pages, logs, or repository.
- [ ] Private league data and generated reports are available only to the authorized user; the public GitHub Pages demo remains synthetic.
- [ ] Authenticated user can refresh league standings, roster, matchups, projections, and report without PowerShell.
- [ ] Browser dashboard reads stable report schema and provides team/week drill-down, matchup views, and scenario/recommendation explanations.
- [ ] Provider failure, expired tokens, stale projections, missing players, and Yahoo reconciliation failures produce safe, understandable states.
- [ ] Recommendations preserve trust/publication gates; rejected or low-confidence actions never appear as endorsed moves.
- [ ] Full automated suite, live Yahoo reconciliation, end-to-end browser smoke test, and private release rehearsal pass.
- [ ] Operational deployment, rollback, logging, and credential rotation documented.

## Forecasting boundaries
- Current week uses submitted Yahoo lineup; future weeks currently assume optimized lineups.
- Long-range and postseason projections are provisional. Unknown original provider observation times and truncated season baselines remain explicit.
- Opt-in LINEUP_MANAGEMENT_STRESS compares uniform, synthetic missed-upgrade rates. It does not infer manager behavior and does not change production odds.
- Historical calibration, new provider contracts, advanced injury modeling, and ESPN integration are deferred unless required for safety or truthful beta presentation.

## Sequence
1. Run lineup-management sensitivity and document its limitations.
2. Wire private report to authenticated dashboard, preserving public synthetic-only demo.
3. Add private refresh action and safe credential/provider failure handling.
4. Complete security and acceptance checklist; rehearse release.
