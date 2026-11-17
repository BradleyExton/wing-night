import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { useIsLandscape } from "../../PhoneGameFrame/useIsLandscape";
import { brawlProtoLabCopy } from "../copy";
import { connectPad, type PadSocket, type TvAck } from "../link";
import { padInk, resolveSlotColour } from "../palette";
import * as styles from "./styles";

const copy = brawlProtoLabCopy.pad;

const PAD_ID_STORAGE_KEY = "proto-brawl-pad-id";
/** How far the thumb travels from where it landed to full speed, in CSS px. */
const STICK_RADIUS = 56;
/** The share of that travel that is still "standing". */
const STICK_DEAD_ZONE = 0.2;
const KEEPALIVE_MS = 500;
/** The readout is the median of the round trips in this window: an idle pad only speaks twice a second. */
const RTT_WINDOW_MS = 2500;
const HEADER_HEIGHT = 40;
/** A street that has not answered for this long has closed; the pad takes up with the next one. */
const TV_SILENCE_MS = 2000;

type StickView = { cx: number; cy: number; kx: number; ky: number };

type StickTouch = { pointerId: number; cx: number; cy: number };

// One id per tab, kept across a reload so a refresh is the same hen.
const resolvePadId = (): string => {
  const fresh = `pad-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const stored = window.sessionStorage.getItem(PAD_ID_STORAGE_KEY);

    if (stored !== null) {
      return stored;
    }

    window.sessionStorage.setItem(PAD_ID_STORAGE_KEY, fresh);
  } catch {
    // Private mode: a fresh hen each load is fine.
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

/**
 * PROTOTYPE — throwaway. The phone half of the four-at-once Streets of Barrie controls lab: a
 * gamepad and nothing else, because the player's eyes are on the TV. The left half is a floating
 * stick (wherever the thumb lands is its centre, and the centre follows a thumb that outruns it);
 * the right half is PECK, on touch and while held. It says what the thumbs are doing and times
 * how long the street takes to answer.
 */
export const BrawlPadLab = (): JSX.Element => {
  const isLandscape = useIsLandscape();
  const [stickView, setStickView] = useState<StickView | null>(null);
  const [isPecking, setIsPecking] = useState(false);
  const [ack, setAck] = useState<TvAck | null>(null);
  const [rttMs, setRttMs] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const input = useRef({ x: 0, y: 0, peckSeq: 0, dirty: true });
  const stick = useRef<StickTouch | null>(null);
  const peckPointers = useRef(new Set<number>());
  const socketRef = useRef<PadSocket | null>(null);

  useEffect(() => {
    const socket = connectPad(resolvePadId());
    const samples: { at: number; rtt: number }[] = [];
    let median: number | null = null;
    let seq = 0;
    let lastSentAt = 0;
    let lastHits = 0;
    let lastKos = 0;
    let lastShownAt = 0;
    let handle = 0;
    let tvId: string | null = null;
    let tvHeardAt = 0;

    socketRef.current = socket;
    socket.on("connect", () => {
      setIsConnected(true);
      input.current.dirty = true;
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    socket.on("tv:ack", (next) => {
      const now = performance.now();

      // Two street pages open at once both answer, each with its own slot for this pad: listen
      // to the first, until it goes quiet.
      if (tvId !== null && next.tvId !== tvId && now - tvHeardAt < TV_SILENCE_MS) {
        return;
      }

      tvId = next.tvId;
      tvHeardAt = now;
      samples.push({ at: now, rtt: now - next.sentAt });

      while (samples[0] !== undefined && now - samples[0].at > RTT_WINDOW_MS) {
        samples.shift();
      }

      median = resolveMedian(samples.map((sample) => sample.rtt));

      // The phone's own "that landed": the one thing a player looking at the TV can feel.
      // Android only — Safari has no vibration.
      if (next.hits > lastHits) {
        navigator.vibrate?.(120);
      } else if (next.kos > lastKos) {
        navigator.vibrate?.(25);
      }

      const changed = next.hits !== lastHits || next.kos !== lastKos;

      lastHits = next.hits;
      lastKos = next.kos;

      if (changed || now - lastShownAt > 250) {
        lastShownAt = now;
        setAck(next);
        setRttMs(median);
      }
    });

    const loop = (now: number): void => {
      const state = input.current;

      if (socket.connected && (state.dirty || now - lastSentAt > KEEPALIVE_MS)) {
        seq += 1;
        state.dirty = false;
        lastSentAt = now;
        socket.emit("pad:state", {
          seq,
          x: state.x,
          y: state.y,
          peckHeld: peckPointers.current.size > 0,
          peckSeq: state.peckSeq,
          sentAt: performance.now(),
          rttMs: median
        });
      }

      handle = window.requestAnimationFrame(loop);
    };

    handle = window.requestAnimationFrame(loop);

    return (): void => {
      window.cancelAnimationFrame(handle);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const moveStick = (touch: StickTouch, clientX: number, clientY: number): void => {
    let dx = clientX - touch.cx;
    let dy = clientY - touch.cy;
    const distance = Math.hypot(dx, dy);

    if (distance > STICK_RADIUS) {
      // The centre is dragged along behind a thumb that outruns the ring, so turning back is
      // always one radius away however far the thumb has wandered.
      const overshoot = (distance - STICK_RADIUS) / distance;

      touch.cx += dx * overshoot;
      touch.cy += dy * overshoot;
      dx = clientX - touch.cx;
      dy = clientY - touch.cy;
    }

    const travel = Math.min(1, Math.hypot(dx, dy) / STICK_RADIUS);
    const pushed = travel <= STICK_DEAD_ZONE ? 0 : (travel - STICK_DEAD_ZONE) / (1 - STICK_DEAD_ZONE);
    const length = Math.hypot(dx, dy) || 1;

    input.current.x = (dx / length) * pushed;
    input.current.y = (dy / length) * pushed;
    input.current.dirty = true;
    setStickView({ cx: touch.cx, cy: touch.cy, kx: clientX, ky: clientY });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    if (event.clientX < window.innerWidth / 2 && stick.current === null) {
      stick.current = { pointerId: event.pointerId, cx: event.clientX, cy: event.clientY };
      moveStick(stick.current, event.clientX, event.clientY);

      return;
    }

    peckPointers.current.add(event.pointerId);
    input.current.peckSeq += 1;
    input.current.dirty = true;
    setIsPecking(true);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (stick.current !== null && stick.current.pointerId === event.pointerId) {
      moveStick(stick.current, event.clientX, event.clientY);
    }
  };

  const onPointerEnd = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (stick.current !== null && stick.current.pointerId === event.pointerId) {
      stick.current = null;
      input.current.x = 0;
      input.current.y = 0;
      input.current.dirty = true;
      setStickView(null);

      return;
    }

    if (peckPointers.current.delete(event.pointerId)) {
      input.current.dirty = true;
      setIsPecking(peckPointers.current.size > 0);
    }
  };

  const colour = ack === null ? padInk.dim : resolveSlotColour(ack.slot);
  const status = !isConnected ? copy.connecting : ack === null ? copy.waiting : null;

  return (
    <div
      className={styles.root}
      data-proto-brawl-pad=""
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onContextMenu={(event): void => {
        event.preventDefault();
      }}
    >
      <svg className={styles.overlay} width="100%" height="100%" aria-hidden>
        {isPecking && <rect x="50%" y={0} width="50%" height="100%" fill={colour} opacity={0.3} />}
        <rect x={0} y={0} width="100%" height={HEADER_HEIGHT} fill={colour} opacity={0.9} />
        <rect x="50%" y={HEADER_HEIGHT} width={1} height="100%" fill={padInk.dim} opacity={0.5} />
        {ack !== null && (
          <text className={styles.header} x={14} y={HEADER_HEIGHT / 2} dominantBaseline="central">
            {copy.playerTag(ack.slot)} {copy.hearts(ack.hearts)}
          </text>
        )}
        <text className={styles.header} x="100%" dx={-14} y={HEADER_HEIGHT / 2} dominantBaseline="central" textAnchor="end">
          {copy.roundTrip(rttMs)}
        </text>
        <text className={styles.zoneLabel} x="25%" y="50%" textAnchor="middle" fill={padInk.dim}>
          {copy.walk}
        </text>
        <text className={styles.zoneHint} x="25%" y="50%" dy={26} textAnchor="middle" fill={padInk.dim}>
          {copy.walkHint}
        </text>
        <text className={styles.zoneLabel} x="75%" y="50%" textAnchor="middle" fill={isPecking ? padInk.text : padInk.dim}>
          {copy.peck}
        </text>
        <text className={styles.zoneHint} x="75%" y="50%" dy={26} textAnchor="middle" fill={padInk.dim}>
          {copy.peckHint}
        </text>
        {status !== null && (
          <text className={styles.zoneHint} x="50%" y="100%" dy={-16} textAnchor="middle" fill={padInk.text}>
            {status}
          </text>
        )}
        {stickView !== null && (
          <g>
            <circle cx={stickView.cx} cy={stickView.cy} r={STICK_RADIUS} fill="none" stroke={padInk.ring} strokeWidth={2} opacity={0.5} />
            <circle cx={stickView.kx} cy={stickView.ky} r={26} fill={colour} opacity={0.85} />
          </g>
        )}
      </svg>
      {!isLandscape && (
        <div className={styles.rotate}>
          <p className={styles.rotateText}>{copy.rotate}</p>
        </div>
      )}
    </div>
  );
};
