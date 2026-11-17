import { CONTESTANT_CONTROLLERS, type ContestantController } from "@wingnight/shared";

export const hostBrawlSurfaceCopy = {
  // Read out on the briefing. A phones turn picks up phones, not the tablet (`handset`).
  introDescription: (handset: ContestantController): string =>
    `Your chickens brawl down Dunlop Street to the Spirit Catcher, and the street belongs to the geese. ${
      handset === CONTESTANT_CONTROLLERS.PHONE
        ? "Everybody on the team plays at once, each on their own phone: tap STEP OUT and your hen walks onto the street on the TV."
        : "One of you plays each block on the tablet, and passes it on."
    } Left thumb anywhere on the left half walks, any way you drag it; tap or hold the right half to peck. The geese come in waves from both sides and the street holds still until the wave is down — then GO, and walk on. A goose that honks is about to lunge along its line: step off it or peck first. Three hearts each. Out of hearts you are down until a teammate stands over you for a moment. Everybody down at once and the geese carry the lot of you to the bay — that block is lost, and what you banked stays.`,
  waitingStreetLabel: "No street is loaded. Check the round's BRAWL rules.",
  sceneLabel: "Streets of Barrie",
  blockCounter: (blockNumber: number, blocksTotal: number): string => `Block ${blockNumber} of ${blocksTotal}`,
  tally: (banked: number, total: number): string => `${banked} / ${total}`,
  tallyLabel: "Worth",
  crewCounter: (out: number, roster: number): string => `${out} of ${roster} out`,
  bestTally: (banked: number, total: number): string => `${Math.round((banked / Math.max(1, total)) * 100)}%`,
  bestLabel: (teamName: string | null): string => (teamName === null ? "To beat" : `To beat · ${teamName}`),
  // The host's Start: the crew's fight, or — nobody stepped out — one hen on this screen.
  startCrewButtonLabel: "Start the fight",
  startTabletButtonLabel: "Play it on this tablet",
  startSoloButtonLabel: "Start",
  skipBlockButtonLabel: "Skip block",
  resetTurnButtonLabel: "Reset turn",
  restartButtonLabel: "Restart",
  waitingOnHint: (names: readonly string[]): string =>
    names.length === 0 ? "Everybody's out. Start when the room is ready." : `Not out yet: ${names.join(", ")}`,
  nextBlockHint: "Next block is on the line — the first thumb starts it, or Start does.",
  readyLockedHint: "Waiting for the host to open the round.",
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  finishedTitle: "Street clear",
  finishPoints: (points: number): string => `+${points}`,
  totalLine: (total: number): string => `Full points at ${total} worth`
} as const;
