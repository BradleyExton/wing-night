import {
  type DisplayRoomStateSnapshot,
  type GameConfigFile,
  type GameConfigRound,
  type HostRoomStateSnapshot,
  type MinigameHostView,
  type Phase,
  type Player,
  type RoleScopedSnapshotByRole,
  type RoleScopedStateSnapshotEnvelope,
  type RoomState,
  type SocketClientRole,
  type TriviaPrompt,
  type Team
} from "../index.js";

type IsAssignable<From, To> = From extends To ? true : false;
type Assert<T extends true> = T;
type HasKey<T, TKey extends PropertyKey> = TKey extends keyof T ? true : false;

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

export type ValidMinigameHostViewCheck = Assert<
  IsAssignable<
    {
      minigame: "TRIVIA";
      activeTurnTeamId: string | null;
      attemptsRemaining: number;
      promptCursor: number;
      pendingPointsByTeamId: Record<string, number>;
      currentPrompt: TriviaPrompt | null;
    },
    MinigameHostView
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
      turnOrderTeamIds: string[];
      roundTurnCursor: number;
      completedRoundTurnTeamIds: string[];
      activeRoundTeamId: string | null;
      activeTurnTeamId: string | null;
      currentTriviaPrompt: TriviaPrompt | null;
      triviaPromptCursor: number;
      minigameHostView: RoomState["minigameHostView"];
      minigameDisplayView: RoomState["minigameDisplayView"];
      timer: RoomState["timer"];
      wingParticipationByPlayerId: Record<string, boolean>;
      pendingWingPointsByTeamId: Record<string, number>;
      pendingMinigamePointsByTeamId: Record<string, number>;
      fatalError: RoomState["fatalError"];
      canRedoScoringMutation: boolean;
      canAdvancePhase: boolean;
    },
    RoomState
  >
>;

export type HostSnapshotExtendsRoomStateCheck = Assert<
  IsAssignable<RoomState, HostRoomStateSnapshot>
>;

export type DisplaySnapshotShapeCheck = Assert<
  IsAssignable<
    {
      phase: Phase;
      currentRound: number;
      totalRounds: number;
      players: Player[];
      teams: Team[];
      gameConfig: GameConfigFile | null;
      currentRoundConfig: GameConfigRound | null;
      turnOrderTeamIds: string[];
      roundTurnCursor: number;
      completedRoundTurnTeamIds: string[];
      activeRoundTeamId: string | null;
      activeTurnTeamId: string | null;
      triviaPromptCursor: number;
      minigameDisplayView: RoomState["minigameDisplayView"];
      timer: RoomState["timer"];
      wingParticipationByPlayerId: Record<string, boolean>;
      pendingWingPointsByTeamId: Record<string, number>;
      pendingMinigamePointsByTeamId: Record<string, number>;
      fatalError: RoomState["fatalError"];
      canRedoScoringMutation: boolean;
      canAdvancePhase: boolean;
    },
    DisplayRoomStateSnapshot
  >
>;

export type DisplaySnapshotHasNoTriviaPromptsCheck = Assert<
  IsAssignable<HasKey<DisplayRoomStateSnapshot, "triviaPrompts">, false>
>;

export type DisplaySnapshotHasNoCurrentTriviaPromptCheck = Assert<
  IsAssignable<HasKey<DisplayRoomStateSnapshot, "currentTriviaPrompt">, false>
>;

export type DisplaySnapshotHasNoMinigameHostViewCheck = Assert<
  IsAssignable<HasKey<DisplayRoomStateSnapshot, "minigameHostView">, false>
>;

export type ValidRoleScopedSnapshotEnvelopeCheck = Assert<
  IsAssignable<
    | { clientRole: "HOST"; roomState: HostRoomStateSnapshot }
    | { clientRole: "DISPLAY"; roomState: DisplayRoomStateSnapshot },
    RoleScopedStateSnapshotEnvelope
  >
>;

export type HostRoleScopedSnapshotLookupCheck = Assert<
  IsAssignable<
    RoleScopedSnapshotByRole<Extract<SocketClientRole, "HOST">>,
    HostRoomStateSnapshot
  >
>;

export type DisplayRoleScopedSnapshotLookupCheck = Assert<
  IsAssignable<
    RoleScopedSnapshotByRole<Extract<SocketClientRole, "DISPLAY">>,
    DisplayRoomStateSnapshot
  >
>;

// @ts-expect-error Invalid phase literal should be rejected.
export type InvalidPhaseCheck = Assert<IsAssignable<"NOT_A_PHASE", Phase>>;

// @ts-expect-error Missing required Player.name.
export type MissingPlayerNameCheck = Assert<IsAssignable<{ id: string }, Player>>;

// @ts-expect-error MinigameHostView requires attemptsRemaining.
export type MissingTriviaAttemptsRemainingCheck = Assert<IsAssignable<{ minigame: "TRIVIA"; activeTurnTeamId: string | null; promptCursor: number; pendingPointsByTeamId: Record<string, number>; currentPrompt: TriviaPrompt | null }, MinigameHostView>>;

// @ts-expect-error Team.playerIds entries must be strings.
export type InvalidPlayerIdsCheck = Assert<IsAssignable<{ id: string; name: string; playerIds: number[]; totalScore: number }, Team>>;

// @ts-expect-error Team.totalScore is required.
export type MissingTotalScoreCheck = Assert<IsAssignable<{ id: string; name: string; playerIds: string[] }, Team>>;
