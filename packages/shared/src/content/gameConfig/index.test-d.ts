import type {
  GameConfigFile,
  MinigameRules,
  GameConfigRound,
  GameConfigScoring,
  GameConfigTimers,
  MinigameType,
  TriviaMinigameRules
} from "../../index.js";

type Assert<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;

export type ValidMinigameTypeCheck = Assert<
  IsAssignable<"TRIVIA", MinigameType>
>;

export type ValidGameConfigRoundCheck = Assert<
  IsAssignable<
    {
      round: number;
      label: string;
      sauce: string;
      pointsPerPlayer: number;
      minigame: MinigameType;
    },
    GameConfigRound
  >
>;

export type ValidGameConfigScoringCheck = Assert<
  IsAssignable<{ defaultMax: number; finalRoundMax: number }, GameConfigScoring>
>;

export type ValidGameConfigTimersCheck = Assert<
  IsAssignable<
    {
      eatingSeconds: number;
      triviaSeconds: number;
      geoSeconds: number;
      drawingSeconds: number;
    },
    GameConfigTimers
  >
>;

export type ValidTriviaMinigameRulesCheck = Assert<
  IsAssignable<{ questionsPerTurn: number }, TriviaMinigameRules>
>;

export type ValidMinigameRulesCheck = Assert<
  IsAssignable<{ trivia?: TriviaMinigameRules }, MinigameRules>
>;

export type ValidGameConfigFileCheck = Assert<
  IsAssignable<
    {
      name: string;
      rounds: GameConfigRound[];
      minigameScoring: GameConfigScoring;
      timers: GameConfigTimers;
      minigameRules?: MinigameRules;
    },
    GameConfigFile
  >
>;

// @ts-expect-error Minigame value must be a known literal.
export type InvalidMinigameTypeCheck = Assert<IsAssignable<"RACING", MinigameType>>;

// @ts-expect-error Round minigame is required.
export type MissingRoundMinigameCheck = Assert<IsAssignable<{ round: number; label: string; sauce: string; pointsPerPlayer: number }, GameConfigRound>>;

// @ts-expect-error timers must include drawingSeconds.
export type MissingTimerFieldCheck = Assert<IsAssignable<{ eatingSeconds: number; triviaSeconds: number; geoSeconds: number }, GameConfigTimers>>;

// @ts-expect-error Trivia rules require questionsPerTurn.
export type MissingTriviaQuestionLimitCheck = Assert<IsAssignable<{}, TriviaMinigameRules>>;
