# Historical Data Contract

Historical observations are used for leakage-safe model comparison and calibration. One row represents one player's projection and realized fantasy score for one NFL week.

## Canonical fields

| Field | Required | Type | Description |
|---|---|---|---|
| `season` | yes | integer | NFL season year |
| `week` | yes | integer 1-18 | NFL week |
| `playerId` | yes | string | stable player identifier |
| `name` | no | string | display name |
| `position` | yes | QB/RB/WR/TE/K/DEF | fantasy position |
| `nflTeam` | no | string | NFL team abbreviation for that historical week |
| `opponent` | no | string | opponent abbreviation |
| `projection` | yes | number >= 0 | pre-game projected fantasy points |
| `actual` | yes | number >= 0 | realized fantasy points under the target scoring rules |
| `status` | no | string | pre-game availability/injury status; defaults ACTIVE |
| `cv` | no | number | externally estimated coefficient of variation |
| `source` | no | string | projection/data provider |

The minimum viable dataset is `season, week, playerId, position, projection, actual`. NFL team/opponent and status are strongly preferred because correlation, matchup, and availability models cannot be calibrated correctly without them.

## CSV

Header aliases are recognized automatically. Example:

```csv
season,week,player_id,player_name,pos,team,opp,projected_points,fantasy_points,status
2025,1,00-0033873,Patrick Mahomes,QB,KC,LAC,22.4,24.7,ACTIVE
```

Recognized aliases include `year`, `wk`, `player_id`, `player`, `pos`, `team`, `opp`, `proj`, `projected_points`, `actual_points`, `fantasy_points`, and `fpts`.

The CSV parser supports quoted fields, embedded commas, and escaped double quotes.

## JSON

JSON can be a top-level array:

```json
[
  {"season":2025,"week":1,"playerId":"00-0033873","name":"Patrick Mahomes","position":"QB","nflTeam":"KC","opponent":"LAC","projection":22.4,"actual":24.7}
]
```

It may also be an object containing an array under `rows`, `data`, or `observations`.

## Import behavior

`src/data/importers.js` performs four steps:

1. Parse CSV/JSON.
2. Infer source-column mappings from common aliases (or accept an explicit mapping).
3. Convert rows to the canonical historical schema.
4. Pass them through the existing historical validation pipeline.

Invalid rows are rejected with reasons rather than silently discarded. Missing required column mappings are reported before row ingestion.

## Data-source adapter rule

Provider-specific adapters should transform source data into this contract. Backtesting/model code must not depend directly on a vendor's column names or API response structure.

## Leakage rules

A historical projection must represent information that was actually available before the game being predicted. Do not substitute end-of-week rankings, rest-of-season values generated after the game, or season-final injury information. Rolling season evaluation trains only on seasons earlier than the test season.
