import type {
  JoustAim,
  JoustContentFile,
  JoustMinigameShot,
  JoustPhase,
  JoustPlayerFigure,
  JoustShotResult,
  JoustSimulateOptions
} from "@wingnight/shared";

export type JoustRuntimeContent = JoustContentFile;

export type JoustRuntimeRules = {
  shotsPerPlayer: number;
};

export type JoustRuntimeState = {
  activeTurnTeamId: string | null;
  // Locked at initialize so a mid-turn reconnect rehydrates the same lane.
  arenaId: string | null;
  // Every player NOT on the shooting team, in the order they are racked up, locked at initialize
  // for the same reason: the columns must hold still while the rack thins out.
  lineup: JoustPlayerFigure[];
  // The shooting team, stood behind the slingshot. Scenery, and the room's turn marker.
  teammates: JoustPlayerFigure[];
  // Everyone this turn has already put on the sand. They sit out the remaining shots, which is
  // what makes three shots a bowling frame rather than three identical ones.
  downPlayerIds: string[];
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

/**
 * Everyone on the shooting team pulls the band, in roster order — that is what makes a turn go
 * round the table rather than to whoever grabbed the tablet. A team's shots are therefore its own
 * size, and this is only how many each of them gets.
 */
export const DEFAULT_JOUST_SHOTS_PER_PLAYER = 1;

/** One point a head, like bowling counts pins — the shot that fells five is worth five. */
export const JOUST_POINTS_PER_TOPPLE = 1;
/** For a shot that leaves nobody standing. The only bonus in the game, and the one to chase. */
export const JOUST_RACK_CLEARED_BONUS = 3;

// A band drawn less than this is a fumble, not a shot: the reducer refuses to
// launch it rather than burning one of the team's attempts on a twitch.
export const JOUST_MIN_LAUNCH_PULL = 0.12;

// A rack going over takes longer to settle than a single champ ever did, so the cap is generous;
// 24 keyframes a second keeps the track that buys inside the room snapshot's budget.
export const JOUST_SIMULATION_OPTIONS: Omit<JoustSimulateOptions, "seed"> = {
  maxDurationSeconds: 4.5,
  stepHz: 240,
  keyframeHz: 24
};

export const SLACK_JOUST_AIM: JoustAim = { x: 0, y: 0 };
