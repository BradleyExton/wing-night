import {
  type GameConfigFile,
  type GameConfigRound,
  type Phase,
  type Player,
  type RoomState,
  type TriviaPrompt,
  type Team
} from "../index.js";

type IsAssignable<From, To> = From extends To ? true : false;
type Assert<T extends true> = T;

export type ValidPlayerCheck = Assert<
  IsAssignable<
    {
      id: string;
      name: string;
      avatarSrc?: string;
    },
    Player
  >
>;

export type ValidTeamCheck = Assert<
  IsAssignable<
    {
      id: string;
      name: string;
      playerIds: string[];
      totalScore: number;
    },
    Team
  >
>;

export type ValidRoomStateCheck = Assert<
  IsAssignable<
    {
      phase: Phase;
      currentRound: number;
      totalRounds: number;
      players: Player[];
      teams: Team[];
      gameConfig: GameConfigFile | null;
      triviaPrompts: TriviaPrompt[];
      currentRoundConfig: GameConfigRound | null;
      wingParticipationByPlayerId: Record<string, boolean>;
      pendingWingPointsByTeamId: Record<string, number>;
      pendingMinigamePointsByTeamId: Record<string, number>;
    },
    RoomState
  >
>;

// @ts-expect-error Invalid phase literal should be rejected.
export type InvalidPhaseCheck = Assert<IsAssignable<"NOT_A_PHASE", Phase>>;

// @ts-expect-error Missing required Player.name.
export type MissingPlayerNameCheck = Assert<IsAssignable<{ id: string }, Player>>;

// @ts-expect-error Team.playerIds entries must be strings.
export type InvalidPlayerIdsCheck = Assert<IsAssignable<{ id: string; name: string; playerIds: number[]; totalScore: number }, Team>>;

// @ts-expect-error Team.totalScore is required.
export type MissingTotalScoreCheck = Assert<IsAssignable<{ id: string; name: string; playerIds: string[] }, Team>>;
