import type { MinigameApiVersion, MinigameType } from "../content/gameConfig/index.js";
import type {
  ConfigFileEdit,
  ConfigResultPayload
} from "../config/index.js";
import type {
  RoleScopedStateSnapshotEnvelope
} from "../roomState/index.js";
import type { MusicPlaybackSource } from "../musicPlayback/index.js";
import type {
  PlayerClaimGoneReason,
  PlayerClaimResult,
  PlayerReleaseResult
} from "../playerJoin/index.js";
import type { QuickPlayStartRequest } from "../quickPlay/index.js";

export { MINIGAME_API_VERSION } from "../content/gameConfig/index.js";
export type { MinigameApiVersion } from "../content/gameConfig/index.js";

export type HostSecretPayload = Record<"hostSecret", string>;
export type GameReorderTurnOrderPayload = HostSecretPayload &
  Record<"teamIds", string[]>;
export type SetupCreateTeamPayload = HostSecretPayload & Record<"name", string>;
export type SetupAddPlayerPayload = HostSecretPayload & Record<"name", string>;
export type SetupAssignPlayerPayload = HostSecretPayload &
  Record<"playerId", string> &
  Record<"teamId", string | null>;
export type ScoringSetWingParticipationPayload = HostSecretPayload &
  Record<"playerId", string> &
  Record<"didEat", boolean>;
export type ScoringAdjustTeamScorePayload = HostSecretPayload &
  Record<"teamId", string> &
  Record<"delta", number>;
export type MinigameActionPayload = HostSecretPayload &
  Record<"minigameId", MinigameType> &
  Record<"minigameApiVersion", MinigameApiVersion> &
  Record<"actionType", string> &
  Record<"actionPayload", unknown>;
export type TimerExtendPayload = HostSecretPayload &
  Record<"additionalSeconds", number>;
// On the `<audio>` element's own 0–1 scale; see `MUSIC_VOLUME_MIN`/`MAX`.
export type MusicSetVolumePayload = HostSecretPayload & Record<"volume", number>;
// The same scale, for the TV's effects bus.
export type SfxSetVolumePayload = HostSecretPayload & Record<"volume", number>;
export const TIMER_EXTEND_MAX_SECONDS = 600;

// The ONE client event in this contract that carries no host secret, because
// the DISPLAY is the only client that can send it: the TV owns the `<audio>`
// element, so only the TV knows a track finished. It is a REPORT, not a
// command — it names the track it just finished, and the mutation ignores it
// unless that is still the track the room believes is playing. A replay, a
// stale report from a display that reconnected, or a second display reporting
// the same track is therefore a no-op, and nothing here can reach game state.
export type MusicTrackEndedPayload = Record<"source", MusicPlaybackSource> &
  Record<"trackIndex", number>;

// `config:read` needs no argument beyond authorization; save and apply carry
// the edited files. Apply is save-then-reload, so it takes the same `files`.
export type ConfigReadPayload = HostSecretPayload;
export type ConfigSavePayload = HostSecretPayload &
  Record<"files", ConfigFileEdit[]>;
export type ConfigApplyPayload = ConfigSavePayload;

// The launcher's one event: the queue and the dealt teams, in one message, so
// the room either starts the whole session or none of it.
export type QuickPlayStartPayload = HostSecretPayload & QuickPlayStartRequest;

// The host frees a face a phone holds — any phase, because the host can always
// take a face back (a phone left in a coat, the wrong person on the night).
export type SetupReleasePlayerClaimPayload = HostSecretPayload & Record<"playerId", string>;

// The phone family (`player:*`), sent only by a PLAYER socket and carrying no
// host secret: a phone is authorized by the join token its handshake brought
// and, once it holds a face, by that face's claim secret. Both answer on a
// Socket.IO ack, so the secret goes back to the one socket that asked.
//
// `claimSecret` on a claim is the phone's current secret, if it has one: the
// same face claimed with its own secret is idempotent, which is how a phone
// that lost its socket takes its face back without a host.
export type PlayerClaimPayload = Record<"playerId", string> &
  Partial<Record<"claimSecret", string>>;
