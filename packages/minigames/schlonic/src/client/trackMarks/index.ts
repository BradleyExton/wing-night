import type { SchlonicFrame, SchlonicPropKind, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

/**
 * The zone as a line, start to post: what the strip over the TV's arena draws. Percent is
 * distance along the run — 0 on the start line, 100 at the post — the same number the run's
 * `distance` result is a fraction of, so a finished run's pin and a live run's pin are on one
 * scale. Wings are not on it: the strip is a map of what can go wrong, not of what there is to
 * collect, and a couple of hundred dots would read as a fence. Rails are, but apart: a rail is
 * kit, not a hazard — the greedy line rides it — so it is a span over the line rather than a mark
 * on it, and the thorn bed under its far end is marked as the hazard it is.
 */
export type ZoneTrackHazard = {
  index: number;
  kind: Exclude<SchlonicPropKind, "wing" | "rail">;
  percent: number;
};

export type ZoneTrackPit = {
  fromX: number;
  fromPercent: number;
  widthPercent: number;
};

export type ZoneTrackRail = {
  index: number;
  fromPercent: number;
  widthPercent: number;
};

/** Where one leg hands to the next: a line across the bar. Not drawn at the start or the post. */
export type ZoneTrackHandoff = {
  leg: number;
  percent: number;
};

export type ZoneTrackMarks = {
  hazards: ZoneTrackHazard[];
  pits: ZoneTrackPit[];
  rails: ZoneTrackRail[];
  handoffs: ZoneTrackHandoff[];
};

/**
 * What the strip is a picture of: the whole street (`resolveSchlonicCourse`), and where the leg
 * on the wall starts on it, so a leg-local x lands on the right stretch of the bar.
 */
export type SchlonicTrack = {
  course: SchlonicZone;
  fromX: number;
};

const clampPercent = (value: number): number => Math.min(100, Math.max(0, value));

const round = (value: number): number => Math.round(value * 10) / 10;

/** Where along the run a world x sits, 0 on the line and 100 at the post. */
export const resolveTrackPercent = (zone: SchlonicZone, x: number): number => {
  const length = Math.max(1, zone.goalX - SCHLONIC_WORLD.runnerX);

  return round(clampPercent(((x - SCHLONIC_WORLD.runnerX) / length) * 100));
};

/** The same, for a distance the referee already measured from the line. */
export const resolveTrackDistancePercent = (zone: SchlonicZone, distance: number): number => {
  return resolveTrackPercent(zone, SCHLONIC_WORLD.runnerX + distance);
};

/**
 * The handoff lines: one at the start of every leg but the first, at the leg's width apart. A
 * course of one leg has none.
 */
export const resolveTrackHandoffs = (course: SchlonicZone, legWidth: number): ZoneTrackHandoff[] => {
  const handoffs: ZoneTrackHandoff[] = [];

  if (legWidth <= 0) {
    return handoffs;
  }

  for (let leg = 1; leg * legWidth < course.goalX; leg += 1) {
    handoffs.push({ leg, percent: resolveTrackPercent(course, leg * legWidth) });
  }

  return handoffs;
};

export const resolveTrackMarks = (zone: SchlonicZone, legWidth = zone.goalX): ZoneTrackMarks => {
  const hazards = zone.props.flatMap((prop): ZoneTrackHazard[] => {
    if (prop.kind === "wing" || prop.kind === "rail") {
      return [];
    }

    return [{ index: prop.index, kind: prop.kind, percent: resolveTrackPercent(zone, prop.x) }];
  });
  const pits = zone.pits.map((pit): ZoneTrackPit => {
    const fromPercent = resolveTrackPercent(zone, pit.fromX);

    return {
      fromX: pit.fromX,
      fromPercent,
      widthPercent: round(resolveTrackPercent(zone, pit.toX) - fromPercent)
    };
  });

  const rails = zone.props.flatMap((prop): ZoneTrackRail[] => {
    if (prop.kind !== "rail") {
      return [];
    }

    const fromPercent = resolveTrackPercent(zone, prop.x);

    return [
      {
        index: prop.index,
        fromPercent,
        widthPercent: round(resolveTrackPercent(zone, prop.toX ?? prop.x) - fromPercent)
      }
    ];
  });

  return { hazards, pits, rails, handoffs: resolveTrackHandoffs(zone, legWidth) };
};

/**
 * The live pin, written from the paint loop the way the wing tally is: one custom property on
 * the strip's root and the same number as data for anything reading the wall, sixty times a
 * second, with no React in the way.
 */
export const paintZoneTrack = (
  root: HTMLElement | null,
  track: SchlonicTrack,
  frame: SchlonicFrame,
  ghostFrame: SchlonicFrame | null = null
): void => {
  if (root === null) {
    return;
  }

  // A leg's x is measured from its own start line; the bar is the whole street's.
  const { course, fromX } = track;
  const percent = resolveTrackPercent(course, frame.x + fromX);
  const text = `${percent}`;

  if (root.dataset.schlonicTrackPercent !== text) {
    root.style.setProperty("--schlonic-track-run", `${percent}%`);
    root.dataset.schlonicTrackPercent = text;
  }

  // The run to beat, on the same bar: where its replay has got to on this tick.
  const ghostText = ghostFrame === null ? "" : `${resolveTrackPercent(course, ghostFrame.x + fromX)}`;

  if ((root.dataset.schlonicTrackGhostPercent ?? "") !== ghostText) {
    root.style.setProperty("--schlonic-track-ghost", ghostText === "" ? "0%" : `${ghostText}%`);
    root.dataset.schlonicTrackGhostPercent = ghostText;
  }
};
