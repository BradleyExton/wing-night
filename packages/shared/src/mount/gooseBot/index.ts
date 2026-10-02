import type { MountInputSample, MountLimb, MountVec } from "../types.js";

// The goose bot: a scripted climb that mounts the round's default goose (seed 20261002 deals the
// standing goose, line 160) from the bare pile. It proves the game is winnable, and the client e2e
// replays it (docs/minigames/mount-your-hens-spec.md §0.9).
//
// A step is one finger: it touches `limb` at the step's first point and drags straight to its
// last, then stays down until the hen is still, then lifts; the next step waits until the hen is
// still again. `MOUNT_GOOSE_BOT_SAMPLES` is exactly that, logged at a move every second tick:
// the log `simulate/index.test.ts` referees. The steps were found by a seeded search over drags
// (not hand-placed), and the sim is chaotic: replayed at other timings the same steps do not
// reliably mount, so a replay that cannot hit these ticks should feed the log, not the steps.
// Regenerate both together whenever MOUNT_WORLD or the integrator changes.

/** One finger's drag: touch `limb` at the first point, move through the rest, lift at the last. */
export type MountGooseBotStep = { limb: MountLimb; points: readonly MountVec[] };

export const MOUNT_GOOSE_BOT_STEPS: readonly MountGooseBotStep[] = [
  { limb: "beak", points: [{ x: -79, y: -51 }, { x: -131.375, y: -11.625 }] },
  { limb: "footRight", points: [{ x: -116, y: 0 }, { x: -125.875, y: -4.125 }] },
  { limb: "beak", points: [{ x: -79, y: -50.875 }, { x: -75, y: -35 }] },
  { limb: "footLeft", points: [{ x: -128, y: 0 }, { x: -90.25, y: -13.75 }] },
  { limb: "beak", points: [{ x: -79, y: -49.125 }, { x: -110.75, y: -29.25 }] },
  { limb: "footRight", points: [{ x: -46.75, y: -77.25 }, { x: -25, y: -93.5 }] },
  { limb: "footRight", points: [{ x: -26.375, y: -81.625 }, { x: -14.25, y: -63 }] }
];

/** The steps as the tablet logs them, mounting on tick 458. */
export const MOUNT_GOOSE_BOT_SAMPLES: readonly MountInputSample[] = [
  { tick: 0, limb: "beak", kind: "grab-start", x: -79, y: -51 },
  { tick: 2, limb: "beak", kind: "move", x: -131.375, y: -11.625 },
  { tick: 9, limb: "beak", kind: "release", x: -131.375, y: -11.625 },
  { tick: 16, limb: "footRight", kind: "grab-start", x: -116, y: 0 },
  { tick: 18, limb: "footRight", kind: "move", x: -125.875, y: -4.125 },
  { tick: 47, limb: "footRight", kind: "release", x: -125.875, y: -4.125 },
  { tick: 54, limb: "beak", kind: "grab-start", x: -79, y: -50.875 },
  { tick: 56, limb: "beak", kind: "move", x: -75, y: -35 },
  { tick: 84, limb: "beak", kind: "release", x: -75, y: -35 },
  { tick: 108, limb: "footLeft", kind: "grab-start", x: -128, y: 0 },
  { tick: 110, limb: "footLeft", kind: "move", x: -90.25, y: -13.75 },
  { tick: 230, limb: "footLeft", kind: "release", x: -90.25, y: -13.75 },
  { tick: 257, limb: "beak", kind: "grab-start", x: -79, y: -49.125 },
  { tick: 259, limb: "beak", kind: "move", x: -110.75, y: -29.25 },
  { tick: 325, limb: "beak", kind: "release", x: -110.75, y: -29.25 },
  { tick: 395, limb: "footRight", kind: "grab-start", x: -46.75, y: -77.25 },
  { tick: 397, limb: "footRight", kind: "move", x: -25, y: -93.5 },
  { tick: 419, limb: "footRight", kind: "release", x: -25, y: -93.5 },
  { tick: 433, limb: "footRight", kind: "grab-start", x: -26.375, y: -81.625 },
  { tick: 435, limb: "footRight", kind: "move", x: -14.25, y: -63 }
];
