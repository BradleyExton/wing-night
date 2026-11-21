// An online room on the teaser (docs/minigames/base-borden-spec.md §0.5), as plain state and
// functions so it runs and is tested on Node: the Durable Object in src/teaserRoomObject.ts only
// carries sockets, a timer and the roster file to it. The room is the party server's crew turn
// with no host and no TV: it seats phones as roster players, runs the game's own runtime
// reducer, stamps every thumb with the room's clock and the seat it came from, refuses anything a
// phone may not send, and fires the game's own deadline (the crew games' pulse).
import { bordenRuntimePlugin } from "@wingnight/minigames-borden";
import { brawlRuntimePlugin } from "@wingnight/minigames-brawl";
import type { MinigameRuntimePlugin, SerializableValue } from "@wingnight/minigames-core";
import {
  TEASER_ROOM_GAME_RULES,
  TEASER_ROOM_SOCKETS_MAX,
  parseTeaserRoomClientMessage,
  type Player,
  type Team,
  type TeaserRoomGame,
  type TeaserRoomPhase,
  type TeaserRoomServerMessage,
  type TeaserRoomSnapshot,
  type TeaserRoster
} from "@wingnight/shared";

// The round's points cap, as on every teaser game (TEASER_POINTS_MAX in apps/client).
const POINTS_MAX = 15;
// The party phones' token bucket: a burst, and a refill a second. A thumb at eight-way sends a
// few messages a second; this is for a phone gone wrong.
const BUCKET_BURST = 40;
const BUCKET_REFILL_PER_SECOND = 30;

type RoomGameEntry = {
  plugin: MinigameRuntimePlugin;
  rules: SerializableValue;
  /** The host's action that starts the game's first stage once everyone has stepped out. */
  startAction: string;
};

// The games a room plays, with the rules the teaser plays them by (Streets of Barrie's are the
// solo page's, apps/client/src/components/TeaserSoloGame/teaserGames; Base Borden's are its
// runtime's defaults).
const ROOM_GAMES: Record<TeaserRoomGame, RoomGameEntry> = {
  BRAWL: { plugin: brawlRuntimePlugin, rules: { blocksPerTurn: 3, courseSeed: 20261001 }, startAction: "startBlock" },
  BORDEN: { plugin: bordenRuntimePlugin, rules: { stretchesPerTurn: 3, courseSeed: 20261120 }, startAction: "startStretch" }
};

type RoomSocket = {
  /** Null until the phone says hello. */
  clientId: string | null;
  tokens: number;
  refilledAtMs: number;
};

type RoomSeat = {
  playerId: string;
  clientId: string;
};

export type TeaserRoomSession = {
  code: string;
  game: TeaserRoomGame;
  roster: TeaserRoster;
  sockets: Map<string, RoomSocket>;
  seats: RoomSeat[];
  phase: TeaserRoomPhase;
  /** The game's runtime state, once a game has started. */
  state: SerializableValue | null;
  /** What the last finished game hands the next (`selectRoundMemory`): the best turn to beat. */
  roundMemory: SerializableValue | null;
};

/** What a handler wants sent: to the socket that spoke, and whether every socket needs the room again. */
export type TeaserRoomOutbox = { reply: TeaserRoomServerMessage[]; changed: boolean };

const unchanged = (reply: TeaserRoomServerMessage[] = []): TeaserRoomOutbox => ({ reply, changed: false });
const changed = (): TeaserRoomOutbox => ({ reply: [], changed: true });

export const createTeaserRoomSession = (code: string, roster: TeaserRoster, game: TeaserRoomGame = "BRAWL"): TeaserRoomSession => ({
  code,
  game,
  roster,
  sockets: new Map(),
  seats: [],
  phase: "lobby",
  state: null,
  roundMemory: null
});

const entryOf = (session: TeaserRoomSession): RoomGameEntry => ROOM_GAMES[session.game];

const selectorInput = (session: TeaserRoomSession) => ({
  state: session.state,
  rules: entryOf(session).rules,
  content: null
});

const isClientConnected = (session: TeaserRoomSession, clientId: string): boolean => {
  for (const socket of session.sockets.values()) {
    if (socket.clientId === clientId) {
      return true;
    }
  }

  return false;
};

/** The player a socket plays as, or null while it only watches. */
export const resolveSocketPlayerId = (session: TeaserRoomSession, socketId: string): string | null => {
  const clientId = session.sockets.get(socketId)?.clientId ?? null;

  return clientId === null ? null : (session.seats.find((seat) => seat.clientId === clientId)?.playerId ?? null);
};

