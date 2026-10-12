# Live dashboard contract v1

Status: local acceptance preview implemented; public live browser integration is not deployed. The browser preview is generated offline from a trusted, private weekly report.

## Principles

- Browser receives sanitized, read-only data; never publish Yahoo tokens, JerryGM keys, private OAuth data, or raw provider responses.
- Use a schema version (`schemaVersion: 1`) and a generated timestamp; reject unsupported versions.
- Do not silently substitute synthetic demo data when live data is missing.
- Probabilities must be finite numbers in [0,1], with clear simulation count and freshness.
- Distinguish direct weekly projections from derived regular-season and derived postseason estimates.
- Treat championship probabilities as **provisional** until direct playoff-week projections and calibration are available.
- Only confirmed recommendations appear as actions. Rejected/near-miss scenarios appear separately as diagnostics.
- Keep all identifiers stable: league, team, player, week, and scenario IDs.

## Proposed top-level payload

```json
{
  "schemaVersion": 1,
  "mode": "live",
  "generatedAt": "2026-10-08T14:00:00Z",
  "league": {
    "id": "league-id",
    "name": "Example league",
    "season": 2026,
    "currentWeek": 5,
    "teamCount": 10,
    "playoffTeamCount": 8,
    "userTeamId": "team-1"
  },
  "model": {
    "simulationCount": 50000,
    "seed": 12345,
    "status": "developmental",
    "championshipStatus": "provisional",
    "projectionCoverage": 0.993,
    "projectionHorizon": {
      "directWeeks": [5, 6, 7],
      "regularSeasonDerived": true,
      "postseasonDerived": true
    }
  },
  "trust": {
    "yahooAuditPassed": true,
    "simulationReady": true,
    "warnings": []
  },
  "teams": [],
  "matchups": [],
  "recommendations": [],
  "diagnostics": []
}
```

All numbers and names in the example are illustrative, not live results.

## Team and matchup fields

Each team should expose `id`, `name`, `wins`, `losses`, `ties`, `pointsFor`, `currentSeed`, `playoffProbability`, `championshipProbability`, and optional `seedProbabilities`. Team drill-down may additionally expose `roster`, `optimalLineup`, and `remainingSchedule`.

Each matchup should expose `week`, `homeTeamId`, `awayTeamId`, `homeWinProbability`, and the projection source/horizon. The probabilities should correspond to the same simulation snapshot as the standings.

## Actions and diagnostics

Confirmed recommendations: `id`, `type` (start-sit, add-drop, trade), `title`, `teamId`, `expectedPlayoffProbabilityDelta`, `expectedChampionshipProbabilityDelta`, `confirmationStatus` (must equal `confirmed`), and `explanation`.

Diagnostics: `id`, `scenarioType`, `reasonNotRecommended`, and optional modeled deltas. Never present these as executable recommended actions.

## Export and integration acceptance criteria

1. Export from the validated weekly-intelligence result, not from unverified provider payloads.
2. Remove secrets and personally identifying OAuth fields; serialize only allowlisted keys.
3. Reject invalid schema versions, missing team IDs, nonfinite probabilities, or probabilities outside [0,1].
4. Display explicit stale/unavailable state on failed refresh, rather than rebranding cached/demo data as live.
5. Verify team/week drill-down against the same immutable report snapshot.
6. Verify the dashboard correctly labels derived postseason estimates as provisional.
7. Verify that only confirmed actions enter the recommendation list.
8. Add deterministic fixtures/tests before enabling public deployment.

## Next implementation

Implement a pure exporter `weeklyReportToDashboardV1(report)` after inspecting the actual weekly report shape, add schema validation and fixture tests, then wire the browser to the sanitized artifact. Preserve the current Monte Carlo engine and Yahoo audit gate.

## Private browser acceptance (local only)

Run `npm run dashboard:preview -- data/private/fightin-kali-week-5-report.json` after a successful private weekly run. The output is `data/private/live-dashboard-preview.html`, an offline read-only HTML snapshot. Open it locally in a browser; never commit or publish it. It includes sanitized team outlook, schedule, provisional championship labeling, and GM diagnostics. The file still contains private league information and must remain private.

Review the rendered dashboard, click several teams in the playoff-race table, verify lineup drill-down for the focus team, and inspect GM rejection explanations. This is a manual browser acceptance step; automated rendering tests do not establish browser acceptance. Run `npm run review:readiness -- data/private/fightin-kali-week-5-report.json` afterwards. If the private report includes `seedValidation` with three passing 50,000-run independent seeds, the audit recognizes that check; browser acceptance remains a warning until manually confirmed.

The local preview uses a restrictive CSP and no external network resources. It does not refresh automatically, send data anywhere, or implement Yahoo authentication in the browser.
