import { useMemo } from "react";
import type { SchlonicBestLeg, SchlonicBestTurn, SchlonicZone, SchlonicZoneCourse } from "@wingnight/shared";
import {
  SCHLONIC_WORLD,
  resolveSchlonicCourse,
  resolveSchlonicLegFromX,
  resolveSchlonicZone
} from "@wingnight/shared";

import type { SchlonicTrack } from "../trackMarks/index.js";

type StreetView = {
  zoneSeed: number;
  zoneChunks: number;
  runsPerTurn: number;
  bestTurn: SchlonicBestTurn | null;
};

export type SchlonicStreet = {
  /** What lays the leg out: run `runIndex` is leg `runIndex` of the course. */
  legCourse: SchlonicZoneCourse;
  /** The leg as the zone a run is played on, its start line at x 0. */
  zone: SchlonicZone;
  /** The whole street, every leg end to end, for the strip over the arena. */
  course: SchlonicZone;
  /** The strip's picture and where this leg starts on it. */
  track: SchlonicTrack;
  /** One leg's length in world units. */
  legWidth: number;
  /** The other team's rider on this leg, the ghost to race; null with no turn to beat or a skipped leg. */
  ghostLeg: SchlonicBestLeg | null;
};

/**
 * Pure, memoised: the street a view describes, cut to the leg a surface is showing. Both
 * surfaces read the same four numbers off the view and lay out the same course, so the
 * tablet and the wall can never disagree about which stretch of Dunlop a run is on.
 */
export const resolveSchlonicStreet = (view: StreetView, runIndex: number): SchlonicStreet => {
  const legCourse = { seed: view.zoneSeed, chunks: view.zoneChunks, legs: view.runsPerTurn, leg: runIndex };
  const course = resolveSchlonicCourse({ seed: view.zoneSeed, chunks: view.zoneChunks, legs: view.runsPerTurn });

  return {
    legCourse,
    zone: resolveSchlonicZone(legCourse),
    course,
    track: { course, fromX: resolveSchlonicLegFromX(legCourse) },
    legWidth: view.zoneChunks * SCHLONIC_WORLD.chunkWidth,
    ghostLeg: view.bestTurn?.legs[runIndex] ?? null
  };
};

export const useSchlonicStreet = (view: StreetView, runIndex: number): SchlonicStreet => {
  const { zoneSeed, zoneChunks, runsPerTurn, bestTurn } = view;

  return useMemo(() => {
    return resolveSchlonicStreet({ zoneSeed, zoneChunks, runsPerTurn, bestTurn }, runIndex);
  }, [zoneSeed, zoneChunks, runsPerTurn, bestTurn, runIndex]);
};