export const createRoomSnapshot = (session: TeaserRoomSession): TeaserRoomSnapshot => {
  const input = selectorInput(session);
  const { plugin } = entryOf(session);
  const crew = session.state === null ? null : (plugin.selectCrew?.(input) ?? null);

  return {
    code: session.code,
    game: session.game,
    phase: session.phase,
    seats: session.seats.map((seat) => ({ playerId: seat.playerId, connected: isClientConnected(session, seat.clientId) })),
    view: session.state === null ? null : plugin.selectHostView(input),
    pads: crew?.pads ?? {},
    crewStatus: crew?.status ?? null
  };
};

/** A socket opened. False when the room already holds as many as it ever will. */
export const openRoomSocket = (session: TeaserRoomSession, socketId: string, nowMs: number): boolean => {
  if (session.sockets.size >= TEASER_ROOM_SOCKETS_MAX) {
    return false;
  }

  session.sockets.set(socketId, { clientId: null, tokens: BUCKET_BURST, refilledAtMs: nowMs });

  return true;
};

const takeToken = (socket: RoomSocket, nowMs: number): boolean => {
  // A clock that stepped back refills nothing, and never drains the bucket.
  const elapsedMs = Math.max(0, nowMs - socket.refilledAtMs);

  socket.tokens = Math.min(BUCKET_BURST, socket.tokens + (elapsedMs / 1000) * BUCKET_REFILL_PER_SECOND);
  socket.refilledAtMs = Math.max(nowMs, socket.refilledAtMs);

  if (socket.tokens < 1) {
    return false;
  }

  socket.tokens -= 1;

  return true;
};

const reduce = (
  session: TeaserRoomSession,
  actionType: string,
  actionPayload: SerializableValue,
  nowMs: number,
  actorPlayerId?: string
): boolean => {
  const { plugin, rules } = entryOf(session);
  const result = plugin.reduceAction({
    state: session.state,
    envelope: { actionType, actionPayload, receivedAtMs: nowMs, ...(actorPlayerId === undefined ? {} : { actorPlayerId }) },
    pointsMax: POINTS_MAX,
    rules,
    content: null
  });

  if (!result.didMutate) {
    return false;
  }

  session.state = result.state;

  // A crew game with no stage in hand has played its last one.
  if (plugin.selectCrew?.(selectorInput(session)) === null) {
    session.phase = "finished";
    session.roundMemory = plugin.selectRoundMemory?.(selectorInput(session)) ?? session.roundMemory;
  }

  return true;
};

/** The team the game is played as: the first player's own, with everyone seated on it. */
const resolveRoomTeam = (session: TeaserRoomSession, players: Player[]): Team => {
  const firstId = players[0]?.id;
  const home = session.roster.teams.find((team) => firstId !== undefined && team.playerIds.includes(firstId)) ?? session.roster.teams[0];

  return {
    id: home?.id ?? "room",
    name: home?.name ?? session.code,
    playerIds: players.map((player) => player.id),
    totalScore: 0,
    ...(home?.genre === undefined ? {} : { genre: home.genre }),
    ...(home?.color === undefined ? {} : { color: home.color })
  };
};

// Everyone seated steps out at once (the lobby was the assembling), then the room starts the
// first stage as the party's host would: a stage started with nobody out would be the tablet's.
const startGame = (session: TeaserRoomSession, nowMs: number): boolean => {
  const players = session.seats
    .map((seat) => session.roster.players.find((player) => player.id === seat.playerId))
    .filter((player): player is Player => player !== undefined);

  if (players.length === 0) {
    return false;
  }

  const team = resolveRoomTeam(session, players);
  const { plugin, rules } = entryOf(session);

  session.state = plugin.initialize({
    teamIds: [team.id],
    players,
    teams: [team],
    activeRoundTeamId: team.id,
    pointsMax: POINTS_MAX,
    pendingPointsByTeamId: {},
    rules,
    content: null,
    roundMemory: session.roundMemory
  });
  session.phase = "playing";

  for (const player of players) {
    reduce(session, "stepOut", {}, nowMs, player.id);
  }

  reduce(session, entryOf(session).startAction, {}, nowMs);

  return true;
};

const isSeatable = (session: TeaserRoomSession): boolean => session.phase !== "playing";

