import { useEffect, useRef, useState } from "react";

import { resolveMedian, resolvePadId } from "../../Pad";
import type { LabClientMessage, LabServerMessage } from "../../onlineProtocol";
import { DEFAULT_YARD_TUNING, createYardWorld, stepYard, type StickDir, type YardWorld } from "../../yardSim";

const PAD_ID_STORAGE_KEY = "proto-rungun-online-pad-id";
const TICK_MS = 1000 / 60;
const KEEPALIVE_MS = 500;
const PING_EVERY_MS = 1000;
const RECONNECT_MS = 1000;
/** How far a phone steps its copy past the last frame before it waits for the room. */
const MAX_TICKS_AHEAD = 30;
/** The readouts are medians of this many of the latest samples. */
const SAMPLES_KEPT = 12;

export type LabRoomStatus = "connecting" | "playing" | "watching" | "reconnecting";

export type LabRoom = {
  /** The yard as this phone has it now: the room's last frame, stepped forward on this phone's clock. */
  worldRef: { current: YardWorld };
  /** Goes up every painted frame, so the scene re-renders. */
  frame: number;
  status: LabRoomStatus;
  padId: string;
  slot: number | null;
  /** From a thumb changing to the room's frame that carries it arriving back: what the player feels. */
  inputMs: number | null;
  pingMs: number | null;
  sendStick: (dir: StickDir) => void;
  sendJump: () => void;
};

const keepLatest = (samples: number[], sample: number): void => {
  samples.push(sample);

  while (samples.length > SAMPLES_KEPT) {
    samples.shift();
  }
};

/**
 * PROTOTYPE — throwaway (docs/minigames/base-borden-spec.md §0.5). One phone's side of an online
 * lab room: it sends the thumbs, adopts every frame the room sends and steps its own copy of the
 * yard forward between them, exactly as the spec's phones will. No prediction: her own hen moves
 * when the room says so, which is the delay the lab is here to measure.
 */
export const useLabRoom = (code: string): LabRoom => {
  const worldRef = useRef<YardWorld>(createYardWorld());
  const [frame, setFrame] = useState(0);
  const [status, setStatus] = useState<LabRoomStatus>("connecting");
  const [slot, setSlot] = useState<number | null>(null);
  const [inputMs, setInputMs] = useState<number | null>(null);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [padId] = useState(() => resolvePadId(PAD_ID_STORAGE_KEY));
  const input = useRef<{ dir: StickDir; jumpSeq: number; dirty: boolean }>({ dir: 0, jumpSeq: 0, dirty: false });

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/room/${code}`;
    const sentAtBySeq = new Map<number, number>();
    const inputSamples: number[] = [];
    const pingSamples: number[] = [];
    let socket: WebSocket | null = null;
    let seq = 0;
    let pingId = 0;
    let lastSentAt = 0;
    let lastPingAt = 0;
    let lastStepAt = performance.now();
    let owedMs = 0;
    let ticksAhead = 0;
    let handle = 0;
    let reconnectTimer = 0;
    let isDisposed = false;

    const send = (message: LabClientMessage): void => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      }
    };

    const receive = (message: LabServerMessage): void => {
      const now = performance.now();

      if (message.t === "welcome") {
        setSlot(message.slot);
        setStatus(message.slot === null ? "watching" : "playing");

        return;
      }

      if (message.t === "pong") {
        keepLatest(pingSamples, now - message.sentAt);
        setPingMs(resolveMedian(pingSamples));

        return;
      }

      if (message.t === "refused") {
        if (message.reason === "full") {
          setStatus("watching");
        }

        return;
      }

      worldRef.current = message.world;
      lastStepAt = now;
      owedMs = 0;
      ticksAhead = 0;

      const acked = message.acks[padId];

      if (acked !== undefined) {
        for (const [sentSeq, sentAt] of sentAtBySeq) {
          if (sentSeq <= acked) {
            keepLatest(inputSamples, now - sentAt);
            sentAtBySeq.delete(sentSeq);
          }
        }

        setInputMs(resolveMedian(inputSamples));
      }
    };

    const connect = (): void => {
      socket = new WebSocket(url);
      socket.addEventListener("open", () => {
        send({ t: "hello", padId });
        input.current.dirty = true;
      });
      socket.addEventListener("message", (event) => {
        if (typeof event.data === "string") {
          receive(JSON.parse(event.data) as LabServerMessage);
        }
      });
      socket.addEventListener("close", () => {
        if (!isDisposed) {
          setStatus("reconnecting");
          reconnectTimer = window.setTimeout(connect, RECONNECT_MS);
        }
      });
    };

    const loop = (now: number): void => {
      const state = input.current;

      if (socket?.readyState === WebSocket.OPEN) {
        if (state.dirty || now - lastSentAt > KEEPALIVE_MS) {
          seq += 1;

          // Only a thumb that changed is timed; a keepalive moves nothing on the screen.
          if (state.dirty) {
            sentAtBySeq.set(seq, now);
          }

          state.dirty = false;
          lastSentAt = now;
          send({ t: "pad", seq, dir: state.dir, jumpSeq: state.jumpSeq });
        }

        if (now - lastPingAt > PING_EVERY_MS) {
          pingId += 1;
          lastPingAt = now;
          send({ t: "ping", id: pingId, sentAt: now });
        }
      }

      owedMs += Math.min(100, now - lastStepAt);
      lastStepAt = now;

      while (owedMs >= TICK_MS && ticksAhead < MAX_TICKS_AHEAD) {
        stepYard(worldRef.current, DEFAULT_YARD_TUNING);
        owedMs -= TICK_MS;
        ticksAhead += 1;
      }

      setFrame((value) => value + 1);
      handle = window.requestAnimationFrame(loop);
    };

    connect();
    handle = window.requestAnimationFrame(loop);

    return (): void => {
      isDisposed = true;
      window.cancelAnimationFrame(handle);
      window.clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [code, padId]);

  return {
    worldRef,
    frame,
    status,
    padId,
    slot,
    inputMs,
    pingMs,
    sendStick: (dir) => {
      input.current.dir = dir;
      input.current.dirty = true;
    },
    sendJump: () => {
      input.current.jumpSeq += 1;
      input.current.dirty = true;
    }
  };
};
