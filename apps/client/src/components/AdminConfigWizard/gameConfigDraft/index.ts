import {
  MINIGAME_TYPES,
  type GameConfigFile,
  type GameConfigRound,
  type GameConfigTimers,
  type MinigameType
} from "@wingnight/shared";

// The wizard's edit vocabulary over a `GameConfigFile`, as pure transforms.
//
// They return a new file rather than mutating one because the draft is React
// state, and because `apply` sends the WHOLE file — `ConfigFileEdit.value` is
// the file's next contents, not a delta — so the draft has to stay a valid
// `GameConfigFile` at every keystroke, not only at submit time.

export type TimerKey = keyof GameConfigTimers;

// `round` is positional and the shared validator enforces it: a round at index
// i must carry `round === i + 1` "so round numbers stay contiguous". Every
// structural edit therefore re-numbers, rather than trusting the caller to.
const withContiguousRoundNumbers = (
  rounds: GameConfigRound[]
): GameConfigRound[] => {
  return rounds.map((round, index) => ({ ...round, round: index + 1 }));
};

export const setGameConfigName = (
  gameConfig: GameConfigFile,
  name: string
): GameConfigFile => {
  return { ...gameConfig, name };
};

export const setRoundField = (
  gameConfig: GameConfigFile,
  roundIndex: number,
  edit: Partial<GameConfigRound>
): GameConfigFile => {
  return {
    ...gameConfig,
    rounds: gameConfig.rounds.map((round, index) =>
      index === roundIndex ? { ...round, ...edit } : round
    )
  };
};

// Seeded from the last round so a new round inherits a plausible sauce and
// scoring rather than arriving invalid and immediately failing validation.
const nextRoundTemplate = (rounds: GameConfigRound[]): GameConfigRound => {
  const lastRound = rounds.at(-1);

  return {
    round: rounds.length + 1,
    label: "",
    sauce: lastRound?.sauce ?? "",
    pointsPerPlayer: lastRound?.pointsPerPlayer ?? 1,
    minigame: lastRound?.minigame ?? (MINIGAME_TYPES[0] as MinigameType)
  };
};

export const addRound = (gameConfig: GameConfigFile): GameConfigFile => {
  return {
    ...gameConfig,
    rounds: withContiguousRoundNumbers([
      ...gameConfig.rounds,
      nextRoundTemplate(gameConfig.rounds)
    ])
  };
};

export const removeRound = (
  gameConfig: GameConfigFile,
  roundIndex: number
): GameConfigFile => {
  return {
    ...gameConfig,
    rounds: withContiguousRoundNumbers(
      gameConfig.rounds.filter((_round, index) => index !== roundIndex)
    )
  };
};

export const setTimer = (
  gameConfig: GameConfigFile,
  timerKey: TimerKey,
  seconds: number
): GameConfigFile => {
  return {
    ...gameConfig,
    timers: { ...gameConfig.timers, [timerKey]: seconds }
  };
};

export const setScoring = (
  gameConfig: GameConfigFile,
  edit: Partial<GameConfigFile["minigameScoring"]>
): GameConfigFile => {
  return {
    ...gameConfig,
    minigameScoring: { ...gameConfig.minigameScoring, ...edit }
  };
};

// Number fields are typed freely, so an in-flight value can be empty or
// mid-edit ("1" on the way to "12"). Falling back to the previous value keeps
// the draft a valid GameConfigFile at every keystroke; the shared validator
// still has the final say at apply.
export const parsePositiveInteger = (
  rawValue: string,
  fallback: number
): number => {
  const parsedValue = Number.parseInt(rawValue, 10);

  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
};
