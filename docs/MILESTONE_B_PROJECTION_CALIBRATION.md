# Milestone B — Projection Quality and Calibration

Status: **Started October 19, 2026 — baseline and evidence audit; no model parameter changes approved.**

## Goal

Improve the reliability of fantasy point forecasts and downstream playoff/championship probabilities using *verifiable pregame observations*, without sacrificing private-beta safety, recommendation publication gates, or reproducibility.

## Current implementation baseline (code inspection)

- `src/model/league-preparation.js` derives missing future-week projections from recency-weighted direct weekly samples (decay **0.8**) and available JerryGM season-level baselines (season weight **0.65** when both exist).
- Derived projection confidence decays by horizon at **0.94 per week**, with a **0.55** horizon floor, then discounts single-source inputs. This is diagnostic confidence, **not** a historically fitted probability or distribution adjustment.
- A limited/truncated provider season response can reduce baseline coverage. Source response coverage and successful roster identity matches must be measured separately.
- Current-week Yahoo submitted lineups remain the baseline; future lineups are modeled hypotheticals.
- `src/model/projection-calibration-diagnostics.js` is descriptive only. It requires at least **100** observations, **2** distinct seasons, and **30** observations per represented position/source/horizon group for corresponding sufficiency flags. It does **not** authorize automatic parameter updates.
- `docs/HISTORICAL_DATA.md` requires genuine pregame projected fantasy points paired with realized outcomes; future data, end-of-week rankings, and retrospectively generated projections are ineligible.

## Phase B1 — evidence and baseline (first priority)

1. Inventory eligible projection archives by season, week, player ID, source, and *original observation time*. Distinguish provider-observed timestamps from local cache update timestamps; unknown observation time is **unverified**, not fresh.
2. Inventory actual fantasy results and the league scoring contract. Record join success, unmatched IDs, duplicates, missing positions, and rejected rows. Never fill gaps using postgame information.
3. Run the existing accuracy and calibration diagnostics without altering model coefficients. Report MAE, RMSE, bias, sample count, season coverage, and splits by position, provider source, and forecast horizon.
4. Measure direct weekly versus derived long-range player-week coverage, season-baseline match rates, provider truncation, and missing/stale source status. Report separate results for regular-season and playoff horizons.
5. Audit whether *historical as-of* league snapshots, standings, schedules, rosters, and projections exist for a valid playoff-probability backtest. If not, record that playoff calibration is **not yet measurable**; do not manufacture retrospective forecasts.

## Phase B2 — controlled candidate comparisons

Only after Phase B1 yields sufficient eligible evidence:

- Compare current recency-only horizon, season-only baseline, and existing 65/35 season/recent blend on identical chronological test folds.
- Evaluate alternative season weights/recency decays against out-of-sample MAE, RMSE, and bias, with position/horizon breakdowns. Select no new coefficient from a single live week.
- Evaluate predictive interval coverage, tails, and horizon-dependent dispersion independently from point-forecast accuracy.
- Evaluate playoff/championship reliability with archived *as-of* predictions and subsequently verified outcomes, including Brier score and calibration bins when sample sizes permit. Keep championship probabilities provisional until supported.
- Preserve fixed seeds, consistent roster/lineup policy, and same-input comparisons; report sample size and uncertainty rather than claiming a win on noise.

## Acceptance criteria

- **Data integrity:** all accepted rows are demonstrably pregame, deduplicated, scoring-consistent, and leakage-safe; unknown provenance is explicitly excluded or labeled unverified.
- **Baseline reproducibility:** existing metrics, filters, data sources, code revision, and sample sizes are documented and reproducible.
- **Candidate promotion:** proposed model changes improve appropriate held-out metrics without material regression in important positions/horizons; comparisons must disclose confidence/sample limitations. If evidence is inadequate, retain existing coefficients.
- **Probability trust:** no historically unvalidated championship confidence is presented as calibrated; recommendation and publication gates remain intact.
- **Engineering:** all automated tests pass; no credentials or private league data are committed or exported to public Pages.

## Next engineering task

Build or extend a **read-only, local baseline audit command** that summarizes eligible historical coverage and existing accuracy/calibration outputs, and emits a private JSON/Markdown diagnostic. It must never fetch additional provider quota by default, alter model coefficients, or publish private league data. Add deterministic fixture tests for empty archives, unverified timestamps, duplicate player-weeks, and insufficient samples before using real private data.

## Milestone A carryover

Single-user localhost beta was provisionally accepted after 110 passing test suites and successful browser failure/retry checks. Manual session rotation, browser Network inspection, visual trust-label review, and final release rehearsal remain unverified; see `docs/PRIVATE_BETA_MILESTONE_A.md`.
