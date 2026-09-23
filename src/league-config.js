export const desmondLeague = {
  yahooLeagueId: "244897",
  name: "Desmond Fantasy Football",
  teamCount: 10,
  scoringType: "head-to-head",
  regularSeasonEnds: 14,
  playoffSpots: 8,
  playoffWeeks: [15,16,17],
  playoffReseeding: true,
  playoffTiebreaker: "higher-seed",
  lineup: { QB:1, WR:2, RB:2, TE:1, FLEX:1, K:1, DEF:1, BN:6, IR:2 },
  flexEligible: ["WR","RB","TE"],
  receptionPoints: 0.5,
  notes: "Initial development league. Yahoo API import will replace manual snapshots after approval."
};
