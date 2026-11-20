import { useEffect, useRef, useState } from "react";

import { useIsLandscape } from "../../PhoneGameFrame/useIsLandscape";
import { runGunLabCopy } from "../copy";
import { connectPad, type TvAck } from "../link";
import { padInk, resolveSlotColour } from "../palette";
import { PadControls } from "../PadControls";
import type { StickDir } from "../yardSim";
import * as styles from "./styles";

const copy = runGunLabCopy.pad;

const PAD_ID_STORAGE_KEY = "proto-rungun-pad-id";
const KEEPALIVE_MS = 500;
/** The readout is the median of the round trips in this window: an idle pad only speaks twice a second. */
const RTT_WINDOW_MS = 2500;
const HEADER_HEIGHT = 40;
/** A yard that has not answered for this long has closed; the pad takes up with the next one. */
const TV_SILENCE_MS = 2000;

// One id per tab, kept across a reload so a refresh is the same hen.
export const resolvePadId = (storageKey = PAD_ID_STORAGE_KEY): string => {
  const fresh = `pad-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const stored = window.sessionStorage.getItem(storageKey);

    if (stored !== null) {
      return stored;
    }

    window.sessionStorage.setItem(storageKey, fresh);
  } catch {
    // Private mode: a fresh hen each load is fine.
  }

  return fresh;
};

export const resolveMedian = (samples: readonly number[]): number | null => {
  if (samples.length === 0) {
    return null;
  }

  const sorted = [...samples].sort((a, b) => a - b);

  return sorted[Math.floor(sorted.length / 2)] ?? null;
};

/**
 * PROTOTYPE — throwaway. The phone half of the LAN run-and-gun jump lab: a gamepad and nothing
 * else, because the player's eyes are on the TV. It says when a thumb has changed and times how
 * long the yard takes to answer.
 */
export const RunGunPadLab = (): JSX.Element => {
  const isLandscape = useIsLandscape();
  const [ack, setAck] = useState<TvAck | null>(null);
  const [rttMs, setRttMs] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const input = useRef<{ dir: StickDir; jumpSeq: number; dirty: boolean }>({ dir: 0, jumpSeq: 0, dirty: true });

  useEffect(() => {
    const socket = connectPad(resolvePadId());
    const samples: { at: number; rtt: number }[] = [];
    let median: number | null = null;
    let seq = 0;
    let lastSentAt = 0;
    let lastHits = 0;
    let lastShownAt = 0;
    let handle = 0;
    let tvId: string | null = null;
    let tvHeardAt = 0;

    socket.on("connect", () => {
      setIsConnected(true);
      input.current.dirty = true;
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    socket.on("tv:ack", (next) => {
      const now = performance.now();

      // Two yard pages open at once both answer, each with its own slot for this pad: listen to
      // the first, until it goes quiet.
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
      const wasHit = next.hits > lastHits;

      if (wasHit) {
        navigator.vibrate?.(120);
      }

      lastHits = next.hits;

      if (wasHit || now - lastShownAt > 250) {
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
          dir: state.dir,
          jumpSeq: state.jumpSeq,
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
    };
  }, []);

  const colour = ack === null ? padInk.dim : resolveSlotColour(ack.slot);
  const status = !isConnected ? copy.connecting : ack === null ? copy.waiting : null;

  return (
    <div className={styles.root}>
      <PadControls
        colour={colour}
        isLabelled
        onStick={(dir): void => {
          input.current.dir = dir;
          input.current.dirty = true;
        }}
        onJump={(): void => {
          input.current.jumpSeq += 1;
          input.current.dirty = true;
        }}
      />
      <svg className={styles.overlay} width="100%" height="100%" aria-hidden>
        <rect x={0} y={0} width="100%" height={HEADER_HEIGHT} fill={colour} opacity={0.9} />
        {ack !== null && (
          <text className={styles.header} x={14} y={HEADER_HEIGHT / 2} dominantBaseline="central">
            {copy.playerTag(ack.slot)} {copy.hearts(ack.hearts)}
          </text>
        )}
        <text className={styles.header} x="100%" dx={-14} y={HEADER_HEIGHT / 2} dominantBaseline="central" textAnchor="end">
          {copy.roundTrip(rttMs)}
        </text>
        {status !== null && (
          <text className={styles.zoneHint} x="50%" y="100%" dy={-16} textAnchor="middle" fill={padInk.text}>
            {status}
          </text>
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
