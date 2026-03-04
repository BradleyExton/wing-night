export const teamTurnLoopStepIds = [
  "MINIGAME_INTRO",
  "EAT_WINGS",
  "MINIGAME_PLAY"
] as const;

export type TeamTurnLoopStepId = (typeof teamTurnLoopStepIds)[number];

export const setupStageCopy = {
  brandLabel: "Wing Night",
  roundStartLabel: "Round Start",
  teamTurnLoopTitle: "Round Flow",
  teamTurnLoopSubtitle:
    "Each selected hot sauce is a round. In each round, every team runs the full cycle of Mini-Game Intro → Eat Wings → Mini-Game Play, then the Round Results are calculated.",
  teamTurnLoopSteps: [
    { id: "MINIGAME_INTRO", label: "Mini-Game Intro" },
    { id: "EAT_WINGS", label: "Eat Wings" },
    { id: "MINIGAME_PLAY", label: "Mini-Game Play" }
  ] as const satisfies readonly { id: TeamTurnLoopStepId; label: string }[],
  roundEndLabel: "Round Results",
  turnOrderPreviewTitle: "Turn Order This Round",
  turnOrderFallbackLabel: "Teams appear here once setup assignments are complete.",
  turnOrderTeamChipLabel: (position: number, teamName: string): string =>
    `${position}. ${teamName}`,
  flowIllustrationAlt: (stepLabel: string): string =>
    `${stepLabel} illustration`,
  roundLineupTitle: "Round Lineup",
  additionalRoundsLabel: (hiddenRoundCount: number): string =>
    `+${hiddenRoundCount} more ${hiddenRoundCount === 1 ? "round" : "rounds"}`,
  roundTitle: (round: number, label: string): string => `Round ${round}: ${label}`,
  placeholderRoundTitle: (round: number): string => `Round ${round}: Open Slot`,
  placeholderRoundSummary: "Choose sauce and mini-game to lock this round.",
  roundSummaryValue: (
    sauce: string,
    minigame: string,
    pointsPerPlayer: number
  ): string => `${sauce} | ${minigame} | ${pointsPerPlayer} pts/player`,
  minigameIconAlt: (minigame: string): string => `${minigame} mini-game icon`,
  expectationTitle: "House Rules",
  expectations: [
    "One team is active at a time during each round.",
    "Round totals combine wing points and mini-game points.",
    "Host controls pacing and can use skip or redo when needed."
  ]
} as const satisfies {
  readonly brandLabel: string;
  readonly roundStartLabel: string;
  readonly teamTurnLoopTitle: string;
  readonly teamTurnLoopSubtitle: string;
  readonly teamTurnLoopSteps: readonly { id: TeamTurnLoopStepId; label: string }[];
  readonly roundEndLabel: string;
  readonly turnOrderPreviewTitle: string;
  readonly turnOrderFallbackLabel: string;
  readonly turnOrderTeamChipLabel: (position: number, teamName: string) => string;
  readonly flowIllustrationAlt: (stepLabel: string) => string;
  readonly roundLineupTitle: string;
  readonly additionalRoundsLabel: (hiddenRoundCount: number) => string;
  readonly roundTitle: (round: number, label: string) => string;
  readonly placeholderRoundTitle: (round: number) => string;
  readonly placeholderRoundSummary: string;
  readonly roundSummaryValue: (
    sauce: string,
    minigame: string,
    pointsPerPlayer: number
  ) => string;
  readonly minigameIconAlt: (minigame: string) => string;
  readonly expectationTitle: string;
  readonly expectations: readonly string[];
};
