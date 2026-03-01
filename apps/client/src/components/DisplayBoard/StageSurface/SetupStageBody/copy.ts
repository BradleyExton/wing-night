export const teamTurnLoopStepIds = [
  "MINIGAME_INTRO",
  "EAT_WINGS",
  "MINIGAME_PLAY"
] as const;

export type TeamTurnLoopStepId = (typeof teamTurnLoopStepIds)[number];

export const setupStageCopy = {
  brandLabel: "Wing Night",
  brandSubLabel: "Display Setup",
  title: "Tonight at a Glance",
  subtitle: "Here is what everyone can expect before round one starts.",
  heroIllustrationAlt: "Wing Night setup hero illustration",
  roundFlowTitle: "Round Flow",
  roundStartTitle: "Round Start",
  roundStartLabel: "Round Intro",
  teamTurnLoopTitle: "Team Turn Loop",
  teamTurnLoopRepeatLabel: (teamCount: number): string =>
    `Repeats ${teamCount} ${teamCount === 1 ? "time" : "times"} this round`,
  teamTurnLoopSteps: [
    { id: "MINIGAME_INTRO", label: "Mini-Game Intro" },
    { id: "EAT_WINGS", label: "Eat Wings" },
    { id: "MINIGAME_PLAY", label: "Mini-Game Play" }
  ] as const satisfies readonly { id: TeamTurnLoopStepId; label: string }[],
  roundEndTitle: "Round End",
  roundEndLabel: "Round Results",
  singleActiveTeamRule: "Only one team is active at a time.",
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
  readonly brandSubLabel: string;
  readonly title: string;
  readonly subtitle: string;
  readonly heroIllustrationAlt: string;
  readonly roundFlowTitle: string;
  readonly roundStartTitle: string;
  readonly roundStartLabel: string;
  readonly teamTurnLoopTitle: string;
  readonly teamTurnLoopRepeatLabel: (teamCount: number) => string;
  readonly teamTurnLoopSteps: readonly { id: TeamTurnLoopStepId; label: string }[];
  readonly roundEndTitle: string;
  readonly roundEndLabel: string;
  readonly singleActiveTeamRule: string;
  readonly turnOrderPreviewTitle: string;
  readonly turnOrderFallbackLabel: string;
  readonly turnOrderTeamChipLabel: (position: number, teamName: string) => string;
  readonly flowIllustrationAlt: (stepLabel: string) => string;
  readonly roundLineupTitle: string;
  readonly additionalRoundsLabel: (hiddenRoundCount: number) => string;
  readonly roundTitle: (round: number, label: string) => string;
  readonly roundSummaryValue: (
    sauce: string,
    minigame: string,
    pointsPerPlayer: number
  ) => string;
  readonly minigameIconAlt: (minigame: string) => string;
  readonly expectationTitle: string;
  readonly expectations: readonly string[];
};
