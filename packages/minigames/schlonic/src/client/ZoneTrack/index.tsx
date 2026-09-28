import { forwardRef, useMemo } from "react";
import { Character } from "@wingnight/cast";
import type { SchlonicMinigameRun, SchlonicZone } from "@wingnight/shared";

import type { RunnerFigure } from "../resolveRunnerFigure/index.js";
import { resolveTrackDistancePercent, resolveTrackMarks } from "../trackMarks/index.js";
import { zoneTrackCopy } from "./copy.js";
import * as styles from "./styles.js";

type ZoneTrackProps = {
  zone: SchlonicZone;
  runs: readonly SchlonicMinigameRun[];
  /** The run on the wall; the strip pins every refereed run before it. */
  shownRunIndex: number;
  runner: RunnerFigure;
  /** The `text-*` class of the team's colour, for the pins of runs whose runner is off screen. */
  teamFillClassName: string;
};

const HAZARD_CLASS_NAMES = {
  spike: styles.spike,
  badnik: styles.badnik,
  spring: styles.spring
} as const;

// Where a mark sits is a custom property written on the element itself as it mounts — the
// house rule bans a JSX `style` prop, and a Tailwind class built from a number at runtime is
// never generated. The classes in `styles.ts` read the property; this only writes it, once.
const atPercent = (percent: number, widthPercent?: number) => {
  return (element: HTMLElement | null): void => {
    element?.style.setProperty("--schlonic-track-at", `${percent}%`);

    if (widthPercent !== undefined) {
      element?.style.setProperty("--schlonic-track-width", `${widthPercent}%`);
    }
  };
};

/**
 * The zone as a line over the arena: hazards and holes marked where they fall, the post at the
 * end, this turn's finished runs pinned where they ended, and the live runner's own head riding
 * along it. The room reads how far there is to go, what is coming, and how the team is doing
 * against its own earlier runs — at a glance, from the couch, without doing sums off the
 * marquee. The live pin is painted from the mirror's loop through a ref (`zoneTrack`); nothing
 * here re-renders per frame.
 */
export const ZoneTrack = forwardRef<HTMLDivElement, ZoneTrackProps>(
  ({ zone, runs, shownRunIndex, runner, teamFillClassName }, ref): JSX.Element => {
    const marks = useMemo(() => resolveTrackMarks(zone), [zone]);
    const finishedRuns = runs.filter(
      (run) => run.runIndex < shownRunIndex && run.result !== null && !run.skipped
    );
    const avatarSrc = runner.appearance.avatarSrc;

    return (
      <div ref={ref} className={styles.container} data-schlonic-track>
        <div className={styles.rail}>
          <span className={styles.railRun} />
        </div>
        {marks.pits.map((pit) => (
          <span
            key={pit.fromX}
            ref={atPercent(pit.fromPercent, pit.widthPercent)}
            className={styles.pit}
            data-schlonic-track-pit={pit.fromPercent}
          />
        ))}
        {marks.hazards.map((hazard) => (
          <span
            key={hazard.index}
            ref={atPercent(hazard.percent)}
            className={HAZARD_CLASS_NAMES[hazard.kind]}
            data-schlonic-track-hazard={hazard.kind}
            data-schlonic-track-at={hazard.percent}
          />
        ))}
        <span className={styles.post} data-schlonic-track-post />
        {finishedRuns.map((run) => {
          const result = run.result;

          if (result === null) {
            return null;
          }

          const percent =
            result.outcome === "cleared" ? 100 : resolveTrackDistancePercent(zone, result.distance);

          return (
            <span
              key={run.runIndex}
              ref={atPercent(percent)}
              className={`${styles.runPin} ${teamFillClassName}`}
              title={zoneTrackCopy.pinTitle(run.player?.name ?? null, result.outcome)}
              data-schlonic-track-pin={result.outcome}
              data-schlonic-track-at={percent}
            />
          );
        })}
        <span
          className={`${styles.runnerMark} ${runner.fillClassName}`}
          data-schlonic-track-runner
          aria-hidden="true"
        >
          {avatarSrc !== undefined && runner.playerName !== null ? (
            <img
              className={styles.runnerPhoto}
              src={avatarSrc}
              alt={zoneTrackCopy.runnerAlt(runner.playerName)}
            />
          ) : (
            <span className={styles.runnerHen}>
              <Character
                appearance={runner.appearance}
                apparel={runner.apparel}
                silhouette={runner.silhouette}
                fillClassName={runner.fillClassName}
                pose="still"
              />
            </span>
          )}
        </span>
        <span className={styles.label}>
          {zoneTrackCopy.label(marks.hazards.length, marks.pits.length)}
        </span>
      </div>
    );
  }
);

ZoneTrack.displayName = "ZoneTrack";
