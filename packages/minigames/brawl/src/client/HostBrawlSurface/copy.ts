import { formatGoonsTally } from "../goonsTally/index.js";

export const hostBrawlSurfaceCopy = {
  introDescription:
    "Your chickens brawl down Dunlop Street to the Spirit Catcher as a relay — one block each, and the street belongs to the geese. Hold your left thumb down anywhere on the left half and the hen walks the way she faces; pull it back to turn her round. Tap or hold anywhere on the right half to peck. The goons come in from both sides in waves and the street holds still until the wave is down — then GO, and walk on. A goose that honks is about to lunge: step back or peck first. Three hearts, then the geese carry you to the bay, and the next teammate takes the tablet. Everything you put down counts, whatever happens to you after.",
  waitingStreetLabel: "No street is loaded. Check the round's BRAWL rules.",
  blockCounter: (blockNumber: number, blocksTotal: number): string => `Block ${blockNumber} of ${blocksTotal}`,
  readyHint: (playerName: string | null): string =>
    playerName === null
      ? "On the line — hold left to walk, pull back to turn, tap right to peck"
      : `${playerName} is on the line — hold left to walk, pull back to turn, tap right to peck`,
  readyLockedHint: "Waiting for the host to open the round.",
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  // One glyph per heart; the paint loop lights and dims them.
  heart: "♥",
  heartsLabel: "Hearts",
  goonsTally: formatGoonsTally,
  goonsLabel: "Down",
  bestGoons: (goons: number): string => `${goons}`,
  bestLabel: (teamName: string | null): string => (teamName === null ? "To beat" : `To beat · ${teamName}`),
  finishedTitle: "Street clear",
  finishPoints: (points: number): string => `+${points}`,
  skipBlockButtonLabel: "Skip block",
  resetTurnButtonLabel: "Reset turn",
  restartButtonLabel: "Restart",
  totalLine: (total: number): string => `Full points at ${total} down`
} as const;
