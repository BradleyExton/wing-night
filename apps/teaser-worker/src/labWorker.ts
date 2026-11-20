// PROTOTYPE — throwaway (docs/minigames/base-borden-spec.md §0.7 step 1). The online jump lab:
// a Worker of its own (wrangler.lab.jsonc, `wingnight-lab` on workers.dev), so wingnight.tv is
// never touched by it. It serves the lab's pages and routes `/room/<CODE>` to one Durable Object
// per room. The room's rules live in ./labRoom/session, which runs on Node; this file only carries
// sockets and the clock to it, and is the only file of the lab that touches a workerd type.
import { DurableObject } from "cloudflare:workers";

import {
  LAB_ROOM_CODE_PATTERN,
  type LabServerMessage
} from "../../client/src/components/RunGunLab/onlineProtocol/index.ts";
import {
  advanceLabSession,
  closeLabSocket,
  createLabSession,
  openLabSocket,
  receiveLabMessage,
  type LabSession
} from "./labRoom/session/index.ts";

type LabEnv = {
  ASSETS: Fetcher;
  LAB_ROOM: DurableObjectNamespace<RunGunLabRoom>;
};

const ROOM_PATH_PREFIX = "/room/";
// Twice a tick, so a tick is never late by more than half of one.
const LOOP_INTERVAL_MS = 8;

/**
 * One room. Its yard lives in memory only: a lab room that is evicted simply starts again. The
 * loop runs while anyone is connected, which keeps the object awake for exactly that long.
 */
export class RunGunLabRoom extends DurableObject<LabEnv> {
  private session: LabSession = createLabSession();
  private readonly sockets = new Map<string, WebSocket>();
  private loop: ReturnType<typeof setInterval> | null = null;
  private nextSocketId = 1;

  override async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected a WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    const socketId = String(this.nextSocketId);

    this.nextSocketId += 1;
    server.accept();

    if (!openLabSocket(this.session, socketId, Date.now())) {
      this.send(server, { t: "refused", reason: "full" });
      server.close(1013, "full");

      return new Response(null, { status: 101, webSocket: client });
    }

    this.sockets.set(socketId, server);

    server.addEventListener("message", (event) => {
      const raw = typeof event.data === "string" ? event.data : "";
      const outbox = receiveLabMessage(this.session, socketId, raw, Date.now());

      for (const message of outbox.reply) {
        this.send(server, message);
      }

      for (const message of outbox.broadcast) {
        this.broadcast(message);
      }
    });

    const drop = (): void => {
      if (!this.sockets.delete(socketId)) {
        return;
      }

      closeLabSocket(this.session, socketId);

      if (this.sockets.size === 0) {
        this.stopLoop();
        this.session = createLabSession();
      }
    };

    server.addEventListener("close", drop);
    server.addEventListener("error", drop);
    this.startLoop();

    return new Response(null, { status: 101, webSocket: client });
  }

  private startLoop(): void {
    if (this.loop !== null) {
      return;
    }

    this.loop = setInterval(() => {
      const frame = advanceLabSession(this.session, Date.now());

      if (frame !== null) {
        this.broadcast(frame);
      }
    }, LOOP_INTERVAL_MS);
  }

  private stopLoop(): void {
    if (this.loop !== null) {
      clearInterval(this.loop);
      this.loop = null;
    }
  }

  private send(socket: WebSocket, message: LabServerMessage): void {
    try {
      socket.send(JSON.stringify(message));
    } catch {
      // A socket that is closing: its close handler tidies up.
    }
  }

  private broadcast(message: LabServerMessage): void {
    const data = JSON.stringify(message);

    for (const socket of this.sockets.values()) {
      try {
        socket.send(data);
      } catch {
        // As above.
      }
    }
  }
}

export default {
  async fetch(request: Request, env: LabEnv): Promise<Response> {
    const url = new URL(request.url);

    if (!url.pathname.startsWith(ROOM_PATH_PREFIX)) {
      return env.ASSETS.fetch(request);
    }

    const code = url.pathname.slice(ROOM_PATH_PREFIX.length);

    if (!LAB_ROOM_CODE_PATTERN.test(code)) {
      return new Response("Not a room", { status: 404 });
    }

    // A page on another site may not open a room here. A browser always sends Origin on a
    // WebSocket; a client that sends none is not a page, and the room's own guards still apply.
    const origin = request.headers.get("Origin");

    if (origin !== null && origin !== url.origin) {
      return new Response("Forbidden", { status: 403 });
    }

    return env.LAB_ROOM.getByName(code).fetch(request);
  }
} satisfies ExportedHandler<LabEnv>;
