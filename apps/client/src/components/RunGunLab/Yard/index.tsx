import { useEffect, useRef, useState } from "react";
import { QrCode } from "@wingnight/surface";

import { runGunLabCopy } from "../copy";
import { connectTv, type RelayedPadState } from "../link";
import { resolveSlotColour } from "../palette";
import {
  DEFAULT_YARD_TUNING,
  addHen,
  applyHenInput,
  createYardWorld,
  isHenDown,
  removeHen,
  resetHenNumbers,
  stepYard,
  type YardWorld
} from "../yardSim";
import { KEYBOARD_PAD_ID, wireKeyboardPad } from "./keyboardPad";
import { Scene } from "./Scene";
import { TuningPanel, type LabSettings } from "./TuningPanel";
import * as styles from "./styles";
import { usePadUrl } from "./usePadUrl";

const copy = runGunLabCopy.yard;

const TICK_MS = 1000 / 60;
// A pad that has said nothing for this long has gone (it speaks twice a second regardless).
const PAD_SILENCE_MS = 4000;

const DEFAULT_SETTINGS: LabSettings = {
  ...DEFAULT_YARD_TUNING,
  inputDelayMs: 0,
  showBoxes: false
};

/**
 * PROTOTYPE — throwaway (docs/minigames/ideas/base-borden.md, open question 1). The TV half of the
 * run-and-gun jump lab: a yard run here at 60 Hz from whatever the phone pads say, the candidate
 * rules on a panel, and beside each hen the one number the lab exists for — how many of the shots
 * that came at her she got out of the way of. Deleted when the game is specced or dropped.
 */
export const RunGunYardLab = (): JSX.Element => {
  const worldRef = useRef<YardWorld | null>(null);
  const [settings, setSettings] = useState<LabSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef(settings);
  const [frame, setFrame] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const rttByPad = useRef(new Map<string, number | null>());
  const padUrl = usePadUrl();

  if (worldRef.current === null) {
    worldRef.current = createYardWorld();
  }

  const world = worldRef.current;

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const socket = connectTv();
    const tvId = `tv-${Math.random().toString(36).slice(2, 10)}`;
    const queue: { dueAt: number; state: RelayedPadState }[] = [];
    const lastSeen = new Map<string, number>();
    const pendingAcks = new Map<string, RelayedPadState>();
    const rtts = rttByPad.current;

    const receive = (state: RelayedPadState): void => {
      queue.push({ dueAt: performance.now() + settingsRef.current.inputDelayMs, state });
    };

    socket.on("pad:state", receive);
    socket.on("pad:gone", ({ padId }) => {
      removeHen(world, padId);
      lastSeen.delete(padId);
      rtts.delete(padId);
    });

    const disposeKeyboard = wireKeyboardPad({
      onState: receive,
      onTogglePanel: () => {
        setIsPanelOpen((open) => !open);
      }
    });

    let handle = 0;
    let last = performance.now();
    let owed = 0;

    const loop = (now: number): void => {
      while (queue[0] !== undefined && queue[0].dueAt <= now) {
        const next = queue.shift();

        if (next === undefined) {
          break;
        }

        const { state } = next;
        const hen = world.hens.find((candidate) => candidate.padId === state.padId) ?? addHen(world, state.padId);

        applyHenInput(world, hen, { dir: state.dir, jumpSeq: state.jumpSeq });
        lastSeen.set(state.padId, now);
        rtts.set(state.padId, state.rttMs);

        if (state.padId !== KEYBOARD_PAD_ID) {
          pendingAcks.set(state.padId, state);
        }
      }

      for (const [padId, seenAt] of lastSeen) {
        if (padId !== KEYBOARD_PAD_ID && now - seenAt > PAD_SILENCE_MS) {
          removeHen(world, padId);
          lastSeen.delete(padId);
          rtts.delete(padId);
        }
      }

      // A stalled tab owes at most a tenth of a second: the yard never fast-forwards.
      owed += Math.min(100, now - last);
      last = now;

      while (owed >= TICK_MS) {
        stepYard(world, settingsRef.current);
        owed -= TICK_MS;
      }

      // The ack leaves as the frame the input moved is handed to the browser to paint.
      for (const [padId, state] of pendingAcks) {
        const hen = world.hens.find((candidate) => candidate.padId === padId);

        if (hen !== undefined) {
          socket.emit("tv:ack", {
            tvId,
            padId,
            seq: state.seq,
            sentAt: state.sentAt,
            slot: hen.slot,
            hearts: isHenDown(hen, world.tick) ? 0 : hen.hearts,
            hits: hen.hits
          });
        }
      }

      pendingAcks.clear();
      setFrame((value) => value + 1);
      handle = window.requestAnimationFrame(loop);
    };

    handle = window.requestAnimationFrame(loop);

    return (): void => {
      window.cancelAnimationFrame(handle);
      disposeKeyboard();
      socket.disconnect();
    };
  }, [world]);

  const resetStats = (): void => {
    for (const hen of world.hens) {
      resetHenNumbers(hen);
    }
  };

  return (
    <main className={styles.root} data-proto-rungun-yard="">
      <div className={styles.stage}>
        <Scene world={world} frame={frame} forgiveness={settings.forgiveness} showBoxes={settings.showBoxes} />
      </div>

      <ul className={styles.roster}>
        {world.hens.length === 0 && <li className={styles.rosterEmpty}>{copy.noHens}</li>}
        {world.hens.map((hen) => (
          <li
            key={hen.padId}
            className={styles.chip}
            data-proto-chip={hen.padId}
            data-proto-faced={hen.faced}
            data-proto-dodged={hen.dodged}
            data-proto-hits={hen.hits}
          >
            <svg className={styles.chipDot} viewBox="0 0 10 10" aria-hidden>
              <circle cx={5} cy={5} r={5} fill={resolveSlotColour(hen.slot)} />
            </svg>
            <span className={styles.chipText}>
              <span className={styles.chipName}>
                {copy.playerTag(hen.slot)} {copy.hearts(isHenDown(hen, world.tick) ? 0 : hen.hearts)}
              </span>
              <span className={styles.chipLine}>{copy.dodgeLine(hen.dodged, hen.faced)}</span>
              <span className={styles.chipLine}>{copy.hitsLine(hen.hits, hen.turretsOut)}</span>
              <span className={styles.chipLine}>
                {hen.padId === KEYBOARD_PAD_ID ? copy.keyboardPad : copy.roundTrip(rttByPad.current.get(hen.padId) ?? null)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {isPanelOpen ? (
        <aside className={styles.panel}>
          <p className={styles.title}>{copy.title}</p>
          <TuningPanel settings={settings} onChange={setSettings} />
          <div className={styles.buttonRow}>
            <button type="button" className={styles.button} onClick={resetStats}>
              {copy.resetStats}
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={(): void => {
                setIsPanelOpen(false);
              }}
            >
              {copy.hidePanel}
            </button>
          </div>
          <div className={styles.join}>
            {padUrl !== null && (
              <span className={styles.joinPlate}>
                <QrCode value={padUrl} quietZone={2} />
              </span>
            )}
            <span className={styles.joinText}>
              <span className={styles.joinKicker}>{copy.joinKicker}</span>
              <span className={styles.joinAddress}>{padUrl ?? copy.joinFallback}</span>
              <span className={styles.joinHint}>{copy.keyboardHint}</span>
            </span>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          className={styles.panelToggle}
          onClick={(): void => {
            setIsPanelOpen(true);
          }}
        >
          {copy.showPanel}
        </button>
      )}
    </main>
  );
};
