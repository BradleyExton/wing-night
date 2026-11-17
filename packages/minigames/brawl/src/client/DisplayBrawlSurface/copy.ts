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
  best: (banked: number, total: number, teamName: string | null): string =>
    `To beat ${Math.round((banked / Math.max(1, total)) * 100)}%${teamName === null ? "" : ` · ${teamName}`}`,
  // Block one on the line: the room watches the team assemble.
  steppingOut: (out: number, names: readonly string[]): string => {
    if (out === 0) {
      return "Step out on your phone";
    }

    return names.length === 0 ? "Everybody's out — over to the host" : `${out} out — waiting on ${names.join(", ")}`;
  },
  nextBlock: (outcome: BrawlCrewOutcome | null): string =>
    outcome === null ? "Next block — first thumb starts it" : `${OUTCOME_LINES[outcome]} First thumb starts the next block.`,
  // The one verb line, under the street for the whole fight (principles §11, 15).
  verbs: "Left thumb walks · right thumb pecks · stand over a fallen friend",
  finishedPrompt: "That's the team's street.",
  finishedTitle: (banked: number, total: number): string => (banked >= total ? "Clean streets!" : "Off the street"),
  finishedBlurb: (banked: number, total: number): string => `${banked} of ${total} worth`,
  points: (points: number): string => `+${points}`
} as const;
