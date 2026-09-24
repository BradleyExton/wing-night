import type {
  JoustAim,
  JoustMinigameShot,
  JoustPhase,
  JoustPlayerFigure,
  JoustPrompt,
  JoustShotGhost,
  JoustShotResult,
  JoustSimulateOptions
} from "@wingnight/shared";

import type { JoustRuntimeShooter } from "../loadout/index.js";

// The content file as the runtime reads it: the lanes, and the loadout with every kind resolved
// (`loadout/`). `shooters` is never empty — a file that authors none gets the Standard kind.
export type JoustRuntimeContent = {
  prompts: JoustPrompt[];
  shooters: JoustRuntimeShooter[];
};

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
  // Every tower this turn has brought down, by index into the lane's perches. Rubble from then
  // on: nothing is built for it, and everyone who stood on it is in `downPlayerIds`.
  collapsedPerchIndices: number[];
  // The shot before the one being aimed, for the next teammate to adjust off. Null on shot one.
  previousShotGhost: JoustShotGhost | null;
  // Which kind of projectile is on the band, by id into the content's loadout. Reset to the
  // default kind on every fresh band so a spent kind is never left selected.
  selectedShooterId: string;
  // Every kind this turn has fired, one entry per pull, so a rationed kind counts down and comes
  // back with `resetTurn`. A skipped shot fires nothing and spends nothing.
  usedShooterIds: string[];
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

/**
 * A player is worth what they were stood on: one a head on the sand, like bowling counts pins,
 * and more up a tower (`resolveJoustPerchPoints`). The tower is the harder target and the bigger
 * prize, which is what makes it a choice rather than a nuisance.
 */
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
