import type { Layout } from "../types.js";

/**
 * The layout every recorded byte measurement is taken against, so the numbers in WN-17's evidence
 * name a concrete build rather than "a representative run". Six bodies on a 100×100 field with a
 * floor, two walls, two ramps and a bucket — WN-15's "a few bodies" made specific.
 *
 * Exported because a measurement whose input is not in the tree cannot be re-derived when the
 * body count or frame rate changes. This is a benchmark fixture, not authored game content: real
 * levels load through the content pipeline (WN-15), not from here.
 */
export const BENCHMARK_LAYOUT: Layout = {
  gravity: { x: 0, y: 180 },
  segments: [
    { id: "floor", from: { x: 0, y: 98 }, to: { x: 100, y: 98 } },
    { id: "wall-left", from: { x: 2, y: 0 }, to: { x: 2, y: 98 } },
    { id: "wall-right", from: { x: 98, y: 0 }, to: { x: 98, y: 98 } },
    { id: "ramp-upper", from: { x: 6, y: 26 }, to: { x: 52, y: 42 } },
    { id: "ramp-lower", from: { x: 94, y: 58 }, to: { x: 44, y: 74 } },
    { id: "bucket-left", from: { x: 30, y: 98 }, to: { x: 30, y: 84 } },
    { id: "bucket-right", from: { x: 48, y: 98 }, to: { x: 48, y: 84 } }
  ],
  bodies: [
    {
      id: "wing",
      origin: { x: 10, y: 8 },
      radius: 2.6,
      restitution: 0.28,
      slip: 0.86
    },
    {
      id: "marble-a",
      origin: { x: 20, y: 20 },
      radius: 1.8,
      restitution: 0.42,
      slip: 0.9
    },
    {
      id: "marble-b",
      origin: { x: 34, y: 25 },
      radius: 1.8,
      restitution: 0.42,
      slip: 0.9
    },
    {
      id: "marble-c",
      origin: { x: 46, y: 36 },
      radius: 1.8,
      restitution: 0.42,
      slip: 0.9
    },
    {
      id: "marble-d",
      origin: { x: 70, y: 50 },
      radius: 1.8,
      restitution: 0.42,
      slip: 0.9
    },
    {
      id: "marble-e",
      origin: { x: 58, y: 60 },
      radius: 1.8,
      restitution: 0.42,
      slip: 0.9
    }
  ]
};
