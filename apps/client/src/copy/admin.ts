import { MINIGAME_DEFINITIONS, type MinigameType } from "@wingnight/shared";

// Every string the config wizard renders. Component entrypoints may not hold
// JSX text, so this is where the wizard's words live.
export const adminCopy = {
  eyebrow: "Pre-flight",
  stepRailLabel: "Setup steps",

  identityStepTitle: "Identity",
  lineupStepTitle: "Lineup",
  clocksStepTitle: "Clocks & Scoring",
  reviewStepTitle: "Review",

  packNameLabel: "Pack name",
  packNameHint: "Shown on the TV lobby while guests arrive.",

  roundLabel: (roundNumber: number): string => `Round ${roundNumber}`,
  roundLabelFieldLabel: "Label",
  roundSauceFieldLabel: "Sauce",
  roundMinigameFieldLabel: "Mini-game",
  roundPointsFieldLabel: "Points per wing eaten",
  removeRoundLabel: (roundNumber: number): string => `Remove round ${roundNumber}`,
  addRoundLabel: "+ Add a round",
  minigameSlug: (minigameType: MinigameType): string =>
    MINIGAME_DEFINITIONS[minigameType].slug,

  eatingTimerLabel: "Eating timer (sec)",
  triviaTimerLabel: "Trivia timer (sec)",
  geoTimerLabel: "Geo timer (sec)",
  drawingTimerLabel: "Drawing timer (sec)",
  defaultMaxLabel: "Mini-game max points",
  finalRoundMaxLabel: "Final round max points",

  reviewPackKey: "Pack",
  reviewLineupKey: "Lineup",
  reviewTimersKey: "Timers",
  reviewScoringKey: "Scoring",
  reviewRosterKey: "Roster",
  reviewLineupEntry: (
    roundNumber: number,
    label: string,
    minigameType: MinigameType
  ): string =>
    `${roundNumber}. ${label} (${MINIGAME_DEFINITIONS[minigameType].slug})`,
  reviewLineupSeparator: " · ",
  reviewTimersValue: (timers: {
    eatingSeconds: number;
    triviaSeconds: number;
    geoSeconds: number;
    drawingSeconds: number;
  }): string =>
    `eat ${timers.eatingSeconds}s · trivia ${timers.triviaSeconds}s · geo ${timers.geoSeconds}s · draw ${timers.drawingSeconds}s`,
  reviewScoringValue: (defaultMax: number, finalRoundMax: number): string =>
    `max ${defaultMax} · final ${finalRoundMax}`,
  reviewRosterValue: (playerCount: number, teamCount: number): string =>
    `${playerCount} players · ${teamCount} teams — edited on /host, not here`,

  // AC 5: `hostAuth` is last-claim-wins on ONE module-scoped secret, so opening
  // this page mid-night silently invalidates the live /host session's secret.
  // The host client re-claims on `host:secretInvalid` but never retries the
  // action it dropped, so the host's next tap is a silent no-op and the two
  // tabs then ping-pong the claim. Stating it here is the mitigation until
  // WN-12 gives the admin surface its own secret.
  hostAuthCoexistenceWarning:
    "Close /host before applying. This page claims host control, and the server keeps only one host secret — opening it mid-night silently signs the live host tab out, and that tab's next tap does nothing.",

  applyLabel: "Apply config & reload room",
  applyCleanLabel: "Nothing to apply",
  applyBlockedLabel: "Fix the highlighted fields first",
  appliedLabel: "Applied ✓",

  lockedBannerTitle: "Config locked — night in progress",
  // The server's own escape hatch: apply is refused past SETUP, and Reset Game
  // (in the /host overrides panel) is what returns the room to SETUP.
  lockedBannerHint:
    "Applying is only allowed during Setup. Reset Game from the overrides panel on /host to unlock.",

  backLabel: "← Back",
  continueLabel: "Continue →",

  loadingLabel: "Reading config from disk…",
  stepPositionLabel: (position: number): string => String(position)
} as const;
