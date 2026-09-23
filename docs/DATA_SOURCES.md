# Historical Data Sources

The calibration pipeline separates **actual NFL results**, **pre-game projections**, and **identity/ranking context**. A technically accessible dataset is not automatically approved for calibration or redistribution.

## Current source plan

| Source | Role | Project status | Intended use |
|---|---|---|---|
| nflverse player stats | Actuals | Approved | Historical underlying NFL stats; convert locally with the league scoring engine |
| FantasyPros live API | Projections | Pending | Future live weekly projections after access is available |
| FantasyPros historical pages via ffpros-style retrieval | Projections | Research | Candidate historical weekly projection source; verify coverage and terms before acquisition/calibration |
| nflverse/FantasyPros ranking archives | Rankings/context | Research | Player identity and ranking context only; do not substitute rankings for point projections |

## Why FantasyPros historical pages remain a candidate

The open-source `ffpros` package includes an `fp_projections()` path with `year` and `week` parameters and tests/examples for historical NFL projection pages, including Week 7 of 2020 and a 2016 draft projection page. Its parser extracts underlying passing, rushing, receiving and miscellaneous projection columns when present. This establishes technical feasibility, but it does **not** establish that every desired season/week remains available or that storing/redistributing scraped historical data is permitted.

Accordingly, `fantasypros_historical` is marked `research`, not `approved` or `blocked`. Before using it for a production calibration dataset we must verify: (1) season/week coverage, (2) positions and underlying-stat fields, (3) player-ID match rate, (4) pre-game provenance, and (5) applicable provider terms/licensing.

## nflverse actuals

nflverse publishes downloadable player-stat releases in multiple formats. These are used as the factual outcome side of the backtest. The simulator calculates target-league fantasy points from underlying stats instead of accepting a source's default fantasy scoring.

## Governance rules

1. Never treat rankings as point projections.
2. Never use post-game or season-final information as a pre-game feature.
3. Preserve source and retrieval metadata for every historical slice.
4. Run dataset-readiness checks before calibration.
5. Keep raw third-party data out of this repository unless redistribution rights are clear.
6. Prefer adapters/manifests that allow a source to be replaced without changing model code.

`src/data/source-catalog.js` encodes the machine-readable source status used by the calibration pipeline.
