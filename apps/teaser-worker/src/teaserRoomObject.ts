// An online room's Durable Object (docs/minigames/base-borden-spec.md §0.5): one per room code,
// reached through `/api/rooms/<CODE>/socket?game=<GAME>` (src/index.ts). It carries sockets, a timer and the
// roster file to the room's rules in ./teaserRoom/session, which run on Node; this file and
// src/index.ts are the only ones that touch a workerd type.
//
// The room lives in memory: a room the platform evicts (nobody connected for a while) is simply
// a fresh room the next time someone opens its link. Its sockets are the plain accepted kind, not
// hibernated, so a room is awake (and counting Durable Object time) while any phone holds it open.
import { DurableObject } from "cloudflare:workers";
import { schlonicDevManifest } from "@wingnight/minigames-schlonic/dev";
import {
  TEASER_ROSTER_PATH,
  isTeaserRoomCode,
  isTeaserRoomGame,
  parseTeaserRoster,
  type TeaserRoomServerMessage,
  type TeaserRoster
} from "@wingnight/shared";

import {
  closeRoomSocket,
  createRoomSnapshot,
  createTeaserRoomSession,
  fireRoomDeadline,
  openRoomSocket,
  receiveRoomMessage,
  resolveRoomDeadline,
  resolveSocketPlayerId,
  type TeaserRoomSession
} from "./teaserRoom/session/index.ts";

type RoomEnv = { ASSETS: Fetcher };

// The site's own fallback when the roster file is missing or empty (apps/client's useTeaserRoster):
// the room and the page must agree on who can be picked.
const FALLBACK_ROSTER: TeaserRoster = { players: schlonicDevManifest.players, teams: schlonicDevManifest.teams };
// The party server's deadline grace: fire a hair after the game asked, never before.
const DEADLINE_GRACE_MS = 25;

const loadRoster = async (assets: Fetcher, origin: string): Promise<TeaserRoster> => {
  try {
    const response = await assets.fetch(new URL(TEASER_ROSTER_PATH, origin));

    return response.ok ? (parseTeaserRoster(await response.json()) ?? FALLBACK_ROSTER) : FALLBACK_ROSTER;
  } catch {
    return FALLBACK_ROSTER;
  }
};

export class TeaserRoom extends DurableObject<RoomEnv> {
  private session: TeaserRoomSession | null = null;
  private readonly sockets = new Map<string, WebSocket>();
  private deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private nextSocketId = 1;

  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket", { status: 426 });
    }

    const url = new URL(request.url);
    const code = url.pathname.split("/")[3] ?? "";

    if (!isTeaserRoomCode(code)) {
      return new Response("Not a room", { status: 404 });
    }

    const game = url.searchParams.get("game") ?? "BRAWL";

    if (!isTeaserRoomGame(game)) {
      return new Response("Not a game", { status: 404 });
    }

    // The Worker names this object by its game and code, so the first socket's game is the room's.
    this.session ??= createTeaserRoomSession(code, await loadRoster(this.env.ASSETS, url.origin), game);

    const session = this.session;
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const socketId = String(this.nextSocketId);

    this.nextSocketId += 1;
    server.accept();

    if (!openRoomSocket(session, socketId, Date.now())) {
      this.send(server, { t: "refused", reason: "full" });
      server.close(1013, "full");

      return new Response(null, { status: 101, webSocket: client });
    }

    this.sockets.set(socketId, server);

    server.addEventListener("message", (event) => {
      const raw = typeof event.data === "string" ? event.data : "";
      const outbox = receiveRoomMessage(session, socketId, raw, Date.now());

      for (const message of outbox.reply) {
        this.send(server, message);
      }

      if (outbox.changed) {
        this.afterChange();
      }
    });

    const drop = (): void => {
      if (!this.sockets.delete(socketId)) {
        return;
      }

      if (closeRoomSocket(session, socketId)) {
        this.afterChange();
      }

      if (this.sockets.size === 0) {
        this.clearDeadline();
      }
    };

    server.addEventListener("close", drop);
    server.addEventListener("error", drop);
    this.afterChange();

    return new Response(null, { status: 101, webSocket: client });
  }

  // Every phone gets the room again, each told which player it is, and the game's clock is set.
  private afterChange(): void {
    const session = this.session;

    if (session === null) {
      return;
    }

    const room = createRoomSnapshot(session);

    for (const [socketId, socket] of this.sockets) {
      this.send(socket, { t: "room", you: resolveSocketPlayerId(session, socketId), room });
    }

    this.scheduleDeadline();
  }

  private scheduleDeadline(): void {
    this.clearDeadline();

    const session = this.session;
    const atMs = session === null ? null : resolveRoomDeadline(session);

    if (session === null || atMs === null || this.sockets.size === 0) {
      return;
    }

    this.deadlineTimer = setTimeout(
      () => {
        this.deadlineTimer = null;

        if (fireRoomDeadline(session, Date.now())) {
          this.afterChange();
        } else if (atMs > Date.now()) {
          // Woke early: wait out the rest. A deadline that has passed and changed nothing is
          // left alone, so a game that stops asking can never spin this timer.
          this.scheduleDeadline();
        }
      },
      Math.max(0, atMs - Date.now()) + DEADLINE_GRACE_MS
    );
  }

  private clearDeadline(): void {
    if (this.deadlineTimer !== null) {
      clearTimeout(this.deadlineTimer);
      this.deadlineTimer = null;
    }
  }

  private send(socket: WebSocket, message: TeaserRoomServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // A socket that is closing: its close handler tidies up.
    }
  }
}
