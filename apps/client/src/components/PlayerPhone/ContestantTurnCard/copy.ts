import { MINIGAME_DEVICE_MODES } from "@wingnight/shared";

import type { PhoneTurn } from "../resolvePhoneTurn";

type CardLines = { eyebrow: string; title: string; voice: string; tv: string | null };

// Everything a phone says during its own team's turn when it is not the one playing. Never the
// game: only the contestant's phone draws it.
export const contestantTurnCardCopy = {
  lines: (turn: Exclude<PhoneTurn, { role: "play" }>, contestantName: string | null): CardLines => {
    if (turn.role === "briefing") {
      return turn.deviceMode === MINIGAME_DEVICE_MODES.PHONES
        ? {
            eyebrow: "Your team is up",
            title: "Grab your phone",
            voice: "It wakes up for your leg. Turn it sideways when it does.",
            tv: "Eyes on the TV till then."
          }
        : {
            eyebrow: "Your team is up",
            title: "Grab the tablet",
            voice: "This one's played on the tablet, passed hand to hand.",
            tv: "Eyes on the TV."
          };
    }

    if (turn.role === "next") {
      const after = contestantName === null ? "" : `After ${contestantName}. `;

      return turn.deviceMode === MINIGAME_DEVICE_MODES.PHONES
        ? {
            eyebrow: "Your team is up",
            title: "You're next",
            voice: `${after}Turn your phone sideways — it wakes up when it's yours.`,
            tv: contestantName === null ? "Eyes on the TV." : `Watch ${contestantName} on the TV.`
          }
        : {
            eyebrow: "Your team is up",
            title: "You're next",
            voice: contestantName === null ? "The tablet comes to you next." : `The tablet comes to you after ${contestantName}.`,
            tv: "Eyes on the TV."
          };
    }

    if (turn.role === "tablet") {
      return {
        eyebrow: "Your leg",
        title: "Grab the tablet",
        voice: "This leg's on the tablet. The host has it.",
        tv: null
      };
    }

    return {
      eyebrow: "Your team is up",
      title: "Watch the TV",
      voice: contestantName === null ? "It all happens up there." : `${contestantName}'s up. Shout them through it.`,
      tv: null
    };
  }
} as const;
