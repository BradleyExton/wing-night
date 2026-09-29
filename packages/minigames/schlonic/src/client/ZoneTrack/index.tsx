import { forwardRef, useMemo } from "react";
import { Character } from "@wingnight/cast";
import type { SchlonicMinigameRun, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

import type { RunnerFigure } from "../resolveRunnerFigure/index.js";
import { resolveTrackMarks, resolveTrackPercent } from "../trackMarks/index.js";
import { zoneTrackCopy } from "./copy.js";
import * as styles from "./styles.js";

type ZoneTrackProps = {
  /** The whole street, every leg end to end (`resolveSchlonicCourse`). */
  zone: SchlonicZone;
  /** How long one leg is, in world units; a run's leg starts `runIndex` of these in. */
  legWidth?: number;
  runs: readonly SchlonicMinigameRun[];
  /** The run on the wall; the strip pins every refereed run before it. */
  shownRunIndex: number;
  runner: RunnerFigure;
  /** The `text-*` class of the team's colour, for the pins of runs whose runner is off screen. */
  teamFillClassName: string;
  /** The round's best run as a figure, riding the bar behind the runner; null with no run to beat. */
  ghost?: RunnerFigure | null;
};

// A figure's face for a pin: the generated head when the pack has one, the house hen otherwise.
const PinFace = ({ figure, alt }: { figure: RunnerFigure; alt: string }): JSX.Element => {
  const avatarSrc = figure.appearance.avatarSrc;

  if (avatarSrc !== undefined && figure.playerName !== null) {
    return <img className={styles.runnerPhoto} src={avatarSrc} alt={alt} />;
  }

  return (
    <span className={styles.runnerHen}>
      <Character
        appearance={figure.appearance}
        apparel={figure.apparel}
        silhouette={figure.silhouette}
        fillClassName={figure.fillClassName}
        pose="still"
      />
    </span>
  );
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
 * The zone as a line over the arena: hazards, rails and trenches marked where they fall, the post at the
 * end, this turn's finished runs pinned where they ended, and the live runner's own head riding
 * along it. The room reads how far there is to go, what is coming, and how the team is doing
 * against its own earlier runs — at a glance, from the couch, without doing sums off the
 * marquee. The live pin is painted from the mirror's loop through a ref (`zoneTrack`); nothing
 * here re-renders per frame.
 */
export const ZoneTrack = forwardRef<HTMLDivElement, ZoneTrackProps>(
  ({ zone, legWidth = zone.goalX, runs, shownRunIndex, runner, teamFillClassName, ghost = null }, ref): JSX.Element => {
    const marks = useMemo(() => resolveTrackMarks(zone, legWidth), [zone, legWidth]);
    const finishedRuns = runs.filter(
      (run) => run.runIndex < shownRunIndex && run.result !== null && !run.skipped
    );

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
        {marks.handoffs.map((handoff) => (
          <span
            key={handoff.leg}
            ref={atPercent(handoff.percent)}
            className={styles.handoff}
            data-schlonic-track-handoff={handoff.leg}
          />
        ))}
        {marks.rails.map((rail) => (
          <span
            key={rail.index}
            ref={atPercent(rail.fromPercent, rail.widthPercent)}
            className={styles.grindRail}
            data-schlonic-track-rail={rail.fromPercent}
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

          // Where the run ended on ITS leg of the street: a cleared run sits on that leg's
          // post, which is the handoff, not the end of the bar.
          const legFromX = run.runIndex * legWidth;
          const percent = resolveTrackPercent(
            zone,
            result.outcome === "cleared" ? legFromX + legWidth : legFromX + SCHLONIC_WORLD.runnerX + result.distance
          );

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
        {/* The ghost rides behind the runner in the stacking order on purpose: when the two
            meet, the room should read the live face. */}
        {ghost !== null && (
          <span
            className={`${styles.ghostMark} ${ghost.fillClassName}`}
            data-schlonic-track-ghost
            aria-hidden="true"
          >
            <PinFace figure={ghost} alt={zoneTrackCopy.ghostAlt(ghost.playerName)} />
          </span>
        )}
        <span
          className={`${styles.runnerMark} ${runner.fillClassName}`}
          data-schlonic-track-runner
          aria-hidden="true"
        >
          <PinFace figure={runner} alt={zoneTrackCopy.runnerAlt(runner.playerName ?? "")} />
        </span>
        <span className={styles.label}>
          {zoneTrackCopy.label(marks.hazards.length, marks.rails.length, marks.pits.length, marks.handoffs.length + 1)}
        </span>
      </div>
    );
  }
);

ZoneTrack.displayName = "ZoneTrack";
