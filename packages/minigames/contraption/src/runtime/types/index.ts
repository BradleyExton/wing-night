import type {
  ContraptionContentFile,
  ContraptionMinigameRun,
  ContraptionPhase,
  ContraptionPlacedPiece
} from "@wingnight/shared";

export type ContraptionRuntimeContent = ContraptionContentFile;

export type ContraptionRuntimeRules = {
  attemptsPerTurn: number;
  // Pins a level for the night; absent means the first level in the pack.
  // Every team in a round plays the SAME level — it is a scored game, and a
  // later team hearing the room heckle an earlier build is the point, not a
  // fairness leak.
  levelId: string | null;
};

export type ContraptionRuntimeState = {
  turnOrderTeamIds: string[];
  activeTurnIndex: number;
  levelId: string | null;
  attemptsPerTurn: number;
  // Completed runs this turn.
  attemptsUsed: number;
  phase: ContraptionPhase;
  pieces: ContraptionPlacedPiece[];
  // The most recent run; kept through `done` so the host can replay it.
  run: ContraptionMinigameRun | null;
  bestPoints: number;
  // The active team's pending points before this turn started. Best-of-N
  // means pending = baseline + best, never baseline + sum.
  pendingPointsBaseline: number;
  pendingPointsByTeamId: Record<string, number>;
};

// Two goes: one to learn the scene, one to actually try. Re-rolling the same
// build changes nothing (the integrator is damped, not chaotic), so a second
// attempt is only worth anything if the team rebuilds — which is the game.
export const DEFAULT_CONTRAPTION_ATTEMPTS_PER_TURN = 2;

// The projectile. Drumette — round enough that a sprite with no angular state
// never reads as pinned. Materials match the re-tuned benchmark wing.
export const WING_RADIUS = 2.6;

export const WING_RESTITUTION = 0.28;

export const WING_SLIP = 0.4;

// Layout units per second squared — the fixture gravity every level was tuned under.
export const FIELD_GRAVITY = { x: 0, y: 180 } as const;

// The physics always steps here; the track is sampled at KEYFRAME_HZ.
export const SIM_STEP_HZ = 240;

export const SIM_KEYFRAME_HZ = 30;

// ~4s is the watchable target; the extra second lets a slow settle finish
// rather than be reported as restless.
export const SIM_DURATION_SECONDS = 5;

// How close the wing's centre must pass to a pickup's centre to collect it.
export const PICKUP_COLLECT_RADIUS = 4;
