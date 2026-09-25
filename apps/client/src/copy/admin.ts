import type { MinigameType } from "@wingnight/shared";

import { formatMinigameName } from "./formatters";

// Every string the config wizard renders. Component entrypoints may not hold
// JSX text, so this is where the wizard's words live.
export const adminCopy = {
  eyebrow: "Pre-flight",
  stepRailLabel: "Setup steps",

  identityStepTitle: "Identity",
  lineupStepTitle: "Lineup",
  clocksStepTitle: "Clocks & Scoring",
  rosterStepTitle: "Roster",
  promptPacksStepTitle: "Prompt Packs",
  reviewStepTitle: "Review",

  packNameLabel: "Pack name",
  packNameHint: "Labels this config for you; no surface shows it.",

  roundLabel: (roundNumber: number): string => `Round ${roundNumber}`,
  roundLabelFieldLabel: "Label",
  roundSauceFieldLabel: "Sauce",
  roundMinigameFieldLabel: "Mini-game",
  roundPointsFieldLabel: "Points per wing eaten",
  removeRoundLabel: (roundNumber: number): string => `Remove round ${roundNumber}`,
  addRoundLabel: "+ Add a round",
  minigameName: formatMinigameName,

  eatingTimerLabel: "Eating timer (sec)",
  geoTimerLabel: "Geo timer (sec)",
  drawingTimerLabel: "Drawing timer (sec)",
  emojiCharadesTimerLabel: "Emoji charades timer (sec)",
  defaultMaxLabel: "Mini-game max points",
  finalRoundMaxLabel: "Final round max points",

  playersSectionTitle: "Players",
  playerHeading: (playerIndex: number): string => `Player ${playerIndex + 1}`,
  playerNameFieldLabel: "Name",
  playerAvatarFieldLabel: "Avatar URL (optional)",
  // Names a team from the Teams list below, and an unrecognised name blocks
  // apply rather than seating nobody — so the label says where the value has to
  // come from, and "optional" says that leaving it blank is a real choice
  // (unassigned, seated from the SETUP deck) and not an unfinished row.
  playerTeamFieldLabel: "Starting team (optional)",
  removePlayerLabel: (playerIndex: number): string =>
    `Remove player ${playerIndex + 1}`,
  addPlayerLabel: "+ Add a player",

  teamsSectionTitle: "Teams",
  teamHeading: (teamIndex: number): string => `Team ${teamIndex + 1}`,
  teamNameFieldLabel: "Name",
  removeTeamLabel: (teamIndex: number): string => `Remove team ${teamIndex + 1}`,
  addTeamLabel: "+ Add a team",

  // AC 1, user-confirmed at planning: applying overwrites whatever the SETUP
  // deck did to the roster in-room. Said on the step the host edits, not only
  // in Review, because that is where they are when the rule bites.
  rosterOverwriteHint:
    "Applying replaces the whole roster on disk — including players and teams added from the SETUP deck tonight.",
  // The reason a starting team is worth filling in at all: it is the difference
  // between arriving to seated teams and re-forming them while guests watch.
  rosterStartingTeamHint:
    "A player's starting team must match a team name below. Players seated here arrive already on their team; leave it blank and the host seats them in SETUP.",

  promptIdFieldLabel: "Id",
  triviaSectionTitle: "Trivia",
  triviaPromptHeading: (promptIndex: number): string =>
    `Question ${promptIndex + 1}`,
  triviaQuestionFieldLabel: "Question",
  triviaAnswerFieldLabel: "Answer",
  removeTriviaPromptLabel: (promptIndex: number): string =>
    `Remove trivia question ${promptIndex + 1}`,
  addTriviaPromptLabel: "+ Add a question",

  drawingSectionTitle: "Drawing",
  drawingPromptHeading: (promptIndex: number): string =>
    `Prompt ${promptIndex + 1}`,
  drawingPromptFieldLabel: "Prompt",
  removeDrawingPromptLabel: (promptIndex: number): string =>
    `Remove drawing prompt ${promptIndex + 1}`,
  addDrawingPromptLabel: "+ Add a prompt",

  geoSectionTitle: "Geo",
  geoPromptCountValue: (promptCount: number): string =>
    `${promptCount} photo prompts`,
  // Geo content is photos plus coordinates, produced by the import CLI — there
  // is no write path to key on `CONFIG_FILE_KEYS`, so the wizard reports the
  // count and names the tool instead of pretending to be an editor.
  geoImportHint:
    "Read-only here. Run `pnpm import:geo` to rebuild the geo pack from a photo folder.",

  reviewPackKey: "Pack",
  reviewLineupKey: "Lineup",
  reviewTimersKey: "Timers",
  reviewScoringKey: "Scoring",
  reviewRosterKey: "Roster",
  reviewPromptsKey: "Prompt packs",
  reviewLineupEntry: (
    roundNumber: number,
    label: string,
    minigameType: MinigameType
  ): string =>
    `${roundNumber}. ${label} (${formatMinigameName(minigameType)})`,
  reviewLineupSeparator: " · ",
  reviewTimersValue: (timers: {
    eatingSeconds: number;
    geoSeconds: number;
    drawingSeconds: number;
    emojiCharadesSeconds: number;
  }): string =>
    `eat ${timers.eatingSeconds}s · geo ${timers.geoSeconds}s · draw ${timers.drawingSeconds}s · emoji ${timers.emojiCharadesSeconds}s`,
  reviewScoringValue: (defaultMax: number, finalRoundMax: number): string =>
    `max ${defaultMax} · final ${finalRoundMax}`,
  reviewRosterValue: (playerCount: number, teamCount: number): string =>
    `${playerCount} players · ${teamCount} teams`,
  reviewPromptsValue: (
    triviaCount: number,
    drawingCount: number,
    geoCount: number
  ): string =>
    `${triviaCount} trivia · ${drawingCount} drawing · ${geoCount} geo (read-only)`,

  // AC 1's documented rule, stated where the host commits to it. Pre-flight
  // wins pre-night; once the night is running the SETUP deck is the live truth
  // and applying is refused outright (see the locked banner).
  rosterOverwriteWarning:
    "Applying overwrites the roster and prompt packs on disk with what you see here — any player or team added from the SETUP deck tonight is replaced. During the night the SETUP deck wins instead: applying is refused past Setup.",

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
