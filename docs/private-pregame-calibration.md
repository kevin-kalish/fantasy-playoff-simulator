# Private pregame calibration collection

The collection and calibration files must remain in `data/private/`. Do not commit snapshots, credentials, projection archives, actuals, or diagnostic reports.

## Capture before kickoff

Prepare a **current**, Yahoo-audited private league snapshot and weekly spec. The spec must contain `sourceAudit.passed: true` from a current audit; a stale copied audit does not establish freshness. Set a live provider API key (`FANTASYPROS_API_KEY` or `JERRYGM_API_KEY`) in the local environment. Then:

```powershell
npm run calibration:capture -- data/private/league-snapshot.json data/private/weekly-spec.json
```

Replace these example paths with your actual private snapshot/spec. The command forces `PROJECTION_REFRESH=true` for its child process, archives the audited run, and writes `data/private/last-pregame-capture.json`. It refuses fixture-only, unaudited, and cache-only runs. It may still generate a mixed archive: only explicitly tagged live-provider rows are candidates for future calibration. Check that the target games have **not** started; this command does not itself enforce the NFL kickoff cutoff. A provider response is not independent proof of when the provider originally calculated the projection.

## Refresh actuals after games finish

```powershell
npm run calibration:refresh -- 2026
```

The command maintains a private status report and may return `waiting-for-completed-pairs`. An archive being timestamped before kickoff is not enough: the importer also requires provider provenance and independently matched completed actuals. nflverse scoring may differ from Yahoo league rules, and player identity matching must be audited before empirical calibration is trusted.

## Scheduling

No Windows Task Scheduler job is installed by these commands. Once the capture command is tested against a current audited snapshot and live provider, create a local scheduled task only with a dependable snapshot/spec refresh mechanism and a verified pre-kickoff schedule. Running the same stale spec every week is **not** a safe substitute for that mechanism.
