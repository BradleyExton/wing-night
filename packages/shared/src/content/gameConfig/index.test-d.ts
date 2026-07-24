import type {
  GameConfigFile,
  MinigameRules,
  GameConfigRound,
  GameConfigScoring,
  GameConfigTimers,
  MinigameType
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

export type ValidMinigameRulesCheck = Assert<
  IsAssignable<{ trivia?: { questionsPerTurn: number } }, MinigameRules>
>;

export type ValidGeoMinigameRulesCheck = Assert<
  IsAssignable<
    {
      geo?: {
        promptsPerTurn: number;
        scoreBandsKm: { maxKm: number; points: number }[];
      };
    },
    MinigameRules
  >
>;

export type ValidGameConfigFileCheck = Assert<
  IsAssignable<
    {
      name: string;
      rounds: GameConfigRound[];
      minigameScoring: GameConfigScoring;
      timers: GameConfigTimers;
      minigameRules?: MinigameRules;
      setupPreviewRoundSlots?: number;
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

// @ts-expect-error Rules entries must be records, not primitives.
export type NonRecordRulesEntryCheck = Assert<IsAssignable<{ trivia: number }, MinigameRules>>;
