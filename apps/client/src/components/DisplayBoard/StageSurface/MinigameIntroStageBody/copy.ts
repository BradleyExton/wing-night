import type { MinigameType } from "@wingnight/shared";

export const minigameIntroStageCopy = {
  eyebrow: "Team Briefing",
  title: (teamName: string): string => `${teamName}: Get Ready to Eat & Play`,
  fallbackTeamName: "Next Team",
  minigameLabel: "Mini-Game",
  sauceLabel: "Hot Sauce",
  fallbackMinigameLabel: "Pending Selection",
  fallbackSauceLabel: "Pending Selection",
  summary:
    "Review the rules on screen, then start eating when your team is ready.",
  rulesTitle: "Rules",
  rulesByMinigame: {
    TRIVIA: [
      "One question is shown at a time.",
      "Host marks each attempt as correct or incorrect.",
      "Correct answers add points for your team."
    ],
    GEO: [
      "Listen for the host instructions before each prompt.",
      "Work together quickly and commit to one answer.",
      "Points are awarded based on host scoring."
    ],
    DRAWING: [
      "One teammate draws while teammates guess.",
      "Keep guesses short and clear so host can score quickly.",
      "Points are awarded from host scoring for the turn."
    ]
  } as const satisfies Record<MinigameType, readonly string[]>,
  fallbackRules: [
    "Host will explain this mini-game before starting.",
    "Follow the prompt and score instructions on the next phase."
  ],
  heroIllustrationPath: "/display/setup/flow-minigame-intro.png",
  heroIllustrationAlt: "Mini-game intro phase illustration"
} as const;
