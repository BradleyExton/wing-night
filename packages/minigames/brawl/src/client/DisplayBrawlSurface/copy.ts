import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

export const displayBrawlSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.BRAWL.displayName,
  introDescription:
    "One street, three hearts, a block each, and every goose in Barrie between you and the Spirit Catcher. Walk with your left thumb, peck with your right. The room sees them coming first — shout.",
  waitingStreetLabel: "The street is being built…",
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Streets of Barrie" : `Streets of Barrie — ${playerName}'s block`,
  readyPrompt: (playerName: string | null): string =>
    playerName === null ? "On the line" : `${playerName} is on the line`,
  runningPrompt: (playerName: string | null): string =>
    playerName === null ? "Brawling!" : `${playerName} is brawling — count the wave down!`,
  // The callout over the street names who is next; this line only says whose block just ended.
  heldPrompt: (endedName: string | null): string => (endedName === null ? "That's the block" : `That's ${endedName}'s block`),
  finishedPrompt: "That's the team's street.",
  finishedTitle: "Street clear",
  finishedBlurb: (worth: number, total: number): string => `${worth} of ${total} worth`,
  points: (points: number): string => `+${points}`
} as const;
