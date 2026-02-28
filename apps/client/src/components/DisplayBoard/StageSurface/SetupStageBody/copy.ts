export const setupFlowStepIds = [
  "MINIGAME_INTRO",
  "EAT_WINGS",
  "MINIGAME_PLAY",
  "ROUND_RESULTS"
] as const;

export type SetupFlowStepId = (typeof setupFlowStepIds)[number];

export const setupStageCopy = {
  title: "Tonight at a Glance",
  subtitle: "Setup is in progress. Here is what everyone can expect before round one starts.",
  heroIllustrationAlt: "Wing Night setup hero illustration",
  textureIllustrationAlt: "Wing Night setup texture overlay",
  setupStatusTitle: "Live Setup",
  setupReadyLabel: "Ready to Start",
  setupInProgressLabel: "In Progress",
  teamCountChipLabel: (teamCount: number): string => `${teamCount} Teams`,
  playerCountChipLabel: (playerCount: number): string => `${playerCount} Players`,
  packChipLabel: (packName: string): string => `Pack: ${packName}`,
  packUnavailableChipLabel: "Pack: ...",
  roundsChipLabel: (roundCount: number): string =>
    `${roundCount} ${roundCount === 1 ? "Round" : "Rounds"}`,
  roundFlowTitle: "Round Flow",
  roundFlowSteps: [
    { id: "MINIGAME_INTRO", label: "Mini-Game Intro" },
    { id: "EAT_WINGS", label: "Eat Wings" },
    { id: "MINIGAME_PLAY", label: "Mini-Game Play" },
    { id: "ROUND_RESULTS", label: "Round Results" }
  ] as const satisfies readonly { id: SetupFlowStepId; label: string }[],
  flowIllustrationAlt: (stepLabel: string): string =>
    `${stepLabel} illustration`,
  roundLineupTitle: "Round Lineup",
  additionalRoundsLabel: (hiddenRoundCount: number): string =>
    `+${hiddenRoundCount} more rounds`,
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
  readonly title: string;
  readonly subtitle: string;
  readonly heroIllustrationAlt: string;
  readonly textureIllustrationAlt: string;
  readonly setupStatusTitle: string;
  readonly setupReadyLabel: string;
  readonly setupInProgressLabel: string;
  readonly teamCountChipLabel: (teamCount: number) => string;
  readonly playerCountChipLabel: (playerCount: number) => string;
  readonly packChipLabel: (packName: string) => string;
  readonly packUnavailableChipLabel: string;
  readonly roundsChipLabel: (roundCount: number) => string;
  readonly roundFlowTitle: string;
  readonly roundFlowSteps: readonly { id: SetupFlowStepId; label: string }[];
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
