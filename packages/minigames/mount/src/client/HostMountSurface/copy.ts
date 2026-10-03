import { formatHens } from "../lineHeight/index.js";

export const hostMountSurfaceCopy = {
  introDescription:
    "Your chickens climb one pile, a climb each: a Canada goose on the Spirit Catcher's plinth, and every hen that climbed before you, stuck exactly where it stopped. Touch a limb — either foot, the wing or the beak — drag it, and let go: wherever it is when you let go, it grabs. It holds until you touch it again. Get the top of your head above the line to mount. Your clock starts on your first touch: 30 seconds, plus three for every hen already on the pile. Run out and your hen stays where it is, part of the mountain, and banks how far it got.",
  waitingLabel: "No pile is loaded. Check the round's Mount Your Hens rules.",
  climbCounter: (climbNumber: number, climbsTotal: number): string => `Climb ${climbNumber} of ${climbsTotal}`,
  clockLabel: "Clock",
  lineLabel: "Line",
  lineHolder: (holderName: string, height: number): string => `${holderName} · ${formatHens(height)} hens`,
  gooseHolder: "The goose",
  unknownHolder: "A hen",
  readyHint: (playerName: string | null): string =>
    playerName === null
      ? "Touch a limb, drag it, let go to grab"
      : `${playerName}'s climb: touch a limb, drag it, let go to grab`,
  readyLockedHint: "Waiting for the host to open the round.",
  finishedHint: "That's the team. Advance the phase when the room is ready.",
  finishedTitle: "Pile built",
  finishPoints: (points: number): string => `+${points}`,
  skipClimbButtonLabel: "Skip climb",
  resetTurnButtonLabel: "Reset turn",
  restartButtonLabel: "Restart",
  totalLine: (climbs: number): string => `Full points for ${climbs} mounts`
} as const;
