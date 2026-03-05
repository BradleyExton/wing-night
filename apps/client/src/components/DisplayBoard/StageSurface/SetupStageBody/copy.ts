export const teamTurnLoopStepIds = [
  "MINIGAME_INTRO",
  "EAT_WINGS",
  "MINIGAME_PLAY",
  "TURN_RESULTS"
] as const;

export type TeamTurnLoopStepId = (typeof teamTurnLoopStepIds)[number];

export const setupStageCopy = {
  brandLabel: "Wing Night",
  lockedStatusLabel: "Game Locked In",
  lockedStatusDescription: "Host is about to start Round 1.",
  teamTurnLoopTitle: "Round Flow",
  teamTurnLoopSubtitle:
    "Each selected hot sauce is a round. In each round, every team runs the full cycle of Mini-Game Intro → Eat Wings → Mini-Game Play → Turn Results, then scores are finalized for the round.",
  teamTurnLoopSteps: [
    { id: "MINIGAME_INTRO", label: "Mini-Game Intro" },
    { id: "EAT_WINGS", label: "Eat Wings" },
    { id: "MINIGAME_PLAY", label: "Mini-Game Play" },
    { id: "TURN_RESULTS", label: "Turn Results" }
  ] as const satisfies readonly { id: TeamTurnLoopStepId; label: string }[],
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
  readonly lockedStatusLabel: string;
  readonly lockedStatusDescription: string;
  readonly teamTurnLoopTitle: string;
  readonly teamTurnLoopSubtitle: string;
  readonly teamTurnLoopSteps: readonly { id: TeamTurnLoopStepId; label: string }[];
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