export type PlayerReleasePayload = Record<"claimSecret", string>;
export type PlayerClaimAck = (result: PlayerClaimResult) => void;
export type PlayerReleaseAck = (result: PlayerReleaseResult) => void;

// Server → one phone, over its `player:<id>` room: who this phone is. Later
// milestones grow this per-player channel (a contestant's turn, a ballot);
// anything only one player may see goes here, never in the shared snapshot.
export type PlayerSelfPayload = Record<"playerId", string>;

// Server → one phone: its face was taken off it by the host, a roster change,
// a reset or another socket. `playerId` is the face it held, when known.
export type PlayerClaimGonePayload = Record<"playerId", string | null> &
  Record<"reason", PlayerClaimGoneReason>;

// Server → the laptop's own DISPLAY sockets only: the join token the TV's
// player QR carries. Re-sent whenever Reset Game rotates it. A display opened
// anywhere else never receives it, and no snapshot ever carries it.
export type PlayerJoinTokenPayload = Record<"joinToken", string>;

export const CLIENT_TO_SERVER_EVENTS = {
  REQUEST_STATE: "client:requestState",
  CLAIM_CONTROL: "host:claimControl",
  NEXT_PHASE: "game:nextPhase",
  START_GAME: "game:startGame",
  SKIP_TURN_BOUNDARY: "game:skipTurnBoundary",
  REORDER_TURN_ORDER: "game:reorderTurnOrder",
  RESET: "game:reset",
  CREATE_TEAM: "setup:createTeam",
  ADD_PLAYER: "setup:addPlayer",
  ASSIGN_PLAYER: "setup:assignPlayer",
  AUTO_ASSIGN_REMAINING_PLAYERS: "setup:autoAssignRemainingPlayers",
  SET_WING_PARTICIPATION: "scoring:setWingParticipation",
  ADJUST_TEAM_SCORE: "scoring:adjustTeamScore",
  REDO_LAST_MUTATION: "scoring:redoLastMutation",
  MINIGAME_ACTION: "minigame:action",
  TIMER_PAUSE: "timer:pause",
  TIMER_RESUME: "timer:resume",
  TIMER_EXTEND: "timer:extend",
  MUSIC_PAUSE: "music:pause",
  MUSIC_RESUME: "music:resume",
  MUSIC_SKIP: "music:skip",
  MUSIC_PREVIOUS: "music:previous",
  MUSIC_SET_VOLUME: "music:setVolume",
  MUSIC_TRACK_ENDED: "music:trackEnded",
  SFX_SET_VOLUME: "sfx:setVolume",
  CONFIG_READ: "config:read",
  CONFIG_SAVE: "config:save",
  CONFIG_APPLY: "config:apply",
  QUICKPLAY_START: "quickplay:start",
  RELEASE_PLAYER_CLAIM: "setup:releasePlayerClaim",
  ROTATE_PLAYER_JOIN_TOKEN: "setup:rotatePlayerJoinToken",
  REQUEST_PLAYER_JOIN_TOKEN: "display:requestPlayerJoinToken",
  PLAYER_CLAIM: "player:claim",
  PLAYER_RELEASE: "player:release"
} as const;

export const SERVER_TO_CLIENT_EVENTS = {
  STATE_SNAPSHOT: "server:stateSnapshot",
  SECRET_ISSUED: "host:secretIssued",
  SECRET_INVALID: "host:secretInvalid",
  CONFIG_RESULT: "config:result",
  PLAYER_SELF: "player:self",
  PLAYER_CLAIM_GONE: "player:claimGone",
  PLAYER_JOIN_TOKEN: "display:playerJoinToken"
} as const;

export type ClientToServerEventName =
  (typeof CLIENT_TO_SERVER_EVENTS)[keyof typeof CLIENT_TO_SERVER_EVENTS];

export type ServerToClientEventName =
  (typeof SERVER_TO_CLIENT_EVENTS)[keyof typeof SERVER_TO_CLIENT_EVENTS];

