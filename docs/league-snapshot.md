# League snapshot input

The simulator accepts a provider-neutral league snapshot. Provider adapters (Yahoo, ESPN, Sleeper, manual exports) should normalize into this shape instead of coupling provider APIs to the simulation engine.

Required logical data:

- `teams`: current standings plus a current `lineup` or week-specific `weeklyLineups`.
- `schedule`: remaining regular-season weeks only. Each matchup is `[teamIdA, teamIdB]`.
- `playoffSpots`: number of postseason qualifiers.
- `playoffWeeks`: NFL weeks used by the fantasy playoffs.

Recommended metadata is stored under `source`: `provider`, `leagueId`, and `season`.

Example:

```json
{
  "schemaVersion": 1,
  "source": {"provider": "yahoo", "leagueId": "12345", "season": 2026},
  "teams": [
    {
      "id": "1",
      "name": "Example Team",
      "wins": 7,
      "losses": 3,
      "ties": 0,
      "points": 1012.4,
      "lineup": [
        {"id": "p1", "name": "Example QB", "position": "QB", "nflTeam": "BUF", "projection": 22.1}
      ]
    }
  ],
  "schedule": [{"week": 11, "matchups": [["1", "2"]]}],
  "playoffSpots": 6,
  "playoffWeeks": [15, 16, 17],
  "reseed": true,
  "tiebreaker": "points"
}
```

Normalize and validate a provider export with:

```powershell
npm run normalize:league -- data/private/my-league-raw.json data/private/my-league.json
```

Then compare fixed versus calibrated simulation results with:

```powershell
npm run compare:league-calibration -- data/private/my-league.json
```

The normalizer accepts common aliases such as `team_id`, `team_name`, `points_for`, `starters`, `player_id`, `player_name`, `pos`, and `projected_points`. Validation rejects duplicate/unknown teams, invalid positions, negative projections, duplicate schedule weeks, self-matchups, and teams scheduled twice in the same week.

Provider credentials and raw private league exports should remain outside source control.
