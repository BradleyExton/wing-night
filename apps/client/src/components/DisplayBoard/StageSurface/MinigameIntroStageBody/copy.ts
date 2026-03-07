import type { MinigameBriefingContent } from "../../../../copy/minigameBriefings";

export const minigameIntroStageCopy = {
  title: (teamName: string): string => `${teamName}`,
  calloutLabel: "Now Arriving",
  arrivalTitle: "You're up now.",
  arrivalSummary:
    "Head to the board and get set. The host will start once your team is in place.",
  fallbackTeamName: "Next Team",
  minigameLabel: "Mini-Game",
  sauceLabel: "Sauce",
  rosterLabel: "Team Roster",
  emptyRosterLabel: "No players assigned yet.",
  fallbackMinigameLabel: "Pending Selection",
  fallbackSauceLabel: "Pending",
  rulesTitle: "How This Turn Works",
  fallbackBriefingContent: {
    displayName: "Pending Selection",
    illustrationPath: "/display/setup/flow-minigame-intro.png",
    illustrationAlt: "Mini-game intro phase illustration",
    summary: "The host will explain this round once the next team is in position.",
    steps: [
      "Come to the board when your team is called.",
      "Listen for the host briefing before the round begins."
    ]
  } satisfies MinigameBriefingContent
} as const;