export type ClientToServerEvents = {
  [CLIENT_TO_SERVER_EVENTS.REQUEST_STATE]: () => void;
  [CLIENT_TO_SERVER_EVENTS.CLAIM_CONTROL]: () => void;
  [CLIENT_TO_SERVER_EVENTS.NEXT_PHASE]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.START_GAME]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.SKIP_TURN_BOUNDARY]: (
    payload: HostSecretPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.REORDER_TURN_ORDER]: (
    payload: GameReorderTurnOrderPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.RESET]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.CREATE_TEAM]: (
    payload: SetupCreateTeamPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.ADD_PLAYER]: (payload: SetupAddPlayerPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.ASSIGN_PLAYER]: (
    payload: SetupAssignPlayerPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.AUTO_ASSIGN_REMAINING_PLAYERS]: (
    payload: HostSecretPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.SET_WING_PARTICIPATION]: (
    payload: ScoringSetWingParticipationPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.ADJUST_TEAM_SCORE]: (
    payload: ScoringAdjustTeamScorePayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.REDO_LAST_MUTATION]: (
    payload: HostSecretPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.MINIGAME_ACTION]: (
    payload: MinigameActionPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.TIMER_PAUSE]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.TIMER_RESUME]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.TIMER_EXTEND]: (payload: TimerExtendPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.MUSIC_PAUSE]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.MUSIC_RESUME]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.MUSIC_SKIP]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.MUSIC_PREVIOUS]: (payload: HostSecretPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.MUSIC_SET_VOLUME]: (
    payload: MusicSetVolumePayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.MUSIC_TRACK_ENDED]: (
    payload: MusicTrackEndedPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.SFX_SET_VOLUME]: (payload: SfxSetVolumePayload) => void;
  [CLIENT_TO_SERVER_EVENTS.CONFIG_READ]: (payload: ConfigReadPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.CONFIG_SAVE]: (payload: ConfigSavePayload) => void;
  [CLIENT_TO_SERVER_EVENTS.CONFIG_APPLY]: (payload: ConfigApplyPayload) => void;
  [CLIENT_TO_SERVER_EVENTS.QUICKPLAY_START]: (
    payload: QuickPlayStartPayload
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.RELEASE_PLAYER_CLAIM]: (
    payload: SetupReleasePlayerClaimPayload
  ) => void;
  // The host prints a new join code: new phones need it, seated phones keep
  // their faces (they reconnect on their claim secret).
  [CLIENT_TO_SERVER_EVENTS.ROTATE_PLAYER_JOIN_TOKEN]: (payload: HostSecretPayload) => void;
  // A read, like `client:requestState`, not a report: the laptop's display
  // asks for the join token it may have missed while its listener attached.
  // Answered only to a display on the laptop; nothing it reaches mutates.
  [CLIENT_TO_SERVER_EVENTS.REQUEST_PLAYER_JOIN_TOKEN]: () => void;
  [CLIENT_TO_SERVER_EVENTS.PLAYER_CLAIM]: (
    payload: PlayerClaimPayload,
    ack: PlayerClaimAck
  ) => void;
  [CLIENT_TO_SERVER_EVENTS.PLAYER_RELEASE]: (
    payload: PlayerReleasePayload,
    ack: PlayerReleaseAck
  ) => void;
};

export type ServerToClientEvents = {
  [SERVER_TO_CLIENT_EVENTS.STATE_SNAPSHOT]: (
    payload: RoleScopedStateSnapshotEnvelope
  ) => void;
  [SERVER_TO_CLIENT_EVENTS.SECRET_ISSUED]: (payload: HostSecretPayload) => void;
  [SERVER_TO_CLIENT_EVENTS.SECRET_INVALID]: () => void;
  [SERVER_TO_CLIENT_EVENTS.CONFIG_RESULT]: (
    payload: ConfigResultPayload
  ) => void;
  [SERVER_TO_CLIENT_EVENTS.PLAYER_SELF]: (payload: PlayerSelfPayload) => void;
  [SERVER_TO_CLIENT_EVENTS.PLAYER_CLAIM_GONE]: (
    payload: PlayerClaimGonePayload
  ) => void;
  [SERVER_TO_CLIENT_EVENTS.PLAYER_JOIN_TOKEN]: (
    payload: PlayerJoinTokenPayload
  ) => void;
};
