// PROTOTYPE — throwaway (docs/minigames/base-borden-spec.md §0.7 step 1). The online jump lab's
// room, as plain state and functions so it runs and is tested on Node: the Durable Object in
// src/labWorker.ts only carries sockets and a timer to it. The yard is the LAN lab's own sim,
// imported from the client, so both labs play the same physics; the room steps it at 60 Hz and
// every phone draws the frames it sends.
import {
  LAB_ROOM_HENS_MAX,
  LAB_ROOM_SOCKETS_MAX,
  parseLabClientMessage,
  type LabServerMessage
} from "../../../../client/src/components/RunGunLab/onlineProtocol/index.ts";
import {
  DEFAULT_YARD_TUNING,
  addHen,
  applyHenInput,
  createYardWorld,
  removeHen,
  stepYard,
  type YardWorld
} from "../../../../client/src/components/RunGunLab/yardSim/index.ts";

const TICK_MS = 1000 / 60;
/** A frame goes to every phone this often, and straight after any pad message it applied. */
export const LAB_FRAME_EVERY_TICKS = 2;
/** A room that stalled owes at most this much time: it never fast-forwards through a fight. */
const MAX_OWED_MS = 100;
/** The party phones' token bucket, in messages: a burst, and a refill a second. */
const BUCKET_BURST = 40;
const BUCKET_REFILL_PER_SECOND = 30;

type LabSeat = {
  /** Null until the phone says hello. */
  padId: string | null;
  /** Whether this socket's pad has a hen; a phone that came in full watches. */
  hasHen: boolean;
  lastSeq: number;
  tokens: number;
  refilledAtMs: number;
};

export type LabSession = {
  world: YardWorld;
  seats: Map<string, LabSeat>;
  lastStepAtMs: number | null;
  owedMs: number;
  ticksSinceFrame: number;
};

/** What a handler wants sent: to the socket that spoke, and to every socket in the room. */
export type LabOutbox = { reply: LabServerMessage[]; broadcast: LabServerMessage[] };

const emptyOutbox = (): LabOutbox => ({ reply: [], broadcast: [] });

export const createLabSession = (): LabSession => ({
  world: createYardWorld(),
  seats: new Map(),
  lastStepAtMs: null,
  owedMs: 0,
  ticksSinceFrame: 0
});

const resolveAcks = (session: LabSession): Record<string, number> => {
  const acks: Record<string, number> = {};

  for (const seat of session.seats.values()) {
    if (seat.padId !== null && seat.hasHen) {
      acks[seat.padId] = seat.lastSeq;
    }
  }

  return acks;
};

export const createLabFrame = (session: LabSession): LabServerMessage => ({
  t: "frame",
  world: session.world,
  acks: resolveAcks(session)
});

/** A socket opened. False when the room already holds as many as it ever will. */
export const openLabSocket = (session: LabSession, socketId: string, nowMs: number): boolean => {
  if (session.seats.size >= LAB_ROOM_SOCKETS_MAX) {
    return false;
  }

  session.seats.set(socketId, { padId: null, hasHen: false, lastSeq: 0, tokens: BUCKET_BURST, refilledAtMs: nowMs });

  return true;
};

const isPadInRoom = (session: LabSession, padId: string, exceptSocketId: string): boolean => {
  for (const [socketId, seat] of session.seats) {
    if (socketId !== exceptSocketId && seat.padId === padId) {
      return true;
    }
  }

  return false;
};

const takeToken = (seat: LabSeat, nowMs: number): boolean => {
  seat.tokens = Math.min(BUCKET_BURST, seat.tokens + ((nowMs - seat.refilledAtMs) / 1000) * BUCKET_REFILL_PER_SECOND);
  seat.refilledAtMs = nowMs;

  if (seat.tokens < 1) {
    return false;
  }

  seat.tokens -= 1;

  return true;
};

/** A socket spoke. Anything malformed, too fast, or from a socket the room never opened is refused. */
export const receiveLabMessage = (session: LabSession, socketId: string, raw: string, nowMs: number): LabOutbox => {
  const outbox = emptyOutbox();
  const seat = session.seats.get(socketId);

  if (seat === undefined) {
    return outbox;
  }

  if (!takeToken(seat, nowMs)) {
    outbox.reply.push({ t: "refused", reason: "rate_limited" });

    return outbox;
  }

  const message = parseLabClientMessage(raw);

  if (message === null) {
    outbox.reply.push({ t: "refused", reason: "malformed" });

    return outbox;
  }

  if (message.t === "ping") {
    outbox.reply.push({ t: "pong", id: message.id, sentAt: message.sentAt });

    return outbox;
  }

  if (message.t === "hello") {
    if (seat.padId !== null) {
      return outbox;
    }

    // The same pad on two sockets (a reload that beat its own close) keeps one hen.
    const hasHenAlready = session.world.hens.some((hen) => hen.padId === message.padId);
    const hasRoom = session.world.hens.length < LAB_ROOM_HENS_MAX;

    seat.padId = message.padId;
    seat.hasHen = hasHenAlready || hasRoom;

    if (!hasHenAlready && hasRoom) {
      addHen(session.world, message.padId);
    }

    const hen = session.world.hens.find((candidate) => candidate.padId === message.padId);

    outbox.reply.push({ t: "welcome", padId: message.padId, slot: seat.hasHen ? (hen?.slot ?? null) : null });
    outbox.broadcast.push(createLabFrame(session));

    return outbox;
  }

  const hen = seat.hasHen ? session.world.hens.find((candidate) => candidate.padId === seat.padId) : undefined;

  if (hen === undefined || message.seq <= seat.lastSeq) {
    return outbox;
  }

  seat.lastSeq = message.seq;
  applyHenInput(session.world, hen, { dir: message.dir, jumpSeq: message.jumpSeq });
  outbox.broadcast.push(createLabFrame(session));
  session.ticksSinceFrame = 0;

  return outbox;
};

/** A socket closed. Its hen leaves with it, unless the same pad is still here on another socket. */
export const closeLabSocket = (session: LabSession, socketId: string): void => {
  const seat = session.seats.get(socketId);

  session.seats.delete(socketId);

  if (seat?.padId !== null && seat?.padId !== undefined && !isPadInRoom(session, seat.padId, socketId)) {
    removeHen(session.world, seat.padId);
  }
};

/** The room's clock: steps every tick owed since the last call, and says when a frame is due. */
export const advanceLabSession = (session: LabSession, nowMs: number): LabServerMessage | null => {
  if (session.lastStepAtMs === null) {
    session.lastStepAtMs = nowMs;

    return null;
  }

  session.owedMs += Math.min(MAX_OWED_MS, nowMs - session.lastStepAtMs);
  session.lastStepAtMs = nowMs;

  let stepped = false;

  while (session.owedMs >= TICK_MS) {
    stepYard(session.world, DEFAULT_YARD_TUNING);
    session.owedMs -= TICK_MS;
    session.ticksSinceFrame += 1;
    stepped = true;
  }

  if (stepped && session.ticksSinceFrame >= LAB_FRAME_EVERY_TICKS) {
    session.ticksSinceFrame = 0;

    return createLabFrame(session);
  }

  return null;
};
