import type { SchlonicFrame, SchlonicPropKind, SchlonicZone } from "@wingnight/shared";
import { SCHLONIC_WORLD } from "@wingnight/shared";

/**
 * The zone as a line, start to post: what the strip over the TV's arena draws. Percent is
 * distance along the run — 0 on the start line, 100 at the post — the same number the run's
 * `distance` result is a fraction of, so a finished run's pin and a live run's pin are on one
 * scale. Wings are not on it: the strip is a map of what can go wrong, not of what there is to
 * collect, and a couple of hundred dots would read as a fence.
 */
export type ZoneTrackHazard = {
  index: number;
  kind: Exclude<SchlonicPropKind, "wing">;
  percent: number;
};

export type ZoneTrackPit = {
  fromX: number;
  fromPercent: number;
  widthPercent: number;
};

export type ZoneTrackMarks = {
  hazards: ZoneTrackHazard[];
  pits: ZoneTrackPit[];
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

export const resolveTrackMarks = (zone: SchlonicZone): ZoneTrackMarks => {
  const hazards = zone.props.flatMap((prop): ZoneTrackHazard[] => {
    if (prop.kind === "wing") {
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

  return { hazards, pits };
};

/**
 * The live pin, written from the paint loop the way the wing tally is: one custom property on
 * the strip's root and the same number as data for anything reading the wall, sixty times a
 * second, with no React in the way.
 */
export const paintZoneTrack = (root: HTMLElement | null, zone: SchlonicZone, frame: SchlonicFrame): void => {
  if (root === null) {
    return;
  }

  const percent = resolveTrackPercent(zone, frame.x);
  const text = `${percent}`;

  if (root.dataset.schlonicTrackPercent === text) {
    return;
  }

  root.style.setProperty("--schlonic-track-run", `${percent}%`);
  root.dataset.schlonicTrackPercent = text;
};
