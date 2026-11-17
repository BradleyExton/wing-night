import { MINIGAME_DEFINITIONS, type BrawlCrewOutcome } from "@wingnight/shared";

const OUTCOME_LINES: Record<BrawlCrewOutcome, string> = {
  cleared: "Block clear!",
  wipe: "To the bay with the lot of you.",
  timeout: "That's the bell."
};

export const displayBrawlSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.BRAWL.displayName,
  introDescription:
    "The whole team on the street at once, every goose in Barrie between you and the Spirit Catcher. Left thumb walks, right thumb pecks. Stand over a fallen friend to get her up. The room sees them coming first — shout.",
  waitingStreetLabel: "The street is being built…",
  sceneLabel: "Streets of Barrie",
  tally: (banked: number, total: number): string => `${banked} / ${total}`,
  tallyLabel: "Worth",
  blockCounter: (blockNumber: number, blocksTotal: number): string => `Block ${blockNumber} of ${blocksTotal}`,
  // Block one on the line: the room watches the team assemble.
  steppingOut: (out: number, names: readonly string[]): string => {
    if (out === 0) {
      return "Step out on your phone";
    }

    return names.length === 0 ? "Everybody's out — over to the host" : `${out} out — waiting on ${names.join(", ")}`;
  },
  nextBlock: (outcome: BrawlCrewOutcome | null): string =>
    outcome === null ? "Next block — first thumb starts it" : `${OUTCOME_LINES[outcome]} First thumb starts the next block.`,
  running: (wave: number, waves: number): string => `Wave ${Math.min(wave, waves)} of ${waves}`,
  walkOn: "GO — walk on",
  finishedPrompt: "That's the team's street.",
  finishedTitle: "Street clear",
  finishedBlurb: (banked: number, total: number): string => `${banked} of ${total} worth`,
  points: (points: number): string => `+${points}`
} as const;
