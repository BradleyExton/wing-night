import type { ContraptionPieceKind, ContraptionRunOutcome } from "@wingnight/shared";

export const hostContraptionSurfaceCopy = {
  railTitle: "Contraption",
  teamPrefix: "Building:",
  noAssignedTeamLabel: "No team assigned",
  pendingChip: (points: number): string => `+${points} pending`,
  introDescription:
    "Lay ramps on the grid, hit GO, and the TV runs the physics. Land the wing in the bucket for the big points; clip a bonus on the way down for more. Two goes — the second one is a rebuild.",
  waitingLevelLabel: "No levels are loaded. Check minigames/contraption.json.",
  levelLabel: "Level",
  attemptCounter: (attemptNumber: number, attemptsPerTurn: number): string =>
    `Attempt ${attemptNumber} of ${attemptsPerTurn}`,
  piecesCounter: (placed: number, budget: number): string => `${placed} / ${budget} pieces`,
  tapHint: "Tap a cell to place the selected piece. Tap it again to take it back.",
  paletteTitle: "Pieces",
  pieceLabel: {
    shelf: "Shelf",
    "slope-right": "Slope right",
    "slope-left": "Slope left",
    "steep-right": "Steep right",
    "steep-left": "Steep left"
  } satisfies Record<ContraptionPieceKind, string>,
  pieceAriaLabel: (label: string): string => `Select ${label}`,
  clearButtonLabel: "Clear field",
  goButtonLabel: "GO",
  goButtonSub: "Run the contraption",
  replayButtonLabel: "Replay for the room",
  nextAttemptButtonLabel: "Next attempt →",
  finishTurnButtonLabel: "Finish turn",
  doneLabel: "Turn complete — advance the phase when the room is ready.",
  outcomeLabel: {
    landed: "IN THE BUCKET",
    short: "Missed — fell short",
    long: "Missed — went long",
    perched: "Missed — hung up on the way down",
    restless: "Still moving — no verdict"
  } satisfies Record<ContraptionRunOutcome, string>,
  runPoints: (points: number): string => `+${points}`,
  bestPoints: (points: number): string => `Best so far: ${points}`,
  bonusesClipped: (count: number): string =>
    count === 0 ? "No bonuses clipped" : `${count} bonus${count === 1 ? "" : "es"} clipped`,
  totalsTitle: "Round so far",
  totalsPoints: (points: number): string => `${points} pt${points === 1 ? "" : "s"}`
} as const;
