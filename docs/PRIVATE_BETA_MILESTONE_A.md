# Milestone A: Yahoo private beta

## Release goal
A secure, usable, read-only private Yahoo league application. The forecasting model may remain provisional; full historical calibration and ESPN support are explicitly deferred.

## Acceptance gates
- [ ] Yahoo OAuth connection and token refresh work without exposing credentials in browser bundles, public Pages, logs, or repository.
- [ ] Private league data and generated reports are available only to the authorized user; the public GitHub Pages demo remains synthetic.
- [x] Local user can trigger a Yahoo report refresh from the browser without PowerShell (confirmed on Windows, October 16, 2026).
- [ ] Browser dashboard reads stable report schema and provides team/week drill-down, matchup views, and scenario/recommendation explanations.
- [ ] Provider failure, expired tokens, stale projections, missing players, and Yahoo reconciliation failures produce safe, understandable states.
- [ ] Recommendations preserve trust/publication gates; rejected or low-confidence actions never appear as endorsed moves.
- [ ] Full automated suite, live Yahoo reconciliation, end-to-end browser smoke test, and private release rehearsal pass. (Automated suite and browser refresh previously passed; re-run after final changes.)
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

## Local beta operating procedure

1. Pull the `dashboard-contract-v1` branch and run `npm test`.
2. Start `npm run dashboard:private` in a local PowerShell window; keep it open.
3. Open the one-time localhost URL printed in the console. Treat its token as a secret.
4. Click **Refresh Yahoo data**, wait for completion, and confirm the report's generated timestamp advances. If it fails, retain the previous report and check the local console.
5. Stop the server with Ctrl+C; restarting rotates the session token.

Never upload `data/private` or the localhost URL to public GitHub Pages. This service is loopback-only and is not a remotely hosted multi-user application. Historical forecast calibration and ESPN remain out of scope for Milestone A.

## Security acceptance procedure (local beta)

- **Scope:** localhost-only single-user beta, not an internet-hosted authenticated service. Do not forward ports, use a public reverse proxy, or publish the private preview.
- **Repository hygiene:** verify `git ls-files data/private` and `git ls-files .env` return no paths. Never paste credentials, the session URL, or private report contents into an issue.
- **Authorization:** without the session token, `GET /` and `GET /status` must return 403; `POST /refresh` without the same-origin session header must return 403. Existing automated server tests cover these controls.
- **Session rotation:** stop the dashboard with Ctrl+C, restart, and verify the old session URL no longer accesses the new server. The new process uses a new random token and ephemeral port.
- **Browser privacy:** use developer tools to confirm no third-party network requests. The report is embedded in the authenticated local HTML page, so anyone with access to that browser page or the local private files can read it.
- **Logs:** the refresh controller drains subprocess output instead of logging provider stderr. Other direct command-line workflows may have their own logging; review before sharing logs.
- **Trust labels:** inspect the actual dashboard for provisional championship forecasts, stale/unverified projection warnings, and unendorsed recommendations. Automated tests cannot replace visual inspection.
- **Release:** rerun `npm test` after changes, rehearse browser refresh and failure handling, and document remaining deviations before checking off the eight gates above.

Credential rotation: stop the localhost server to invalidate its in-memory session token; restarting issues a new token. If Yahoo OAuth or projection-provider secrets are suspected compromised, revoke/rotate them at the provider and update only local secret storage, never the repository.
