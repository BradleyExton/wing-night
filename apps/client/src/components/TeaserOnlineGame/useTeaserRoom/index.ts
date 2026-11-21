import { useCallback, useEffect, useRef, useState } from "react";
import {
  resolveTeaserRoomSocketPath,
  type TeaserRoomClientMessage,
  type TeaserRoomGame,
  type TeaserRoomRefusal,
  type TeaserRoomServerMessage,
  type TeaserRoomSnapshot
} from "@wingnight/shared";

const CLIENT_ID_STORAGE_KEY = "wn-teaser-room-client";
const PING_EVERY_MS = 1000;
const RECONNECT_MS = 1000;
/** The ping readout is the median of this many of the latest round trips. */
const PINGS_KEPT = 10;

export type TeaserRoomConnection = "connecting" | "open" | "reconnecting";

export type TeaserRoomState = {
  connection: TeaserRoomConnection;
  room: TeaserRoomSnapshot | null;
  /** The player this phone sits as, or null while it only watches. */
  you: string | null;
  /** The room's last no, so the page can say why a tap did nothing. */
  refusal: TeaserRoomRefusal | null;
  pingMs: number | null;
  send: (message: TeaserRoomClientMessage) => void;
};

// One id per tab, kept across a reload so a refreshed phone is back in its seat.
const resolveClientId = (): string => {
  const fresh = `tab-${Math.random().toString(36).slice(2, 12)}`;

  try {
    const stored = window.sessionStorage.getItem(CLIENT_ID_STORAGE_KEY);

    if (stored !== null) {
      return stored;
    }

    window.sessionStorage.setItem(CLIENT_ID_STORAGE_KEY, fresh);
  } catch {
    // Private mode: a reload is a new phone, which only costs the seat.
  }

  return fresh;
};

const resolveMedian = (samples: readonly number[]): number | null => {
  if (samples.length === 0) {
    return null;
  }

  const sorted = [...samples].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)] ?? null;
};

const isServerMessage = (value: unknown): value is TeaserRoomServerMessage =>
  typeof value === "object" && value !== null && "t" in value;

/**
 * One phone's side of an online room (docs/minigames/base-borden-spec.md §0.5): a WebSocket to the
 * room's Durable Object on this page's own origin, which says hello as this tab, keeps the room's
 * latest snapshot, pings once a second for the readout, and reconnects on its own.
 */
export const useTeaserRoom = (code: string, game: TeaserRoomGame): TeaserRoomState => {
  const [connection, setConnection] = useState<TeaserRoomConnection>("connecting");
  const [room, setRoom] = useState<TeaserRoomSnapshot | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<TeaserRoomRefusal | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}${resolveTeaserRoomSocketPath(code, game)}`;
    const clientId = resolveClientId();
    const pings: number[] = [];
    let pingId = 0;
    let pingTimer = 0;
    let reconnectTimer = 0;
    let isDisposed = false;

    const connect = (): void => {
      const socket = new WebSocket(url);

      socketRef.current = socket;
      socket.addEventListener("open", () => {
        setConnection("open");
        socket.send(JSON.stringify({ t: "hello", clientId } satisfies TeaserRoomClientMessage));
      });
      socket.addEventListener("message", (event) => {
        if (typeof event.data !== "string") {
          return;
        }

        let message: unknown;

        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }

        if (!isServerMessage(message)) {
          return;
        }

        if (message.t === "room") {
          setRoom(message.room);
          setYou(message.you);
        } else if (message.t === "pong") {
          pings.push(performance.now() - message.sentAt);

          while (pings.length > PINGS_KEPT) {
            pings.shift();
          }

          setPingMs(resolveMedian(pings));
        } else {
          setRefusal(message.reason);
        }
      });
      socket.addEventListener("close", () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!isDisposed) {
          setConnection("reconnecting");
          reconnectTimer = window.setTimeout(connect, RECONNECT_MS);
        }
      });
    };

    connect();
    pingTimer = window.setInterval(() => {
      const socket = socketRef.current;

      if (socket?.readyState === WebSocket.OPEN) {
        pingId += 1;
        socket.send(JSON.stringify({ t: "ping", id: pingId, sentAt: performance.now() } satisfies TeaserRoomClientMessage));
      }
    }, PING_EVERY_MS);

    return (): void => {
      isDisposed = true;
      window.clearInterval(pingTimer);
      window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
    };
  }, [code, game]);

  const send = useCallback((message: TeaserRoomClientMessage): void => {
    const socket = socketRef.current;

    setRefusal(null);

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  return { connection, room, you, refusal, pingMs, send };
};