/** A socket spoke. Anything malformed, too fast, or not this phone's to send is refused. */
export const receiveRoomMessage = (
  session: TeaserRoomSession,
  socketId: string,
  raw: string,
  nowMs: number
): TeaserRoomOutbox => {
  const socket = session.sockets.get(socketId);

  if (socket === undefined) {
    return unchanged();
  }

  if (!takeToken(socket, nowMs)) {
    return unchanged([{ t: "refused", reason: "rate_limited" }]);
  }

  const message = parseTeaserRoomClientMessage(raw);

  if (message === null) {
    return unchanged([{ t: "refused", reason: "malformed" }]);
  }

  if (message.t === "ping") {
    return unchanged([{ t: "pong", id: message.id, sentAt: message.sentAt }]);
  }

  if (message.t === "hello") {
    if (socket.clientId !== null) {
      return unchanged();
    }

    // A reload says hello with the tab's own id, and is back in the seat it had.
    socket.clientId = message.clientId;

    return changed();
  }

  const clientId = socket.clientId;

  if (clientId === null) {
    return unchanged([{ t: "refused", reason: "not_seated" }]);
  }

  const mySeat = session.seats.find((seat) => seat.clientId === clientId);

  if (message.t === "seat") {
    if (!isSeatable(session)) {
      return unchanged([{ t: "refused", reason: "refused" }]);
    }

    if (message.playerId === null) {
      session.seats = session.seats.filter((seat) => seat.clientId !== clientId);

      return changed();
    }

    const playerId = message.playerId;

    if (!session.roster.players.some((player) => player.id === playerId)) {
      return unchanged([{ t: "refused", reason: "refused" }]);
    }

    if (session.seats.some((seat) => seat.playerId === playerId && seat.clientId !== clientId)) {
      return unchanged([{ t: "refused", reason: "seat_taken" }]);
    }

    if (mySeat !== undefined) {
      mySeat.playerId = playerId;

      return changed();
    }

    if (session.seats.length >= TEASER_ROOM_GAME_RULES[session.game].seatsMax) {
      return unchanged([{ t: "refused", reason: "full" }]);
    }

    session.seats.push({ playerId, clientId });

    return changed();
  }

  if (mySeat === undefined) {
    return unchanged([{ t: "refused", reason: "not_seated" }]);
  }

  if (message.t === "start") {
    return isSeatable(session) && startGame(session, nowMs) ? changed() : unchanged([{ t: "refused", reason: "refused" }]);
  }

  // A thumb. Only the game's own phone actions, only from a player in the crew, and always as
  // the player this socket sat down as: nothing in the payload names a player.
  const { plugin } = entryOf(session);
  const crew = session.phase === "playing" ? (plugin.selectCrew?.(selectorInput(session)) ?? null) : null;

  if (
    crew === null ||
    !(plugin.contestantActionTypes ?? []).includes(message.actionType) ||
    !crew.playerIds.includes(mySeat.playerId)
  ) {
    return unchanged([{ t: "refused", reason: "refused" }]);
  }

  return reduce(session, message.actionType, message.actionPayload as SerializableValue, nowMs, mySeat.playerId)
    ? changed()
    : unchanged();
};

/**
 * A socket closed. Outside a game its phone's seat goes with it (unless the same tab is still
 * here on another socket); during a game the seat is kept for a reload, and the hen sits down on
 * her own once the thumbs go quiet.
 */
export const closeRoomSocket = (session: TeaserRoomSession, socketId: string): boolean => {
  const socket = session.sockets.get(socketId);

  session.sockets.delete(socketId);

  if (socket?.clientId === null || socket === undefined) {
    return false;
  }

  if (isSeatable(session) && !isClientConnected(session, socket.clientId)) {
    session.seats = session.seats.filter((seat) => seat.clientId !== socket.clientId);
  }

  return true;
};

/** When the game next wants the room's own clock (`selectDeadlineAction`), or null. */
export const resolveRoomDeadline = (session: TeaserRoomSession): number | null =>
  session.phase === "playing" ? (entryOf(session).plugin.selectDeadlineAction?.(selectorInput(session))?.atMs ?? null) : null;

/** The room's clock reached the game's deadline: send its action, as the party server does. */
export const fireRoomDeadline = (session: TeaserRoomSession, nowMs: number): boolean => {
  if (session.phase !== "playing") {
    return false;
  }

  const deadline = entryOf(session).plugin.selectDeadlineAction?.(selectorInput(session)) ?? null;

  return deadline !== null && nowMs >= deadline.atMs ? reduce(session, deadline.actionType, {}, nowMs) : false;
};
