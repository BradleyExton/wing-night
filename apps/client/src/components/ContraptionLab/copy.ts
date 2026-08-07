export const contraptionLabCopy = {
  title: "CONTRAPTION Feel Lab",
  description:
    "Throwaway lab for WN-18, driving WN-17's integrator. Answer WN-15's four questions, record them on the ticket, then delete this route in WN-15.",
  stageLabel: "TV",
  controlsLabel: "Controls",

  // ─── Question 1 — failure readability ───────────────────────────────────
  aidsLabel: "1 · Failure readability",
  aidsHint:
    "Can the room see WHY it missed? Step the aids down until it stops reading — whatever the last level is, the TV has to ship it.",
  aidsBareLabel: "Bare",
  aidsTrailLabel: "Trail",
  aidsAnnotatedLabel: "Trail + contacts",

  // ─── Question 2 — piece set and count ───────────────────────────────────
  pieceSetLabel: "2 · Piece set and count",
  pieceSetHint:
    "Smallest set that still allows a clever solution. Each set is a solved route whose every ramp the wing actually touches.",
  bodyContactNote:
    "Bodies collide with ramps only — never with each other — so a marble cannot deflect the wing. Every clever solution here is ramp geometry.",

  // ─── Question 3 — one shot vs best-of-N ─────────────────────────────────
  attemptsLabel: "3 · One shot vs best-of-N",
  attemptsHint: "How many goes the team gets. Watch whether a second go is worth anything.",
  variationLabel: "3b · What changes between goes",
  variationHint:
    "Re-rolling the seed is the version that does not work — the runs come back identical.",
  variationSeedLabel: "Seed only",
  variationRebuildLabel: "Team rebuilds",
  identicalRunsWarning: "All attempts identical — best-of-N wins nothing here.",
  divergentRunsNote: "Attempts diverge — best-of-N is a real choice.",
  bestAttemptLabel: "best",

  // ─── Question 4 — sim length ────────────────────────────────────────────
  durationLabel: "4 · Sim length",
  durationHint: "WN-15 targets ~4s watchable. Settle time below is what the room actually waits.",
  keyframeHzLabel: "4b · Keyframe rate",
  keyframeHzHint: "Only changes how often the track is sampled — the physics always steps at 240Hz.",
  playbackLabel: "Playback speed",
  playbackHint: "Slow it down to judge readability, not to judge length.",

  seedLabel: "Seed",
  rerollLabel: "Reroll",
  replayLabel: "Replay",

  telemetryLabel: "Telemetry",
  outcomeLabel: "Outcome",
  settleLabel: "Settle time",
  missLabel: "Miss from centre",
  trackBytesLabel: "Track bytes (JSON, 2dp)",
  keyframeCountLabel: "Keyframes",
  overTargetNote: "past the 4s target",
  neverSettledNote: "never settled",
  ungradeableNote: "no wing or no bucket — nothing to grade",

  reasonLabel: {
    landed: "LANDED — in the bucket",
    short: "MISSED — settled short of the bucket",
    long: "MISSED — settled past the bucket",
    perched: "MISSED — hung up on the way down",
    restless: "NO VERDICT — still moving when the window closed"
  }
} as const;
