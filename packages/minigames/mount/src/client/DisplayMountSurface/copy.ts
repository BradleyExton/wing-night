import { MINIGAME_DEFINITIONS } from "@wingnight/shared";

import { formatHens } from "../lineHeight/index.js";

export const displayMountSurfaceCopy = {
  title: MINIGAME_DEFINITIONS.MOUNT.displayName,
  introDescription:
    "One pile, a climb each: the goose on the Spirit Catcher's plinth, and every hen that climbed before you, stuck where it stopped. Drag a limb, let go to grab. Get above the line. The room sees the whole pile — call the holds.",
  waitingLabel: "The pile is being built…",
  gooseHolder: "The goose",
  unknownHolder: "A hen",
  sceneLabel: (playerName: string | null): string =>
    playerName === null ? "Mount Your Hens" : `Mount Your Hens — ${playerName}'s climb`,
  readyPrompt: (playerName: string | null, lineHeight: number): string =>
    `${playerName ?? "Next hen"} is up — the line is ${formatHens(lineHeight)} hens up`,
  runningPrompt: (playerName: string | null): string =>
    playerName === null ? "Climbing — call the holds!" : `${playerName} is climbing — call the holds!`,
  heldPrompt: (endedName: string | null): string => (endedName === null ? "That's the climb" : `That's ${endedName}'s climb`),
  finishedPrompt: "That's the team's pile.",
  finishedTitle: "Pile built",
  finishedBlurb: (mounted: number, climbs: number): string => `${mounted} of ${climbs} mounted`,
  points: (points: number): string => `+${points}`
} as const;
