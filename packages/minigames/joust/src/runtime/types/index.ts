import type {
  JoustAim,
  JoustContentFile,
  JoustHitZone,
  JoustMinigameShot,
  JoustPhase,
  JoustShotResult,
  JoustSimulateOptions
} from "@wingnight/shared";

export type JoustRuntimeContent = JoustContentFile;

export type JoustRuntimeRules = {
  shotsPerTurn: number;
};

export type JoustRuntimeState = {
  activeTurnTeamId: string | null;
  // Locked at initialize so a mid-turn reconnect rehydrates the same arena.
  arenaId: string | null;
  shotsPerTurn: number;
  shotIndex: number;
  phase: JoustPhase;
  aim: JoustAim;
  shots: JoustShotResult[];
  lastShot: JoustMinigameShot | null;
  // What the active team had banked before this turn, so `resetTurn` can hand
  // back exactly what the turn added and nothing more.
  turnStartPoints: number;
  pendingPointsByTeamId: Record<string, number>;
};

export const DEFAULT_JOUST_SHOTS_PER_TURN = 3;

// A lob comes down on the head, so it is the easy hit; the balls sit behind
// the champ's own shaft on a flat trajectory, so the low blow pays best.
export const JOUST_POINTS_BY_ZONE: Record<JoustHitZone, number> = {
  head: 3,
  shaft: 2,
  balls: 5
};

// A band drawn less than this is a fumble, not a shot: the reducer refuses to
// launch it rather than burning one of the team's attempts on a twitch.
export const JOUST_MIN_LAUNCH_PULL = 0.12;

export const JOUST_SIMULATION_OPTIONS: Omit<JoustSimulateOptions, "seed"> = {
  maxDurationSeconds: 4,
  stepHz: 240,
  keyframeHz: 30
};

export const SLACK_JOUST_AIM: JoustAim = { x: 0, y: 0 };
