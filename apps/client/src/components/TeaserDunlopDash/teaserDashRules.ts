// The street the teaser rides: the night's own SCHLONIC rules (content/sample/gameConfig.json and
// the pack agree on them), so the zone online is the zone on the night. Copied rather than read,
// because the site has no content loader; change them together.
export const TEASER_DASH_RULES = {
  runsPerTurn: 3,
  zoneSeed: 20260919,
  zoneChunks: 22,
  parWingsPerRun: 120
} as const;

// The round's points cap (gameConfig.json `minigameScoring.defaultMax`).
export const TEASER_DASH_POINTS_MAX = 15;
