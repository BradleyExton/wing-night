import { useEffect, useRef } from "react";
import { Character } from "@wingnight/cast";

import { PlayerHead } from "../PlayerHead/index.js";
import type { LegBird } from "../resolveLegBird/index.js";
import type { FappyRelayView } from "../pressure/index.js";
import { formatRelayClock, formatRelayClockSeconds } from "../useRelayClock/index.js";
import { paceTrackCopy } from "./copy.js";
import * as styles from "./styles.js";

type PaceMarksInput = {
  elapsedMs: number | null;
  parSeconds: number;
  limitSeconds: number;
  gatesCleared: number;
  gatesTotal: number;
};

export type PaceMarks = {
  // Where par sits on a bar that spans 0 to the limit. It is also the FINISH
  // line of the race drawn on this bar: a relay run at par pace covers the
  // whole course by then, so both birds are placed as a fraction of it.
  parPercent: number;
  // The team's bird, by course cleared.
  birdPercent: number;
  // The par-pace hen, by clock — parked on the par tick once par is spent.
  ghostPercent: number;
  // How much of the whole window the clock has spent, for the rail's fill.
  elapsedPercent: number;
  isPastPar: boolean;
};

const clampFraction = (value: number): number => Math.min(1, Math.max(0, value));

// Two racers on one bar, which is the only way "are we ahead?" is a glance
// rather than a sum: the team's bird moves with the COURSE, the ghost moves
// with the CLOCK, and par is the line they are both running at. Past par the
// ghost has nowhere further to go, so it parks and the bar beyond it turns
// into what the overrun is costing.
export const resolvePaceMarks = ({
  elapsedMs,
  parSeconds,
  limitSeconds,
  gatesCleared,
  gatesTotal
}: PaceMarksInput): PaceMarks => {
  const parMs = Math.max(1, parSeconds * 1000);
  const limitMs = Math.max(parMs, limitSeconds * 1000);
  const parPercent = (parMs / limitMs) * 100;
  const spentMs = elapsedMs ?? 0;
  const coursePercent = gatesTotal <= 0 ? 0 : clampFraction(gatesCleared / gatesTotal) * parPercent;

  return {
    parPercent,
    birdPercent: coursePercent,
    ghostPercent: clampFraction(spentMs / parMs) * parPercent,
    elapsedPercent: clampFraction(spentMs / limitMs) * 100,
    isPastPar: spentMs > parMs
  };
};

type PaceTrackProps = {
  view: FappyRelayView;
  elapsedMs: number | null;
  // The bird flying the leg on screen, resolved once by the surface so the
  // head on this strip and the hen in the corridor are the same player's.
  bird: LegBird;
};

export const PaceTrack = ({ view, elapsedMs, bird }: PaceTrackProps): JSX.Element => {
  const rootRef = useRef<HTMLDivElement>(null);
  const gatesTotal = view.legsPerTurn * view.gatesPerLeg;
  const marks = resolvePaceMarks({
    elapsedMs,
    parSeconds: view.parSeconds,
    limitSeconds: view.limitSeconds,
    gatesCleared: view.totalGatesCleared,
    gatesTotal
  });
  const parClock = formatRelayClockSeconds(view.parSeconds * 1000);

  // Every mark is a custom property on the root, written through a ref — one
  // element touched per tick, and no geometry in the markup (styles.ts owns it,
  // the house rule bans a JSX `style` prop, and the corridor next door moves its
  // own bird exactly this way).
  useEffect(() => {
    const root = rootRef.current;

    if (root === null) {
      return;
    }

    root.style.setProperty("--fappy-pace-par", `${marks.parPercent}%`);
    root.style.setProperty("--fappy-pace-bird", `${marks.birdPercent}%`);
    root.style.setProperty("--fappy-pace-ghost", `${marks.ghostPercent}%`);
    root.style.setProperty(
      "--fappy-pace-run",
      `${Math.min(marks.elapsedPercent, marks.parPercent)}%`
    );
    root.style.setProperty(
      "--fappy-pace-overrun",
      `${Math.max(0, marks.elapsedPercent - marks.parPercent)}%`
    );
  }, [marks.parPercent, marks.birdPercent, marks.ghostPercent, marks.elapsedPercent]);

  return (
    <div
      ref={rootRef}
      className={styles.container}
      data-fappy-pace-track
      data-fappy-pace-past-par={marks.isPastPar ? "true" : "false"}
    >
      <div className={styles.rail}>
        <span className={styles.railRun} />
        {marks.isPastPar && <span className={styles.railOverrun} data-fappy-pace-overrun />}
      </div>
      <span className={styles.parTick} data-fappy-pace-par />
      <span className={styles.limitLabel}>
        {paceTrackCopy.limitTick(formatRelayClockSeconds(view.limitSeconds * 1000))}
      </span>
      {/* The ghost is behind the bird in the stacking order on purpose: when
          the two meet, the room should read the team's own face. */}
      <span
        className={`${styles.ghostMark}${marks.isPastPar ? ` ${styles.ghostMarkParked}` : ""}`}
        data-fappy-pace-ghost
        aria-hidden="true"
      >
        <Character appearance={{ body: "round", comb: "crest", tail: "fan", dance: "bounce" }} pose="fly" />
      </span>
      <span
        className={`${styles.birdMark} ${bird.fillClassName}`}
        data-fappy-pace-bird
        data-fappy-pace-percent={Math.round(marks.birdPercent)}
      >
        <PlayerHead bird={bird} />
      </span>
      <span className={styles.label}>
        {paceTrackCopy.label(
          view.totalGatesCleared,
          gatesTotal,
          formatRelayClock(elapsedMs ?? 0),
          parClock
        )}
      </span>
    </div>
  );
};
